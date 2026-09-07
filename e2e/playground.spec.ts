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
  const surface = trigger.locator("..");
  await trigger.click();
  const panel = page.getByRole("region", { name: "Button controls" });
  for (const { width, expected } of [{ width: 320, expected: 288 }, { width: 768, expected: 360 }, { width: 375, expected: 343 }]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(surface).toHaveCSS("width", `${expected}px`);
    await expect(panel).toHaveCSS("width", `${expected}px`);
    const bounds = await surface.evaluate((element) => ({ x: element.getBoundingClientRect().x, width: element.getBoundingClientRect().width }));
    expect(bounds.x).toBeGreaterThanOrEqual(16);
    expect(bounds.x + bounds.width).toBeCloseTo(width - 16, 0);
  }
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Button", exact: true }).click();
  await expect(surface).toHaveCSS("width", "44px");
  await expect(surface).toHaveCSS("height", "44px");
  await trigger.click();
  await expect(surface).toHaveCSS("width", "288px");
});

test("panel width animates through intermediate sizes in both directions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls", includeHidden: true });
  const surface = trigger.locator("..");
  const expanded = await page.evaluate(() => Math.min(360, innerWidth - 32));
  const sample = () => surface.evaluate(async (element) => {
    const widths: number[] = [];
    for (let frame = 0; frame < 45; frame++) {
      await new Promise(requestAnimationFrame);
      widths.push(element.getBoundingClientRect().width);
    }
    return widths;
  });
  for (const { action, width } of [
    { action: trigger, width: expanded },
    { action: page.getByRole("button", { name: "Close controls" }), width: 44 },
  ]) {
    const samples = sample();
    await action.click();
    expect((await samples).some((value) => value > 45 && value < expanded - 1)).toBe(true);
    await expect(surface).toHaveCSS("width", `${width}px`);
  }
});
