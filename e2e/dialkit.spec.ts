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
