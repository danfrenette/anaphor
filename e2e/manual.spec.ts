import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders an accessible reference manual without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Design language" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Manual index" })).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();

  expect(accessibility.violations).toEqual([]);
  expect(
    await page.locator("html").evaluate((element) => {
      return element.scrollWidth <= element.clientWidth;
    }),
  ).toBe(true);
});

test("skip link moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("main")).toBeFocused();
});
