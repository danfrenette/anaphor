import { expect, test } from "@playwright/test";

test("table exploration preserves selection across pages and configures columns", async ({ page }) => {
  await page.goto("/#data-table");
  const section = page.locator("#data-table");
  const search = section.getByRole("searchbox", { name: "Search projects" });
  await search.click();
  await search.fill("waterfront");
  await expect(section.getByText("1–1 of 1", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toBeFocused();
  await section.getByRole("checkbox", { name: "Select Neighborhood field guide", exact: true }).check();
  await section.getByRole("button", { name: "Next page" }).click();
  await expect(section.getByText("1 selected", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Previous page" }).click();
  await expect(section.getByRole("checkbox", { name: "Select Neighborhood field guide", exact: true })).toBeChecked();
  await section.getByRole("button", { name: "Configure columns" }).click();
  const dialog = page.getByRole("dialog", { name: "Columns", exact: true });
  await dialog.getByRole("checkbox", { name: "Owner", exact: true }).uncheck();
  await expect(section.getByText("Amara Okafor", { exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Move Project later", exact: true }).click();
  await dialog.getByRole("button", { name: "Reset columns" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await section.getByRole("button", { name: "Actions for Neighborhood field guide", exact: true }).click();
  await page.getByRole("menuitem", { name: "Deselect project", exact: true }).click();
  await expect(section.getByText("0 selected", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
