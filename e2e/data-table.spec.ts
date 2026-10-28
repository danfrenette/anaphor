import { expect, test } from "@playwright/test";

test("table exploration preserves selection across pages and configures columns", async ({ page }) => {
  await page.goto("/#data-table");
  await page.getByRole("tab", { name: "Advanced", exact: true }).click();
  const section = page.getByRole("group", { name: "Data table preview", exact: true });
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
  await page.getByRole("tab", { name: "Advanced", exact: true }).click();
  const section = page.locator("#data-table");
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((el, dark) => el.classList.toggle("dark", dark), theme === "dark");
    for (const label of ["Borderless", "Horizontal rules", "Full grid", "Compact", "Editorial"]) {
      await section.getByRole("tab", { name: ["Compact", "Editorial"].includes(label) ? "Density" : "Treatments", exact: true }).click();
      const preview = section.getByRole("region", { name: `${label} table preview`, exact: true });
      await expect(preview).toHaveCSS("border-top-left-radius", "4px");
      await expect(preview.getByRole("table")).toHaveAccessibleName(`${label} project comparison`);
      await expect(preview.getByRole("row")).toHaveCount(4);
      await expect(preview.getByRole("columnheader")).toHaveCount(3);
    }
    await section.getByRole("tab", { name: "Treatments", exact: true }).click();
    const grid = section.getByRole("region", { name: "Full grid table preview", exact: true });
    const hairline = await grid.evaluate(el => getComputedStyle(el).getPropertyValue("--anaphor-border-hairline").trim());
    await expect(grid).toHaveCSS("border-top-width", `${parseFloat(hairline)}px`);
    await expect(grid.getByRole("table")).toHaveCSS("border-collapse", "separate");
    await expect(grid.getByRole("columnheader").first()).toHaveCSS("border-top-width", "0px");
    await expect(grid.getByRole("columnheader").last()).toHaveCSS("border-right-width", "0px");
    await expect(grid.getByRole("row").last().getByRole("cell").first()).toHaveCSS("border-bottom-width", "0px");
    await section.getByRole("tab", { name: "Density", exact: true }).click();
    const rowHeight = (label: string) => section.getByRole("region", { name: `${label} table preview`, exact: true }).getByRole("row").nth(1).evaluate(el => el.getBoundingClientRect().height);
    const [compactHeight, editorialHeight] = await Promise.all([rowHeight("Compact"), rowHeight("Editorial")]);
    expect(editorialHeight).toBeGreaterThan(compactHeight);
    expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  await section.getByRole("tab", { name: "Treatments", exact: true }).click();
  const trigger = section.getByRole("button", { name: "Show table treatments code" });
  await trigger.press("Enter");
  await expect(section.getByLabel("Table treatments code", { exact: true })).toBeVisible();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("inset card hover follows the row bounds and radius", async ({ page }) => {
  await page.goto("/#data-table");
  await page.getByRole("tab", { name: "Advanced", exact: true }).click();
  const section = page.locator("#data-table");
  await section.getByRole("button", { name: "Full grid", exact: true }).click();
  const row = section.locator("li[data-fluid-row]").first();
  await page.setViewportSize({ width: 600, height: 900 });
  await row.hover();
  const highlight = section.locator('[data-slot="table-hover"]');
  if (!await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches)) {
    await expect(highlight).toHaveCount(0);
    return;
  }
  await expect(highlight).toHaveCSS("border-radius", "8px");
  await expect.poll(async () => {
    const [rowBox, highlightBox] = await Promise.all([row.boundingBox(), highlight.boundingBox()]);
    return rowBox && highlightBox ? Math.abs(rowBox.x - highlightBox.x) + Math.abs(rowBox.width - highlightBox.width) : Infinity;
  }).toBeLessThan(1);
});

test("table states and filter reset preserve layout", async ({ page }) => {
  await page.goto("/#data-table");
  await page.getByRole("tab", { name: "Advanced", exact: true }).click();
  const section = page.locator("#data-table");
  const preview = section.getByRole("group", { name: "Data table preview", exact: true });
  const search = section.getByRole("searchbox", { name: "Search projects" });
  await search.click();
  const searchBefore = await search.boundingBox();
  await search.fill("a");
  const searchAfter = await search.boundingBox();
  expect(searchAfter?.width).toBe(searchBefore?.width);
  await section.getByRole("button", { name: "Clear search", exact: true }).click();
  await page.getByRole("tab", { name: "Open Data table controls", exact: true }).click();
  const choose = async (label: string, option: string) => {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("menuitemradio", { name: option, exact: true }).click();
  };
  for (const density of ["Compact", "Editorial"]) {
    await choose("Density", density);
    const height = await preview.evaluate(el => el.getBoundingClientRect().height);
    for (const state of ["Loading", "Empty", "Error", "Records"]) {
      await choose("Preview state", state);
      await expect.poll(() => preview.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
      if (state !== "Records") {
        await expect(preview.getByRole("checkbox")).toHaveCount(0);
        await expect(preview.getByRole("button", { name: "Next page" })).toHaveCount(0);
      }
    }
  }
});
