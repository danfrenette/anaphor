import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const sidebar = (page: import("@playwright/test").Page) =>
  page.locator('[data-slot="sidebar"]');

test("resize is opt-in and the layout honors provider-local width changes", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop width is independent of the mobile drawer");
  await page.goto("/");
  await expect(page.locator('[data-slot="sidebar-rail"]')).toHaveCount(0);
  const before = await sidebar(page).boundingBox();
  if (!before) throw new Error("Expected a visible desktop sidebar");
  await page.locator('[data-slot="sidebar-provider"]').evaluate(element => {
    if (element instanceof HTMLElement) element.style.setProperty("--anaphor-sidebar-drag-width", "320px");
  });
  await expect.poll(async () => (await sidebar(page).boundingBox())?.width).toBe(320);
  await expect.poll(async () => (await page.locator('[data-slot="sidebar-inset"]').boundingBox())?.x).toBe(320);
});

test("desktop pointer toggles preserve position and width, then reverse in place", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop disclosure is hidden at the mobile breakpoint");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const inset = page.locator('[data-slot="sidebar-inset"]');
  const firstFrames = await inset.evaluate((element) => {
    const rect = () => {
      const { x, width } = element.getBoundingClientRect();
      return { width, x };
    };
    const trigger = [...document.querySelectorAll<HTMLButtonElement>('[data-slot="sidebar-trigger"]')]
      .find((button) => button.getAttribute("aria-label") === "Collapse sidebar" && getComputedStyle(button).display !== "none");
    const before = rect();
    trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    return { after: rect(), before };
  });

  expect(firstFrames.after.x).toBeCloseTo(firstFrames.before.x, 0);
  expect(firstFrames.after.width).toBeCloseTo(firstFrames.before.width, 0);

  await page.waitForTimeout(60);
  const reversalFrames = await inset.evaluate((element) => {
    const rect = () => {
      const { x, width } = element.getBoundingClientRect();
      return { width, x };
    };
    const trigger = [...document.querySelectorAll<HTMLButtonElement>('[data-slot="sidebar-trigger"]')]
      .find((button) => button.getAttribute("aria-label") === "Open sidebar" && getComputedStyle(button).display !== "none");
    const before = rect();
    trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    return { after: rect(), before };
  });
  expect(reversalFrames.after.x).toBeCloseTo(reversalFrames.before.x, 0);
  expect(reversalFrames.after.width).toBeCloseTo(reversalFrames.before.width, 0);
  await expect.poll(async () => (await inset.boundingBox())?.x ?? 0).toBeGreaterThan(reversalFrames.after.x);

  await expect(page.locator('[data-slot="sidebar-provider"]')).toHaveAttribute("data-desktop-open", "true");
  await expect(sidebar(page)).toBeVisible();
});

test("desktop keyboard toggles are instant", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop disclosure is hidden at the mobile breakpoint");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Collapse sidebar", exact: true });
  const provider = page.locator('[data-slot="sidebar-provider"]');
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(provider).toHaveAttribute("data-desktop-open", "false");
  expect(await provider.evaluate((element) =>
    element.getAnimations().filter((animation) => Number(animation.effect?.getTiming().duration) > 0).length,
  )).toBe(0);

  await page.keyboard.press("Meta+b");
  await expect(provider).toHaveAttribute("data-desktop-open", "true");
  expect(await provider.evaluate((element) =>
    element.getAnimations().filter((animation) => Number(animation.effect?.getTiming().duration) > 0).length,
  )).toBe(0);
});

test("fine-pointer hover stays continuous through the selected row", async ({ page, isMobile }) => {
  test.skip(isMobile, "Fluid hover is only active for fine pointers");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const menu = page.locator('[data-slot="sidebar-menu"]').first();
  const hover = menu.locator('[data-slot="sidebar-menu-hover"]');
  const selection = menu.locator('[data-slot="sidebar-menu-selection"]');

  await page.getByRole("link", { name: "Principles", exact: true }).hover();
  await expect(hover).toBeVisible();
  const durations = await hover.evaluate((element) => element.getAnimations()
    .map((animation) => Number(animation.effect?.getTiming().duration))
    .filter((duration) => duration > 0));
  expect(Math.max(...durations)).toBeGreaterThanOrEqual(150);
  const firstPosition = await hover.boundingBox();

  const layers = await menu.evaluate((element) => {
    const selected = element.querySelector<HTMLElement>('[data-slot="sidebar-menu-selection"]');
    const hovered = element.querySelector<HTMLElement>('[data-slot="sidebar-menu-hover"]');
    return {
      selected: selected ? getComputedStyle(selected).backgroundColor : null,
      hovered: hovered ? getComputedStyle(hovered).backgroundColor : null,
    };
  });
  expect(layers.selected).not.toBe(layers.hovered);

  await page.getByRole("link", { name: "Introduction", exact: true }).hover();
  await expect(hover).toBeVisible();
  await expect.poll(async () => (await hover.boundingBox())?.y).toBeCloseTo((await selection.boundingBox())?.y ?? 0, 0);

  await page.getByRole("link", { name: "Color", exact: true }).hover();
  await expect.poll(async () => (await hover.boundingBox())?.y).not.toBe(firstPosition?.y);
});

test("selection travels while reduced motion settles it immediately", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop sidebar keeps the selection visible while navigating");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await page.getByRole("link", { name: "Typography", exact: true }).click();
  const selection = page.locator('[data-slot="sidebar-menu-selection"]').first();
  await expect.poll(() => selection.evaluate((element) => element.getAnimations()
    .some((animation) => Number(animation.effect?.getTiming().duration) > 0))).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("link", { name: "Color", exact: true }).click();
  expect(await selection.evaluate((element) => element.getAnimations()
    .filter((animation) => Number(animation.effect?.getTiming().duration) > 0).length)).toBe(0);
});

test("mobile is modal, animates pointer entry, and restores focus", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile drawer behavior is breakpoint-specific");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open sidebar", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close sidebar" })).toBeVisible();
  await expect.poll(() => sidebar(page).evaluate((element) => element.getAnimations()
    .some((animation) => animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes()
      .some((frame) => String(frame.transform).includes("matrix") || String(frame.transform).includes("translate"))))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");

  const accessibility = await new AxeBuilder({ page })
    .include('[data-slot="sidebar"]')
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("button", { name: "Close sidebar" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
});

test("mobile keyboard and reduced motion remove positional travel", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile drawer behavior is breakpoint-specific");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open sidebar", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await sidebar(page).evaluate((element) => element.getAnimations()
    .filter((animation) => Number(animation.effect?.getTiming().duration) > 0).length)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await trigger.dispatchEvent("click", { detail: 1 });
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await sidebar(page).evaluate((element) => element.getAnimations()
    .filter((animation) => animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes()
      .some((frame) => String(frame.transform).includes("matrix") || String(frame.transform).includes("translate"))).length)).toBe(0);
});
