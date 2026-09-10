import { expect, test } from "@playwright/test";

test("playgrounds retain independent settings across panel switches and resets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("button", { name: "Open Button controls" }).click();
  const navigation = page.getByRole("navigation", { name: "Manual index" });
  const visit = (name: string) => navigation.getByRole("link", { name, exact: true }).click();

  await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("destructive");
  await visit("Card");
  await page.getByRole("checkbox", { name: "Footer", exact: true }).uncheck();
  await visit("Input");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("search");
  await expect(page.getByRole("searchbox", { name: "Try an input" })).toBeVisible();

  await visit("Button");
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("destructive");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("solid");
  await visit("Card");
  await expect(page.getByRole("checkbox", { name: "Footer", exact: true })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Open workspace" })).toHaveCount(0);
  await visit("Input");
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("search");
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.getByRole("button", { name: "Open Input controls" }).click();
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("search");
});

test("panel stays within the viewport when resized open or closed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls", includeHidden: true });
  await trigger.click();
  const panel = page.getByRole("region", { name: "Button controls" });
  for (const { width, expected } of [{ width: 320, expected: 288 }, { width: 768, expected: 360 }, { width: 375, expected: 343 }]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(panel).toHaveCSS("width", `${expected}px`);
    const bounds = await panel.evaluate((element) => ({ x: element.getBoundingClientRect().x, width: element.getBoundingClientRect().width }));
    expect(bounds.x).toBeGreaterThanOrEqual(16);
    expect(bounds.x + bounds.width).toBeCloseTo(width - 16, 0);
  }
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Button", exact: true }).click();
  await expect(trigger).toHaveCSS("width", "44px");
  await expect(trigger).toHaveCSS("height", "44px");
  await trigger.click();
  await expect(panel).toHaveCSS("width", "288px");
});

test("panel reveals from its trigger without resizing its text layout", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls", includeHidden: true });
  const panel = page.getByRole("region", { name: "Button controls", includeHidden: true });
  const expanded = await page.evaluate(() => Math.min(360, innerWidth - 32));
  const sample = () => panel.evaluate(async (element) => {
    const frames: { width: number; clip: string; opacity: number }[] = [];
    for (let frame = 0; frame < 30; frame++) {
      await new Promise(requestAnimationFrame);
      const styles = getComputedStyle(element);
      frames.push({ width: element.getBoundingClientRect().width, clip: styles.clipPath, opacity: Number(styles.opacity) });
    }
    return frames;
  });
  for (const { action, opacity } of [
    { action: trigger, opacity: "1" },
    { action: page.getByRole("button", { name: "Close controls" }), opacity: "0" },
  ]) {
    const samples = sample();
    await action.click();
    const frames = await samples;
    expect(frames.every(frame => Math.abs(frame.width - expanded) < 1)).toBe(true);
    expect(new Set(frames.map(frame => frame.clip)).size).toBeGreaterThan(2);
    expect(frames.some(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
    await expect(panel).toHaveCSS("opacity", opacity);
  }
});

test("keyboard opening is instant and reduced motion fades without a moving reveal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("region", { name: "Button controls" });
  await expect(panel).toBeFocused();
  const opened = await panel.evaluate(element => ({ clip: getComputedStyle(element).clipPath, opacity: getComputedStyle(element).opacity }));
  expect(opened).toEqual({ clip: "inset(0px round 12px)", opacity: "1" });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await expect(panel).toHaveCSS("clip-path", "inset(0px round 12px)");
  await expect(panel).toHaveCSS("opacity", "1");
});

test("pointer-held controls stay pinned until release outside the panel", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse hold is covered on desktop; mobile retains the focus checks.");
  await page.goto("/#button");
  await page.getByRole("button", { name: "Open Button controls" }).click();
  const heading = page.getByRole("heading", { name: "Button controls" });
  await heading.hover();
  await page.mouse.down();
  await page.getByRole("heading", { level: 2, name: "Card", exact: true }).evaluate(element => {
    (document.activeElement as HTMLElement)?.blur();
    element.scrollIntoView({ block: "start" });
  });
  await expect(heading).toBeVisible();
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await expect(page.getByRole("region", { name: "Card controls" })).toBeVisible();
});

test("a closing reveal can reverse without hiding or remounting the controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls", includeHidden: true });
  await trigger.click();
  const panel = page.getByRole("region", { name: "Button controls", includeHidden: true });
  await expect(panel).toHaveCSS("opacity", "1");
  await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("destructive");
  await page.getByRole("button", { name: "Close controls" }).dispatchEvent("click", { detail: 1 });
  const closing = await panel.evaluate(async element => {
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    return Number(getComputedStyle(element).opacity);
  });
  expect(closing).toBeGreaterThan(0);
  expect(closing).toBeLessThan(1);
  await trigger.dispatchEvent("click", { detail: 1 });
  await expect(panel).toHaveCSS("opacity", "1");
  await expect(panel).toHaveCSS("clip-path", "inset(0px round 12px)");
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("destructive");
  await expect(panel).toBeFocused();
});
