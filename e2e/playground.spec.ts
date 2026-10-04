import { selectControl } from "./playground-select";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

declare global {
  interface Window { anaphorThemeReveal?: Animation }
}

test("the bar persists, controls follow sections, and settings survive view changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const tools = page.getByRole("group", { name: "Manual tools" });
  await expect(tools).toBeVisible();
  await expect(tools.getByRole("tab", { name: "Component controls unavailable" })).toBeDisabled();
  await page.locator("#button").evaluate(element => element.scrollIntoView());
  await tools.getByRole("tab", { name: "Open Button controls" }).click();
  await selectControl(page, "Variant", "soft");
  await selectControl(page, "Tone", "danger");
  await tools.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Button code" })).toBeVisible();
  await tools.getByRole("tab", { name: "Open Button controls" }).click();
  await expect(page.getByRole("button", { name: "Variant", exact: true })).toHaveText("soft");
  await expect(page.getByRole("button", { name: "Tone", exact: true })).toHaveText("danger");
  await page.getByRole("region", { name: "Button controls" }).focus();
  await page.locator("#card").evaluate(element => element.scrollIntoView());
  await expect(page.getByRole("region", { name: "Card controls" })).toBeVisible();
  await page.locator("#purpose").evaluate(element => element.scrollIntoView());
  await expect(tools).toBeVisible();
  await expect(tools.getByRole("tab", { name: "Component controls unavailable" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Close controls" })).toHaveCount(0);
});

test("code fits narrow screens, scrolls long lines, and has accessible copy actions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.locator("#button").evaluate(element => element.scrollIntoView());
    await expect(page.getByRole("heading", { name: "Button code" })).toBeVisible();
    const surface = page.locator('[data-slot="morph-surface"]');
    const gutter = width < 640 ? 24 : width < 768 ? 48 : 16;
    const box = (await surface.boundingBox())!;
    expect(box.width).toBe(Math.min(560, width - gutter * 2));
    expect(box.x + box.width).toBe(width - gutter);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Copy Install" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Usage" })).toBeVisible();
  }
  await page.setViewportSize({ width: 320, height: 800 });
  const install = page.getByLabel("Install", { exact: true });
  expect(await install.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include('[data-slot="morph-surface"]').analyze()).violations).toEqual([]);
  await page.screenshot({ path: `test-results/morph-code-${test.info().project.name}.png` });
});

