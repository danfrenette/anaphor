import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { holdAnimations, seekAnimations } from "./animation";

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

test("desktop pointer toggles move the inset and centered content together and reverse in place", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop disclosure is hidden at the mobile breakpoint");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const provider = page.locator('[data-slot="sidebar-provider"]');
  const inset = page.locator('[data-slot="sidebar-inset"]');
  const content = page.locator('[data-slot="sidebar-inset-content"]');
  // Slow both participants so the test can inspect a committed intermediate frame.
  await provider.evaluate(element => {
    if (!(element instanceof HTMLElement)) throw new Error("Expected provider element");
    element.style.setProperty("--anaphor-sidebar-duration", "1000ms");
    element.style.setProperty("--anaphor-sidebar-exit-duration", "1000ms");
  });
  const before = await content.boundingBox();
  const insetBefore = await inset.boundingBox();
  if (!before || !insetBefore) throw new Error("Expected desktop content");
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect(provider).toHaveAttribute("data-desktop-open", "false");
  await page.waitForTimeout(100);
  const during = await content.boundingBox();
  const insetDuring = await inset.boundingBox();
  if (!during || !insetDuring) throw new Error("Expected content during close");
  expect(insetDuring.x).toBeGreaterThan(0);
  expect(insetDuring.x).toBeLessThan(insetBefore.x);
  expect(during.x).toBeLessThan(before.x);
  expect(during.x).toBeGreaterThan(before.x - insetBefore.x / 2);
  expect(during.width).toBeCloseTo(before.width, 0);
  const sidebarEdge = await sidebar(page).evaluate(element => element.getBoundingClientRect().right);
  expect(Math.abs(sidebarEdge - insetDuring.x)).toBeLessThan(35);

  // Wait for the commit and a painted frame; measuring in the click handler
  // itself only sees React's previous layout and misses the original regression.
  const reversal = await content.evaluate(async element => {
    const before = element.getBoundingClientRect().x;
    const trigger = [...document.querySelectorAll<HTMLButtonElement>('[data-slot="sidebar-trigger"][aria-expanded="false"]')].find(button => getComputedStyle(button).display !== "none");
    if (!trigger) throw new Error("Missing desktop trigger");
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return { before, after: element.getBoundingClientRect().x };
  });
  expect(Math.abs(reversal.after - reversal.before)).toBeLessThan(35);
  await expect(provider).toHaveAttribute("data-desktop-open", "true");
  await expect.poll(async () => (await content.boundingBox())?.x).toBeCloseTo(before.x, 0);
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

  await page.locator('[data-slot="sidebar-inset"]').evaluate(() => new Promise(requestAnimationFrame));
  expect((await page.locator('[data-slot="sidebar-inset"]').boundingBox())?.x).toBe(0);

  await page.keyboard.press("Meta+b");
  await expect(provider).toHaveAttribute("data-desktop-open", "true");
  expect(await provider.evaluate((element) =>
    element.getAnimations().filter((animation) => Number(animation.effect?.getTiming().duration) > 0).length,
  )).toBe(0);
});

test("desktop reduced motion settles the content immediately", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop disclosure is hidden at the mobile breakpoint");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  const inset = page.locator('[data-slot="sidebar-inset"]');
  await expect(page.locator('[data-slot="sidebar-provider"]')).toHaveAttribute("data-desktop-open", "false");
  await inset.evaluate(() => new Promise(requestAnimationFrame));
  expect((await inset.boundingBox())?.x).toBe(0);
  const content = page.locator('[data-slot="sidebar-inset-content"]');
  const rect = await content.boundingBox();
  const viewport = page.viewportSize();
  if (!rect || !viewport) throw new Error("Expected content and viewport");
  expect(rect.x).toBeCloseTo((viewport.width - rect.width) / 2, 0);
});

test("fine-pointer hover stays continuous through the selected row", async ({ page, isMobile }) => {
  test.skip(isMobile, "Fluid hover is only active for fine pointers");
  await holdAnimations(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const menu = page.locator('[data-slot="sidebar-menu"]').first();
  const hover = menu.locator('[data-slot="sidebar-menu-hover"]');
  const selection = menu.locator('[data-slot="sidebar-menu-selection"]');

  await page.getByRole("link", { name: "Principles", exact: true }).hover();
  await expect(hover).toBeVisible();
  const durations = await seekAnimations(hover, 1);
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
  await seekAnimations(hover, 1);
  await expect.poll(async () => (await hover.boundingBox())?.y).toBeCloseTo((await selection.boundingBox())?.y ?? 0, 0);

  await page.getByRole("link", { name: "Color", exact: true }).hover();
  await seekAnimations(hover, 1);
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


test("morph surface stays fixed through sidebar opening and closing on a scrolled page", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop sidebar layout motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#input").evaluate(element => element.scrollIntoView());
  const surface = page.locator('[data-slot="morph-surface"]');
  await expect(surface).toBeVisible();

  for (const label of ["Collapse sidebar", "Open sidebar"]) {
    const samples = await surface.evaluate(async (element, name) => {
      const sample = () => {
        const { x, y, width, height } = element.getBoundingClientRect();
        const center = document.elementFromPoint(x + width / 2, y + height / 2);
        return { x, y, width, height, visible: Boolean(center && element.contains(center)) };
      };
      const frames = [sample()];
      const trigger = [...document.querySelectorAll<HTMLButtonElement>('[data-slot="sidebar-trigger"]')]
        .find(button => button.getAttribute("aria-label") === name && getComputedStyle(button).display !== "none");
      if (!trigger) throw new Error("Missing desktop sidebar trigger");
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      const start = performance.now();
      do {
        await new Promise(requestAnimationFrame);
        frames.push(sample());
      } while (performance.now() - start < 400);
      return frames;
    }, label);
    const before = samples[0]!;
    expect(samples.length).toBeGreaterThan(2);
    for (const frame of samples) {
      expect(frame.visible).toBe(true);
      expect(frame.x).toBeCloseTo(before.x, 1);
      expect(frame.y).toBeCloseTo(before.y, 1);
      expect(frame.width).toBeCloseTo(before.width, 1);
      expect(frame.height).toBeCloseTo(before.height, 1);
    }
  }
});
