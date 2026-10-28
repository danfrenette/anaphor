import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("shared catalog keeps selection across layouts and exposes recovery without fake rows", async ({ page }, testInfo) => {
  await page.goto("/#data-table");
  const catalog = page.getByRole("region", { name: "Shared catalog foundation", exact: true });
  const first = catalog.getByRole("checkbox").nth(1);
  const name = await first.getAttribute("aria-label");
  await first.focus();
  await first.press("Space");
  await expect(catalog.getByText("1 projects selected")).toBeVisible();
  await catalog.getByRole("button", { name: "Show table" }).click();
  await expect(catalog.getByRole("checkbox", { name: name ?? "" })).toBeChecked();
  await catalog.getByRole("button", { name: "Next page" }).click();
  await catalog.getByRole("button", { name: "Previous page" }).click();
  await expect(catalog.getByRole("checkbox", { name: name ?? "" })).toBeChecked();
  await catalog.getByRole("button", { name: "Show cards" }).click();
  await catalog.getByRole("searchbox", { name: "Search shared projects" }).fill("no such project");
  await expect(catalog.getByText("No matching projects. Clear the search to show all projects.")).toBeVisible();
  await catalog.getByRole("searchbox").fill("");
  await catalog.getByRole("button", { name: "loading", exact: true }).click();
  await expect(catalog.getByText("Loading projects…")).toBeVisible();
  await expect(catalog.getByRole("checkbox")).toHaveCount(0);
  await catalog.getByRole("button", { name: "error", exact: true }).click();
  await expect(catalog.getByRole("alert")).toContainText("Projects couldn’t load.");
  await catalog.getByRole("button", { name: "Retry projects" }).click();
  await expect(catalog.getByRole("list", { name: "Shared projects" })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await catalog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    const scan = await new AxeBuilder({ page }).include('section[aria-label="Shared catalog foundation"]').analyze();
    expect(scan.violations).toEqual([]);
    await catalog.screenshot({ path: testInfo.outputPath(`catalog-${theme}.png`) });
  }
});