test("Escape restores bar focus and outside presses leave focus with their target", async ({ page }) => {
  await page.goto("/#button");
  const trigger = page.getByRole("tab", { name: "Open Button controls" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.locator('[data-slot="workspace-top-bar"]').first().click({ position: { x: 8, y: 8 } });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("group", { name: "Manual tools" })).toBeVisible();
});

test("theme follows the system, persists across routes and reloads, and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition");
  await page.goto("/studies/signal");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("group", { name: "Manual tools" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("radial reveal starts at the toggle and releases after completion", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/");
  test.skip(!await page.evaluate(() => Boolean(document.startViewTransition)), "Browser has no View Transition API");
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (typeof options === "object" && options?.pseudoElement === "::view-transition-new(root)") {
        document.documentElement.dataset.revealFrames = JSON.stringify(frames);
      }
      return animate.call(this, frames, options);
    };
  });
  const toggle = page.getByRole("button", { name: "Switch to dark theme" });
  const rect = await toggle.boundingBox();
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-reveal-frames", /circle\(0px/);
  const frames = await page.locator("html").getAttribute("data-reveal-frames");
  const x = rect!.x + rect!.width / 2;
  const y = rect!.y + rect!.height / 2;
  expect(frames).toContain(`at ${x}px ${y}px`);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("one shell grows from the icon bar and keeps its bottom edge anchored", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  await expect(page.getByRole("tab", { name: "Open Button controls" })).toBeEnabled();
  const surface = page.locator('[data-slot="morph-surface"]');
  const samples = await surface.evaluate(element => new Promise<{ height: number; bottom: number }[]>(resolve => {
    const frames: { height: number; bottom: number }[] = [];
    const sample = () => { const box = element.getBoundingClientRect(); frames.push({ height: box.height, bottom: box.bottom }); };
    sample();
    element.setAttribute("data-continuity-check", "original");
    element.querySelector<HTMLButtonElement>('button[aria-controls]')!.click();
    const start = performance.now();
    const tick = () => {
      sample();
      if (performance.now() - start < 600) requestAnimationFrame(tick);
      else resolve(frames);
    };
    requestAnimationFrame(tick);
  }));
  const first = samples[0]!;
  const last = samples.at(-1)!;
  expect(last.height).toBeGreaterThan(first.height + 40);
  expect(samples.some(frame => frame.height > first.height + 2 && frame.height < last.height - 2)).toBe(true);
  expect(samples.every(frame => Math.abs(frame.bottom - first.bottom) < 1)).toBe(true);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(surface).toHaveAttribute("data-continuity-check", "original");
  await page.getByRole("button", { name: "Close controls" }).click();
  const dock = page.getByRole("group", { name: "Manual tools" });
  await expect.poll(async () => (await surface.boundingBox())!.width).toBeCloseTo((await dock.boundingBox())!.width + 12, 1);
  const closed = (await surface.boundingBox())!;
  expect(closed.y + closed.height).toBeCloseTo(first.bottom, 1);
  expect(await dock.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(closed.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
});

test("theme switching works without View Transitions", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(document, "startViewTransition", { value: undefined, configurable: true }); });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("surface tabs use roving keyboard focus and connect to their panels", async ({ page }) => {
  await page.goto("/#button");
  const tabs = page.getByRole("tablist", { name: "Component tools" });
  const controls = tabs.getByRole("tab", { name: "Open Button controls" });
  const code = tabs.getByRole("tab", { name: "Code", exact: true });
  await controls.focus();
  await controls.press("ArrowRight");
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("aria-selected", "false");
  await code.press("Enter");
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel", { name: "Code", exact: true });
  await expect(panel).toBeVisible();
  await expect(code).toHaveAttribute("aria-controls", (await panel.getAttribute("id"))!);
  await expect(page.locator('[data-slot="morph-surface"]')).toHaveCSS("transition-property", "none");
  await expect(tabs.locator('[data-slot="tabs-indicator"]')).toHaveCSS("transition-duration", "0s");
  await code.press("Tab");
  await expect.poll(() => page.getByRole("region", { name: "Button code" }).evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("aria-selected", "false");
});

test("theme reveal spreads its travel across 350ms instead of rushing the first frame", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/");
  test.skip(!await page.evaluate(() => Boolean(document.startViewTransition)), "Browser has no View Transition API");
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      if (typeof options === "object" && options?.pseudoElement === "::view-transition-new(root)") {
        animation.pause();
        window.anaphorThemeReveal = animation;
      }
      return animation;
    };
  });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.waitForFunction(() => Boolean(window.anaphorThemeReveal));
  const result = await page.evaluate(async () => {
    const animation = window.anaphorThemeReveal!;
    const effect = animation.effect;
    if (!(effect instanceof KeyframeEffect)) throw new Error("Expected a keyframe effect");
    const timing = effect.getTiming();
    const end = String(effect.getKeyframes().at(-1)!.clipPath);
    const radius = Number(end.match(/circle\(([\d.]+)px/)![1]);
    const samples = [];
    for (const time of [1000 / 60, 175, 349]) {
      animation.currentTime = time;
      await new Promise(resolve => requestAnimationFrame(resolve));
      const clip = getComputedStyle(document.documentElement, "::view-transition-new(root)").clipPath;
      samples.push(Number(clip.match(/circle\(([\d.]+)px/)![1]) / radius);
    }
    animation.finish();
    return { duration: timing.duration, samples };
  });
  expect(result.duration).toBe(350);
  expect(result.samples[0]).toBeLessThan(0.02);
  expect(result.samples[1]).toBeCloseTo(0.5, 2);
  expect(result.samples[2]).toBeCloseTo(1, 2);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition");
});

