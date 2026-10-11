import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("notification frequency supports labels, arrows, and native form submission", async ({ page }) => {
  await page.goto("/#radio-group");
  const form = page.getByRole("form", { name: "Notification preferences" });
  const group = form.getByRole("radiogroup", { name: "Notification frequency" });
  const daily = group.getByRole("radio", { name: "Daily digest" });
  const weekly = group.getByRole("radio", { name: "Weekly digest" });
  await expect(daily).toBeChecked();
  await group.getByText("Weekly digest", { exact: true }).click();
  await expect(weekly).toBeChecked();
  await expect(daily).not.toBeChecked();
  await weekly.press("ArrowUp");
  await expect(daily).toBeFocused();
  await expect(daily).toBeChecked();
  await form.getByRole("button", { name: "Save preference" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved: Daily digest.");
});

test("required choices show feedback on submit and clear it on selection", async ({ page }) => {
  await page.goto("/#radio-group");
  const form = page.getByRole("form", { name: "Required notification preference" });
  const group = form.getByRole("radiogroup", { name: "Choose a frequency" });
  await expect(form.getByText("Choose a notification frequency.")).toBeHidden();
  await form.getByRole("button", { name: "Save required preference" }).click();
  await expect(form.getByText("Choose a notification frequency.")).toBeVisible();
  await expect(group).toHaveAttribute("aria-invalid", "true");
  await group.getByText("Weekly digest", { exact: true }).click();
  await expect(form.getByText("Choose a notification frequency.")).toBeHidden();
  await form.getByRole("button", { name: "Save required preference" }).click();
  await expect(form.getByRole("status")).toHaveText("Preference saved.");
});

test("disabled choices are skipped and read-only selection stays fixed", async ({ page }) => {
  await page.goto("/#radio-group");
  const available = page.getByRole("radiogroup", { name: "Digest availability" });
  await available.getByRole("radio", { name: "Daily digest" }).press("ArrowDown");
  await expect(available.getByRole("radio", { name: "Weekly digest" })).toBeFocused();
  await expect(available.getByRole("radio", { name: "Weekly digest" })).toBeChecked();
  await expect(available.getByRole("radio", { name: "Every update" })).not.toBeChecked();
  const fixed = page.getByRole("radiogroup", { name: "Fixed frequency" });
  const daily = fixed.getByRole("radio", { name: "Daily digest" });
  await daily.press("ArrowDown");
  await fixed.getByText("Weekly digest", { exact: true }).click();
  await expect(daily).toBeChecked();
  await expect(fixed.getByRole("radio", { name: "Weekly digest" })).not.toBeChecked();
  await fixed.getByRole("radio", { name: "Weekly digest" }).press("Tab");
  await expect(page.getByRole("radiogroup", { name: "Unavailable frequency" }).getByRole("radio").first()).not.toBeFocused();
});

test("controls reset the controlled frequency and state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#radio-group");
  const form = page.getByRole("form", { name: "Notification preferences" });
  await form.getByText("Weekly digest", { exact: true }).click();
  await page.getByRole("tab", { name: "Open Radio group controls" }).click();
  await page.getByRole("checkbox", { name: "Invalid", exact: true }).check();
  await expect(form.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(form.getByRole("radio", { name: "Daily digest" })).toBeChecked();
  await expect(form.getByRole("radiogroup")).not.toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Close controls" }).click();
});

test("radio appearance, focus, themes and narrow reflow remain accessible", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#radio-group");
  const form = page.getByRole("form", { name: "Notification preferences" });
  const daily = form.getByRole("radio", { name: "Daily digest" });
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    await daily.press("ArrowUp");
    const every = form.getByRole("radio", { name: "Every update" });
    await expect(every).toHaveCSS("outline-style", "solid");
    await expect(every).toHaveCSS("outline-width", "2px");
    await expect(every).toHaveCSS("width", "20px");
    await expect(every).toHaveCSS("height", "20px");
    const accessibility = await new AxeBuilder({ page }).include("#radio-group").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).disableRules(["color-contrast"]).analyze();
    expect(accessibility.violations).toEqual([]);
    // Match the manual's approved accent-solid Button contrast exception.
    const contrast = await new AxeBuilder({ page }).include("#radio-group").withRules(["color-contrast"]).exclude('[data-tone="accent"][data-variant="solid"]').analyze();
    expect(contrast.violations).toEqual([]);
    const overflow = await page.locator("#radio-group").evaluate(element => element.scrollWidth > element.clientWidth);
    expect(overflow).toBe(false);
    await form.screenshot({ path: testInfo.outputPath(`radio-${theme}.png`) });
    await every.press("ArrowDown");
  }
  await expect(daily).toHaveCSS("transition-duration", "0s");
  await page.locator("html").evaluate(element => { element.style.zoom = "2"; });
  expect(await page.locator("#radio-group").evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
  await expect(form.getByRole("button", { name: "Save preference" })).toBeVisible();
  await page.locator("html").evaluate(element => { element.style.zoom = "1"; });
  await page.emulateMedia({ forcedColors: "active" });
  await daily.press("ArrowUp");
  const every = form.getByRole("radio", { name: "Every update" });
  await expect(every).toBeChecked();
  await expect(every).toHaveCSS("outline-width", "2px");
  await form.screenshot({ path: testInfo.outputPath("radio-forced-colors.png") });
});

test("the control and label gap provide a 44px target without enlarging the circle", async ({ page, isMobile }) => {
  await page.goto("/#radio-group");
  const form = page.getByRole("form", { name: "Notification preferences" });
  const every = form.getByRole("radio", { name: "Every update" });
  await every.scrollIntoViewIfNeeded();
  const box = (await every.boundingBox())!;
  const edges = await every.evaluate(element => {
    const box = element.getBoundingClientRect();
    // The 2px border makes the padded target span [-12, 32); sample inside
    // its far edge rather than on the next element's exclusive boundary.
    const points: [number, number][] = [[box.x - 12, box.y + 10], [box.x + 10, box.y - 12], [box.x + 10, box.y + 31]];
    return points.map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit !== null && element.contains(hit);
    });
  });
  expect(edges).toEqual([true, true, true]);
  if (isMobile) await page.touchscreen.tap(box.x - 12, box.y + 10);
  else await page.mouse.click(box.x - 12, box.y + 10);
  await expect(every).toBeChecked();
  const daily = form.getByRole("radio", { name: "Daily digest" });
  await daily.scrollIntoViewIfNeeded();
  const dailyBox = (await daily.boundingBox())!;
  if (isMobile) await page.touchscreen.tap(dailyBox.x + dailyBox.width + 6, dailyBox.y + 10);
  else await page.mouse.click(dailyBox.x + dailyBox.width + 6, dailyBox.y + 10);
  await expect(daily).toBeChecked();
  await expect(every).not.toBeChecked();
  expect(box.width).toBe(20);
  expect(box.height).toBe(20);
});
