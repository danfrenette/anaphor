import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("badges remain readable in both themes and controls reset", async ({ page }) => {
  await page.goto("/#badge");
  await expect(page.getByRole("heading", { name: "Badge", exact: true })).toBeVisible();
  const result = await new AxeBuilder({ page }).include("#badge").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(result.violations).toEqual([]);
  await page.locator(".fixed").evaluateAll(elements => elements.forEach(element => (element as HTMLElement).style.visibility = "hidden"));
  await expect(page.locator("#badge")).toHaveScreenshot("badge.png");
  await page.locator(".fixed").evaluateAll(elements => elements.forEach(element => (element as HTMLElement).style.visibility = ""));
  await page.getByRole("button", { name: "Open Badge controls" }).click();
  await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("outline");
  await page.getByRole("checkbox", { name: "Icon", exact: true }).check();
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("soft");
  await expect(page.getByRole("checkbox", { name: "Icon", exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
