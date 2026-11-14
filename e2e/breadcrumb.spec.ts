import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("breadcrumb paths retain native navigation and caller-owned browsing and focus", async ({ page }) => {
  await page.goto("/#breadcrumb");
  const section = page.locator("#breadcrumb");
  const chapter = section.getByRole("navigation", { name: "Chapter browsing path" });
  const current = chapter.getByRole("button", { name: "1.2.1 Experimental design" });
  await expect(current).toHaveAttribute("aria-current", "location");
  await current.press("Space");
  await expect(current).toBeFocused();
  const parent = chapter.getByRole("button", { name: "1.2 Sampling" });
  await parent.press("Enter");
  await expect(parent).toBeFocused();
  await expect(parent).toHaveAttribute("aria-current", "location");
  await expect(chapter.getByRole("button")).toHaveCount(2);
  const ancestry = section.getByRole("navigation", { name: "Section ancestry" });
  await expect(ancestry.locator("[aria-current]")).toHaveCount(0);
  await ancestry.getByRole("button", { name: "1.2 Sampling" }).click();
  await expect(section.getByRole("heading", { name: "1.2 Sampling", exact: true }).last()).toBeFocused();
  await expect(ancestry.getByRole("button")).toHaveCount(1);
  await expect(page).toHaveURL(/#breadcrumb$/);
  const links = section.getByRole("navigation", { name: "Page path" });
  await links.getByRole("link", { name: "Manual", exact: true }).click();
  await expect(page).toHaveURL(/#purpose$/);
  await expect(page.getByRole("navigation", { name: "Manual location" })).toHaveText("Manual/Overview");
});

test("breadcrumbs reflow with decorative separators and accessible light and dark targets", async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#breadcrumb");
  const section = page.locator("#breadcrumb");
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((el, value) => el.classList.toggle("dark", value), dark);
    const targets = await section.locator("a, button[data-slot=breadcrumb-button]").evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { height: rect.height, width: rect.width, fits: el.scrollWidth <= el.clientWidth };
    }));
    expect(targets.every(target => target.fits)).toBe(true);
    if (isMobile) expect(targets.every(target => target.height >= 44 && target.width >= 44)).toBe(true);
    await expect(section.locator("[data-slot=breadcrumb-separator]:not([aria-hidden=true])")).toHaveCount(0);
    await expect(section.locator("a [data-slot=breadcrumb-separator], button [data-slot=breadcrumb-separator]")).toHaveCount(0);
    expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const separatorOffsets = await section.locator('[data-slot="breadcrumb-item"]').evaluateAll(items => items.flatMap(item => {
      const separator = item.querySelector('[data-slot="breadcrumb-separator"]');
      const label = item.querySelector('a, button, [data-slot="breadcrumb-current"]');
      if (!separator || !label) return [];
      const range = document.createRange();
      range.selectNodeContents(label);
      const firstLine = range.getClientRects()[0];
      if (!firstLine) return [];
      const marker = separator.getBoundingClientRect();
      return [Math.abs(marker.y + marker.height / 2 - (firstLine.y + firstLine.height / 2))];
    }));
    expect(separatorOffsets.every(offset => offset <= 1)).toBe(true);
    expect((await new AxeBuilder({ page }).include("#breadcrumb").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await section.getByRole("heading", { name: "Breadcrumb", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`breadcrumb-${dark ? "dark" : "light"}.png`) });
    await section.getByRole("navigation", { name: "Research path" }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`breadcrumb-long-${dark ? "dark" : "light"}.png`) });
  }
});

test("long-path source link opens the matching local example", async ({ page }) => {
  await page.goto("/#breadcrumb");
  const path = page.getByRole("navigation", { name: "Research path" });
  await path.getByRole("link", { name: "Interdisciplinary research methodology and experimental design", exact: true }).click();
  await expect(page).toHaveURL(/#breadcrumb-research-source$/);
  await expect(page.locator("#breadcrumb-research-source").getByRole("heading", { name: "Interdisciplinary research methodology and experimental design", exact: true })).toBeVisible();
});
