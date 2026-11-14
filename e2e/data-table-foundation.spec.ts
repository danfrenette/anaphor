import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("shared catalog keeps selection across layouts and exposes recovery without fake rows", async ({ page }, testInfo) => {
  await page.goto("/#data-table");
  const catalog = page.getByRole("region", { name: "Shared catalog foundation", exact: true });
  const first = catalog.getByRole("checkbox").nth(1);
  const name = await first.getAttribute("aria-label");
  await first.focus();
  await first.press("Space");
  await expect(catalog.getByText("1 project selected")).toBeVisible();
  await catalog.getByRole("tab", { name: "Table", exact: true }).click();
  await expect(catalog.getByRole("checkbox", { name: name ?? "" })).toBeChecked();
  await catalog.getByRole("button", { name: "Next page" }).click();
  await catalog.getByRole("button", { name: "Previous page" }).click();
  await expect(catalog.getByRole("checkbox", { name: name ?? "" })).toBeChecked();
  await catalog.getByRole("tab", { name: "Cards", exact: true }).click();
  await catalog.getByRole("searchbox", { name: "Search shared projects" }).fill("no such project");
  await expect(catalog.getByText("No matching projects", { exact: true })).toBeVisible();
  await catalog.getByRole("searchbox").fill("");
  await catalog.getByRole("tab", { name: "Loading", exact: true }).click();
  await expect(catalog.getByText("Loading projects…")).toBeVisible();
  await expect(catalog.getByRole("checkbox")).toHaveCount(0);
  await catalog.getByRole("tab", { name: "Error", exact: true }).click();
  await expect(catalog.getByRole("alert")).toContainText("Projects couldn’t load.");
  await catalog.getByRole("button", { name: "Retry projects" }).click();
  await expect(catalog.getByRole("list", { name: "Shared projects" })).toBeVisible();
  await catalog.getByRole("tab", { name: "Empty", exact: true }).click();
  await expect(catalog.getByText("No matching projects", { exact: true })).toBeVisible();
  await catalog.getByRole("button", { name: "Show all projects" }).click();
  await page.getByRole("tab", { name: "Treatments", exact: true }).click();
  await expect(catalog).toBeHidden();
  await page.getByRole("tab", { name: "Catalog", exact: true }).click();
  await expect(catalog).toBeVisible();
  await catalog.getByRole("tab", { name: "Cards", exact: true }).focus();
  await catalog.getByRole("tab", { name: "Cards", exact: true }).press("ArrowRight");
  await expect(catalog.getByRole("tab", { name: "Table", exact: true })).toBeFocused();
  await catalog.getByRole("tab", { name: "Cards", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await catalog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    const scan = await new AxeBuilder({ page }).include('section[aria-label="Shared catalog foundation"]').analyze();
    expect(scan.violations).toEqual([]);
    await catalog.screenshot({ path: testInfo.outputPath(`catalog-${theme}.png`) });
  }
});

test("catalog cards align by row and reflow with enlarged and translated content", async ({ page }) => {
  await page.goto("/#data-table");
  const catalog = page.getByRole("region", { name: "Shared catalog foundation", exact: true });
  const cards = catalog.locator('[data-slot="card"]');
  await expect(cards).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  const bounds = await cards.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    const details = element.querySelector("dl")!.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, details: details.top };
  }));
  for (const card of bounds) {
    for (const neighbor of bounds.filter(other => Math.abs(other.top - card.top) < 1)) {
      expect(Math.abs(neighbor.bottom - card.bottom)).toBeLessThan(1);
      expect(Math.abs(neighbor.details - card.details)).toBeLessThan(1);
    }
  }
  await cards.first().getByRole("heading").evaluate(element => {
    element.textContent = "[Ein ausführlicher Wegweiser durch die Nachbarschaft und ihre außergewöhnlichen Geschichten]";
  });
  for (const direction of ["ltr", "rtl"]) {
    await catalog.evaluate((element, dir) => {
      element.setAttribute("dir", dir);
      element.style.zoom = "2";
    }, direction);
    for (const card of await cards.all()) {
      expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      const title = await card.getByRole("heading").boundingBox();
      const details = await card.locator("dl").boundingBox();
      expect(title).not.toBeNull();
      expect(details!.y).toBeGreaterThanOrEqual(title!.y + title!.height);
    }
  }
});
