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
    await section.getByRole("button", { name: "Show content" }).scrollIntoViewIfNeeded();
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

test("media fades into reserved space while text and interaction are immediate", async ({ page }) => {
  await page.goto("/#skeleton");
  const section = page.locator("#skeleton");
  const region = section.locator('[data-slot="skeleton-region"]:visible');
  const media = region.locator('[data-slot="skeleton-box-content"]');
  await section.getByRole("button", { name: "Show content" }).scrollIntoViewIfNeeded();
  const bounds = await media.boundingBox();
  expect(bounds).not.toBeNull();
  await section.getByRole("button", { name: "Show content" }).click();
  const halfwayOpacity = await media.evaluate(element => {
    const transition = element.getAnimations()[0];
    if (!transition) return null;
    transition.pause();
    transition.currentTime = 100;
    const opacity = Number(getComputedStyle(element).opacity);
    transition.finish();
    return opacity;
  });
  expect(halfwayOpacity).toBeGreaterThan(0);
  expect(halfwayOpacity).toBeLessThan(1);
  await expect(region.getByRole("heading", { name: "Room for the work" })).toBeVisible();
  await expect(region.locator("[inert]")).toHaveCount(0);
  await expect(region.locator('[data-slot="skeleton-text"]').first()).toHaveCSS("transition-duration", "0s");
  const revealedBounds = await media.boundingBox();
  expect(revealedBounds?.width).toBe(bounds?.width);
  expect(revealedBounds?.height).toBe(bounds?.height);
  expect(revealedBounds?.x).toBeCloseTo(bounds?.x ?? 0, 1);
  expect(revealedBounds?.y).toBeCloseTo(bounds?.y ?? 0, 1);
  await expect(media).toHaveCSS("transition-duration", "0.2s");
  await expect(media).toHaveCSS("opacity", "1");

  await section.getByRole("button", { name: "Show loading" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await section.getByRole("button", { name: "Show content" }).click();
  await expect(media).toHaveCSS("transition-duration", "0.16s");
  await expect(media).toHaveCSS("opacity", "1");
});


test("skeleton catalog exposes shape and effect references with inline code", async ({ page }) => {
  await page.goto("/#skeleton");
  const section = page.locator("#skeleton");
  for (const name of ["Shapes", "Effects", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const effects = section.getByRole("region", { name: "Effects", exact: true });
  await expect(effects.locator('[data-slot="skeleton"]')).toHaveCount(3);
  const trigger = section.getByRole("button", { name: "Show shapes code" });
  await trigger.press("Enter");
  await expect(section.getByLabel("Shapes code", { exact: true })).toBeVisible();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const shape of await effects.locator('[data-slot="skeleton"]').all()) {
    await expect(shape).toHaveCSS("animation-name", "none");
  }
});
