import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("morph surface sliders support keyboard and numeric editing and reset", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const radius = page.getByRole("slider", { name: "Radius", exact: true });
  await radius.focus();
  await radius.press("ArrowRight");
  await expect(radius).toHaveAttribute("aria-valuenow", "12");
  await expect(page.getByTestId("primary-button")).toHaveCSS("border-radius", "12px");
  await radius.press("Enter");
  await page.getByRole("textbox", { name: "Radius value" }).fill("18");
  await page.getByRole("textbox", { name: "Radius value" }).press("Enter");
  await expect(radius).toHaveAttribute("aria-valuenow", "18");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(radius).toHaveAttribute("aria-valuenow", "10");
  expect((await new AxeBuilder({ page }).include('[data-slot="morph-surface"]').analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("clicking a slider supports immediate keyboard adjustment and numeric editing", async ({ page }) => {
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const radius = page.getByRole("slider", { name: "Radius", exact: true });
  const rect = (await radius.boundingBox())!;
  await radius.click({ position: { x: rect.width / 2, y: rect.height / 2 } });
  await expect(radius).toBeFocused();
  await expect(radius).toHaveAttribute("aria-valuenow", "12");
  await page.keyboard.press("ArrowRight");
  await expect(radius).toHaveAttribute("aria-valuenow", "14");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("textbox", { name: "Radius value" })).toBeFocused();
});

test("the visible fill follows rounded values and resets during a click spring", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const radius = page.getByRole("slider", { name: "Radius", exact: true });
  const rect = (await radius.boundingBox())!;
  // Measure the rendered fill, since the ARIA value alone cannot catch a stale visual.
  const fillError = (expected: number) => radius.evaluate(async (element, expected) => {
    const fill = element.querySelector(".dialkit-slider-fill")!;
    let error = 0;
    for (let frame = 0; frame < 4; frame++) {
      await new Promise(requestAnimationFrame);
      const fraction = fill.getBoundingClientRect().width / element.getBoundingClientRect().width;
      error = Math.max(error, Math.abs(fraction - expected));
    }
    return error;
  }, expected);
  await radius.click({ position: { x: rect.width * 0.3, y: rect.height / 2 } });
  await expect(radius).toHaveAttribute("aria-valuenow", "8");
  await expect.poll(() => fillError(8 / 24)).toBeLessThan(0.002);

  await radius.click({ position: { x: rect.width * 0.8, y: rect.height / 2 } });
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(radius).toHaveAttribute("aria-valuenow", "10");
  await expect.poll(() => fillError(10 / 24)).toBeLessThan(0.002);
});
