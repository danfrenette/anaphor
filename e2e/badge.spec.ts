import { test, expect } from "@playwright/test";
import { prepareContentSnapshot } from "./content-snapshot";

test("badges match their visual baseline without page overflow", async ({ page }) => {
  await page.goto("/#badge");
  await expect(page.getByRole("heading", { name: "Badge", exact: true })).toBeVisible();
  const screenshotStyle = await prepareContentSnapshot(page);
  await page.locator("#badge").evaluate(element => element.scrollIntoView({ block: "start", behavior: "instant" }));
  await expect(page.locator("#badge")).toHaveScreenshot("badge.png");
  await screenshotStyle.evaluate(element => element.parentNode?.removeChild(element));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
