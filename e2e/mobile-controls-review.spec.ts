import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 320, height: 720 }, { width: 640, height: 720 }, { width: 667, height: 320 }]) {
  test(`mobile controls keep their heading and dock reachable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#input");
    const trigger = page.getByRole("tab", { name: "Open Input controls" });
    await trigger.click();
    const region = page.getByRole("region", { name: "Input controls" });
    const surface = page.locator('[data-slot="morph-surface"]');
    const gutter = viewport.width >= 640 ? 48 : 24;
    const barHeight = (await page.getByRole("contentinfo", { name: "Manual utilities" }).boundingBox())?.height ?? 0;
    await expect.poll(async () => (await surface.boundingBox())!.height).toBeLessThanOrEqual(Math.min(viewport.height * 0.45, 320) + 1);
    const box = (await surface.boundingBox())!;
    expect(box.x).toBeCloseTo(gutter, 1);
    expect(box.width).toBeCloseTo(viewport.width - gutter * 2, 1);
    expect(box.y + box.height).toBeCloseTo(viewport.height - gutter - barHeight, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);

    const close = page.getByRole("button", { name: "Close controls" });
    const closeBefore = (await close.boundingBox())!;
    const scroll = await region.evaluate(element => {
      const scroller = [...element.querySelectorAll<HTMLElement>("*")].find(node => getComputedStyle(node).overflowY === "auto" && node.scrollHeight > node.clientHeight);
      if (!scroller) throw new Error("Long controls need a vertical scroll container");
      scroller.scrollTop = scroller.scrollHeight;
      return { top: scroller.scrollTop, width: scroller.clientWidth, scrollWidth: scroller.scrollWidth };
    });
    expect(scroll.top).toBeGreaterThan(0);
    expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.width);
    const reset = page.getByRole("button", { name: "Reset controls" });
    await expect(reset).toBeInViewport();
    await expect(close).toBeInViewport();
    expect((await close.boundingBox())!.y).toBeCloseTo(closeBefore.y, 1);
    await expect(trigger).toBeInViewport();
    await reset.focus();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect((await surface.boundingBox())!.y + (await surface.boundingBox())!.height).toBeCloseTo(box.y + box.height, 1);
  });
}

test("narrow code keeps horizontal scrolling inside the drawer", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  const code = page.getByRole("tab", { name: "Code", exact: true });
  await code.focus();
  await code.press("Enter");
  const surface = page.locator('[data-slot="morph-surface"]');
  await expect.poll(async () => (await surface.boundingBox())!.height).toBeLessThanOrEqual(321);
  const install = page.getByLabel("Install", { exact: true });
  await install.scrollIntoViewIfNeeded();
  const scroll = await install.evaluate(element => {
    element.scrollLeft = element.scrollWidth;
    return { left: element.scrollLeft, width: element.clientWidth, scrollWidth: element.scrollWidth };
  });
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.width);
  expect(scroll.left).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.getByRole("button", { name: "Close controls" })).toBeInViewport();
  await expect(code).toBeInViewport();
  await install.focus();
  await install.press("Escape");
  await expect(code).toBeFocused();
});

test("desktop controls retain their width and screen inset", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#input");
  await page.getByRole("tab", { name: "Open Input controls" }).click();
  const surface = page.locator('[data-slot="morph-surface"]');
  await expect(surface).toHaveCSS("width", "360px");
  const box = (await surface.boundingBox())!;
  const barHeight = (await page.getByRole("contentinfo", { name: "Manual utilities" }).boundingBox())?.height ?? 0;
  expect(box.x + box.width).toBe(1184);
  expect(box.y + box.height).toBe(784 - barHeight);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(surface).toHaveCSS("width", "560px");
});