test("keyboard theme activation is immediate", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/");
  const theme = page.getByRole("button", { name: "Switch to dark theme" });
  await theme.focus();
  await theme.press("Enter");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition");
});

test("theme snapshots stay clipped through the animation handoffs in both directions", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/");
  test.skip(!await page.evaluate(() => Boolean(document.startViewTransition)), "Browser has no View Transition API");
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const reveal = typeof options === "object" && options?.pseudoElement === "::view-transition-new(root)";
      if (reveal) {
        document.documentElement.dataset.initialRevealClip = getComputedStyle(this, "::view-transition-new(root)").clipPath;
      }
      const animation = animate.call(this, frames, options);
      if (reveal) {
        animation.pause();
        window.anaphorThemeReveal = animation;
      }
      return animation;
    };
  });
  for (const theme of ["dark", "light"]) {
    await page.getByRole("button", { name: `Switch to ${theme} theme` }).click();
    await page.waitForFunction(() => Boolean(window.anaphorThemeReveal));
    await expect(page.locator("html")).toHaveAttribute("data-initial-reveal-clip", "circle(0px)");
    const finalFrame = await page.evaluate(() => {
      const animation = window.anaphorThemeReveal!;
      const effect = animation.effect;
      if (!(effect instanceof KeyframeEffect)) throw new Error("Expected a keyframe effect");
      animation.finish();
      const clip = getComputedStyle(document.documentElement, "::view-transition-new(root)").clipPath;
      delete window.anaphorThemeReveal;
      return { clip, expected: effect.getKeyframes().at(-1)!.clipPath };
    });
    const radius = Number(finalFrame.clip.match(/circle\(([\d.]+)px/)![1]);
    const expectedRadius = Number(String(finalFrame.expected).match(/circle\(([\d.]+)px/)![1]);
    expect(radius).toBeCloseTo(expectedRadius, 2);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition");
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
  }
});

test("icon tabs fade on hover and move the shared selection highlight", async ({ page, isMobile }) => {
  test.skip(isMobile, "Hover feedback only applies to a fine pointer.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const tabs = page.getByRole("tablist", { name: "Component tools" });
  const controls = tabs.getByRole("tab", { name: "Open Button controls" });
  const code = tabs.getByRole("tab", { name: "Code", exact: true });
  await controls.hover();
  await expect(controls).toHaveCSS("transition-duration", "0.15s");
  await expect(controls).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await controls.click();
  await code.click();
  await expect(tabs.locator('[data-slot="tabs-indicator"]')).toHaveCSS("transition-property", "clip-path");
  await expect(code).toHaveAttribute("aria-selected", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(controls).toHaveCSS("transition-property", "none");
  await expect(tabs.locator('[data-slot="tabs-indicator"]')).toHaveCSS("transition-duration", "0s");
});

test("Anaphor control menus select by keyboard and Escape closes one layer at a time", async ({ page }) => {
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const variant = page.getByRole("button", { name: "Variant", exact: true });
  await variant.focus();
  await variant.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "solid", exact: true })).toHaveAttribute("aria-checked", "true");
  expect((await new AxeBuilder({ page }).include('[data-slot="menu-popup"]').analyze()).violations).toEqual([]);
  await page.screenshot({ path: `test-results/control-dropdown-${test.info().project.name}.png` });
  await page.keyboard.press("g");
  await page.keyboard.press("Enter");
  await expect(variant).toHaveText("ghost");
  await expect(variant).toBeFocused();
  await expect(page.getByRole("region", { name: "Button controls" })).toBeVisible();
  await variant.press("ArrowDown");
  await expect(page.getByRole("menu", { name: "Variant", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Variant", exact: true })).toHaveCount(0);
  await expect(variant).toBeFocused();
  await expect(page.getByRole("region", { name: "Button controls" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tab", { name: "Open Button controls" })).toHaveAttribute("aria-expanded", "false");
});
