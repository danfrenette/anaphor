import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`content-shaped skeleton preserves wrapped geometry in ${theme} theme`, async ({ page }) => {
    await page.goto("/#skeleton");
    await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
    const section = page.locator("#skeleton");
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const region = section.locator('[data-slot="skeleton-region"]:visible');
    const geometry = () => region.locator('[data-slot="skeleton-text"]').evaluateAll(elements =>
      elements.map(element => Array.from(element.getClientRects(), rect => ({ width: rect.width, height: rect.height, x: rect.x, y: rect.y }))));
    const before = await geometry();
    expect(before.length).toBe(4);
    expect(before[2]?.length).toBeGreaterThan(1);
    await expect(region.getByRole("heading")).toHaveCount(0);
    await expect(region.locator("[inert]")).toHaveCount(1);
    await section.getByRole("button", { name: "Show content" }).click();
    await expect(region.getByRole("heading", { name: "Room for the work" })).toBeVisible();
    expect(await geometry()).toEqual(before);
    await expect(region.locator("[inert]")).toHaveCount(0);
    await expect(region.getByRole("status")).toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("effects support keyboard selection and static reduced motion", async ({ page }) => {
  await page.goto("/#skeleton");
  const section = page.locator("#skeleton");
  const pulse = section.getByRole("tab", { name: "Pulse", exact: true });
  await pulse.focus();
  await pulse.press("ArrowRight");
  const sheen = section.getByRole("tab", { name: "Sheen", exact: true });
  await expect(sheen).toBeFocused();
  await sheen.press("Enter");
  await expect(sheen).toHaveAttribute("aria-selected", "true");
  const text = section.locator('[data-slot="skeleton-text"]:visible').first();
  await expect(text).toHaveCSS("animation-name", "anaphor-skeleton-sheen");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(text).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await section.getByRole("tab", { name: "Static", exact: true }).click();
  await expect(section.locator('[data-slot="skeleton-text"]:visible').first()).toHaveCSS("animation-name", "none");
});
