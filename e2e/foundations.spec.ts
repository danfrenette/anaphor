import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`foundation comparison stays isolated from the ${theme} global theme`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/foundations");
    await expect(page.getByTestId(`foundation-${theme}`)).toBeVisible();
    await page.getByRole("checkbox", { name: "Compare themes" }).check();
    for (const localTheme of ["light", "dark"] as const) {
      const specimen = page.getByTestId(`foundation-${localTheme}`);
      await expect(specimen).toHaveCSS("color-scheme", localTheme);
      await expect(specimen).toHaveCSS("background-color", localTheme === "dark" ? "oklch(0.12 0.008 275)" : "oklch(0.985 0.008 85)");
      await expect(specimen.getByTestId("contrast-result").first()).toContainText("Pass");
      await expect(specimen.getByTestId("contrast-result").last()).toContainText("Exception");
      await expect(specimen).not.toContainText("Measuring…");
      const ratio = async (label: string) => Number.parseFloat(await specimen.getByRole("listitem").filter({ hasText: label }).getByTestId("contrast-result").innerText());
      // Browser color conversion and 8-bit canvas rounding differ across platforms.
      expect(Math.abs(await ratio("Reading / page") - (localTheme === "light" ? 13.27 : 14.13))).toBeLessThan(0.16);
      const result = await new AxeBuilder({ page }).include(`[data-testid="foundation-${localTheme}"]`).analyze();
      expect(result.violations).toEqual([]);
    }
    expect(await page.evaluate(() => localStorage.getItem("anaphor-theme"))).toBe(theme);
    expect(await page.locator("html").evaluate(element => element.classList.contains("dark"))).toBe(theme === "dark");
    await page.getByRole("checkbox", { name: "Compare themes" }).uncheck();
    await expect(page.getByTestId(`foundation-${theme === "light" ? "dark" : "light"}`)).toBeHidden();
  });
}

test("foundation experiments are bounded, local, resettable and respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/foundations");
  const original = await page.locator("html").getAttribute("style");
  const sample = page.getByTestId("foundation-experiment");
  const radius = page.getByRole("slider", { name: "Sample radius", exact: true });
  await radius.focus();
  await page.keyboard.press("End");
  await expect(sample).toHaveCSS("border-radius", "24px");
  await page.getByRole("slider", { name: "Sample spacing", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(sample).toHaveCSS("padding", "8px");
  await page.getByRole("button", { name: "Replay motion" }).click();
  await expect(page.getByTestId("motion-sample")).toHaveCSS("transform", "none");
  await expect(page.getByTestId("motion-sample")).toHaveCSS("transition-duration", "0s");
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(sample).toHaveCSS("border-radius", "12px");
  await expect(sample).toHaveCSS("padding", "24px");
  await expect(radius).toHaveAttribute("aria-valuenow", "12");
  expect(await page.locator("html").getAttribute("style")).toBe(original);
  await page.reload();
  await expect(radius).toHaveAttribute("aria-valuenow", "12");
});

for (const theme of ["light", "dark"] as const) {
  test(`remaining foundation defaults: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/foundations");
    const specimen = page.getByTestId(`foundation-${theme}`);
    await expect(specimen).toBeVisible();
    await specimen.getByText("Theme elevation", { exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.addStyleTag({ content: "header, [data-slot='morph-surface'], a[href='#content'] { visibility: hidden !important; }" });
    await expect(specimen.locator("details").last()).toHaveScreenshot(`elevation-${theme}.png`);
    for (const [name, file] of [["Type and reading", "type"], ["Space, geometry, elevation", "geometry"], ["Motion", "motion"], ["A bounded experiment", "experiment"]]) {
      await expect(page.getByRole("region", { name, exact: true })).toHaveScreenshot(`${file}-${theme}.png`);
    }
  });
}

test("foundation defaults have deterministic theme baselines and tolerate enlarged text", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("anaphor-theme", "light"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/foundations");
  await page.getByRole("checkbox", { name: "Compare themes" }).check();
  await page.evaluate(() => document.fonts.ready);
  const snapshotStyle = await page.addStyleTag({ content: "header, [data-slot='morph-surface'], a[href='#content'] { display: none !important; }" });
  for (const theme of ["light", "dark"]) {
    const specimen = page.getByTestId(`foundation-${theme}`);
    await expect(specimen).not.toContainText("Measuring…");
    await expect(specimen).toHaveScreenshot(`foundations-${theme}.png`);
  }
  await snapshotStyle.evaluate(element => element.parentNode?.removeChild(element));
  await page.locator("html").evaluate(element => { element.style.fontSize = "200%"; });
  expect(await page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});
