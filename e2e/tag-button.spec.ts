import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("tag actions work by keyboard and pointer with retained focus", async ({ page }) => {
  await page.goto("/#tag-button");
  const section = page.locator("#tag-button");
  const research = section.getByRole("button", { name: "Remove Research", exact: true });
  await research.focus();
  await research.press("Enter");
  const addResearch = section.getByRole("button", { name: "Add Research", exact: true });
  await expect(addResearch).toBeFocused();
  await expect(section.getByText("Assigned tags: None", { exact: true })).toBeVisible();
  await addResearch.press("Space");
  await expect(research).toBeFocused();
  await section.getByRole("button", { name: "Add Analysis", exact: true }).click();
  await expect(section.getByText("Assigned tags: Research, Analysis", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Inspect Methods on Research notes" }).click();
  await expect(section.getByText("Methods belongs to Research notes. Manage it on that source.", { exact: true })).toBeVisible();
  await expect(section.getByRole("button", { name: "Unavailable", exact: true })).toBeDisabled();
  await expect(section.getByRole("button", { name: "Updating", exact: true })).toHaveAttribute("aria-busy", "true");
});

test("tag pills wrap long labels in both themes and preserve touch targets and reduced motion", async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#tag-button");
  const section = page.locator("#tag-button");
  const longTag = section.getByRole("button", { name: "Add interdisciplinaryresearchmethodologyandexperimentaldesign" });
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((el, value) => el.classList.toggle("dark", value), dark);
    await expect(longTag).toBeVisible();
    const bounds = await section.locator('[data-slot="tag-button"]').evaluateAll(elements => elements.map(el => ({
      fits: el.scrollWidth <= el.clientWidth,
      height: el.getBoundingClientRect().height,
      duration: getComputedStyle(el).transitionDuration,
    })));
    expect(bounds.every(b => b.fits)).toBe(true);
    if (isMobile) expect(bounds.every(b => b.height >= 44)).toBe(true);
    if (!isMobile) {
      const origin = section.getByRole("button", { name: "Research methods from Introduction to experimental design" });
      const originBounds = await origin.boundingBox();
      expect(originBounds?.height).toBeLessThan(48);
    }
    expect(bounds.every(b => b.duration === "0s")).toBe(true);
    expect((await new AxeBuilder({ page }).include("#tag-button").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await section.getByRole("heading", { name: "Tag button", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`tag-button-${dark ? "dark" : "light"}.png`) });
    await longTag.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`tag-button-long-${dark ? "dark" : "light"}.png`) });
  }
});
