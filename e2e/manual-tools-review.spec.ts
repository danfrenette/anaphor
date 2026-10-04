import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`manual tools show labels and unavailable guidance in ${theme}`, async ({ page, isMobile }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    const tools = page.getByRole("group", { name: "Manual tools" });
    const themeToggle = tools.getByRole("button", { name: `Switch to ${theme === "light" ? "dark" : "light"} theme` });
    const controls = tools.getByRole("tab", { name: "Component controls unavailable" });
    const code = tools.getByRole("tab", { name: "Code", exact: true });
    await expect(controls).toBeDisabled();
    await expect(controls).toHaveAccessibleDescription("Controls appear in component sections.");
    await expect(tools.getByText("Controls appear in component sections.", { exact: true })).toBeVisible();
    for (const [control, label] of [[themeToggle, "Theme"], [controls, "Controls"], [code, "Code"]] as const) {
      await expect(control.getByText(label, { exact: true })).toBeVisible();
      const bounds = await control.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      const surface = page.locator('[data-slot="morph-surface"]');
      await expect.poll(async () => (await surface.boundingBox())!.x).toBeGreaterThanOrEqual(0);
      const bounds = (await surface.boundingBox())!;
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.impeccable/review/manual-tools-${theme}-${width}-${testInfo.project.name}.png` });
    }
    expect((await new AxeBuilder({ page }).include('[data-slot="morph-surface"]').analyze()).violations).toEqual([]);
    if (isMobile) await code.tap();
    else await code.click();
    await expect(page.getByRole("region", { name: "Install Anaphor" })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 800 });
    await expect(controls.getByText("Controls", { exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page }).include('[data-slot="morph-surface"]').analyze()).violations).toEqual([]);
    await page.screenshot({ path: `.impeccable/review/manual-tools-code-${theme}-320-${testInfo.project.name}.png` });
    await page.getByRole("button", { name: "Close controls" }).click();
    if (isMobile) await themeToggle.tap();
    else await themeToggle.click();
    await expect(tools.getByRole("button", { name: `Switch to ${theme} theme` })).toBeVisible();
  });
}

test("component tools remain labeled and preserve keyboard toggling and focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#input");
  const tools = page.getByRole("group", { name: "Manual tools" });
  const controls = tools.getByRole("tab", { name: "Open Input controls" });
  const code = tools.getByRole("tab", { name: "Code", exact: true });
  await expect(controls).toBeEnabled();
  await expect(tools.getByText("Controls appear in component sections.")).toHaveCount(0);
  await controls.focus();
  await controls.press("Enter");
  await expect(controls).toBeFocused();
  await expect(controls).toHaveCSS("outline-width", "2px");
  await expect(page.getByRole("region", { name: "Input controls" })).toBeVisible();
  await controls.press("Enter");
  await expect(controls).toHaveAttribute("aria-expanded", "false");
  await controls.press("ArrowRight");
  await expect(code).toBeFocused();
  await code.press("Enter");
  await expect(page.getByRole("region", { name: "Input code" })).toBeVisible();
  await code.press("Tab");
  await page.keyboard.press("Escape");
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("aria-expanded", "false");
});

test("narrow component tool labels fit and open controls with touch", async ({ page, isMobile }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#input");
  const tools = page.getByRole("group", { name: "Manual tools" });
  const controls = tools.getByRole("tab", { name: "Open Input controls" });
  await expect(controls.getByText("Controls", { exact: true })).toBeVisible();
  if (isMobile) await controls.tap();
  else await controls.click();
  await expect(page.getByRole("region", { name: "Input controls" })).toBeVisible();
  const bounds = (await tools.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(24);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(296);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const code = tools.getByRole("tab", { name: "Code", exact: true });
  if (isMobile) await code.tap();
  else await code.click();
  await expect(page.getByRole("region", { name: "Input code" })).toBeVisible();
  expect((await new AxeBuilder({ page }).include('[data-slot="morph-surface"]').analyze()).violations).toEqual([]);
  await controls.click();
  await page.screenshot({ path: `.impeccable/review/manual-tools-open-320-${testInfo.project.name}.png` });
});
