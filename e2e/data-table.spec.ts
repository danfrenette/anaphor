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

test("table catalog compares treatments and density with accessible inline code", async ({ page }) => {
  await page.goto("/#data-table");
  const section = page.locator("#data-table");
  for (const name of ["Table treatments", "Density", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((el, dark) => el.classList.toggle("dark", dark), theme === "dark");
    for (const label of ["Borderless", "Horizontal rules", "Full grid", "Compact", "Editorial"]) {
      const preview = section.getByRole("region", { name: `${label} table preview`, exact: true });
      await expect(preview.getByRole("table")).toHaveAccessibleName(`${label} project comparison`);
      await expect(preview.getByRole("row")).toHaveCount(4);
      await expect(preview.getByRole("columnheader")).toHaveCount(3);
    }
    const heights = await Promise.all(["Compact", "Editorial"].map(label => section.getByRole("region", { name: `${label} table preview`, exact: true }).getByRole("row").nth(1).evaluate(el => el.getBoundingClientRect().height)));
    expect(heights[1]).toBeGreaterThan(heights[0]);
    expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  const trigger = section.getByRole("button", { name: "Show table treatments code" });
  await trigger.press("Enter");
  await expect(section.getByLabel("Table treatments code", { exact: true })).toBeVisible();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});
