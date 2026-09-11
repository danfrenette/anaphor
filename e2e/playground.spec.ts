import { expect, test } from "@playwright/test";
import { holdAnimations, seekAnimations } from "./animation";

test("playgrounds retain independent settings across panel switches and resets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("button", { name: "Open Button controls" }).click();
  const navigation = page.getByRole("navigation", { name: "Manual index" });
  const visit = (name: string) => navigation.getByRole("link", { name, exact: true }).click();

  await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("destructive");
  await visit("Card");
  await page.getByRole("checkbox", { name: "Footer", exact: true }).uncheck();
  await visit("Input");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("search");
  await expect(page.getByRole("searchbox", { name: "Try an input" })).toBeVisible();

  await visit("Button");
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("destructive");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("solid");
  await visit("Card");
  await expect(page.getByRole("checkbox", { name: "Footer", exact: true })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Open workspace" })).toHaveCount(0);
  await visit("Input");
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("search");
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.getByRole("button", { name: "Open Input controls" }).click();
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("search");
});

test("panel stays within the viewport when resized open or closed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls", includeHidden: true });
  await trigger.click();
  const panel = page.getByRole("region", { name: "Button controls" });
  for (const { width, expected } of [{ width: 320, expected: 288 }, { width: 768, expected: 360 }, { width: 375, expected: 343 }]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(panel).toHaveCSS("width", `${expected}px`);
    const bounds = await panel.evaluate((element) => ({ x: element.getBoundingClientRect().x, width: element.getBoundingClientRect().width }));
    expect(bounds.x).toBeGreaterThanOrEqual(16);
    expect(bounds.x + bounds.width).toBeCloseTo(width - 16, 0);
  }
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Button", exact: true }).click();
  await expect(trigger).toHaveCSS("width", "44px");
  await expect(trigger).toHaveCSS("height", "44px");
  await trigger.click();
  await expect(panel).toHaveCSS("width", "288px");
});

test("panel reveals from its trigger without resizing its text layout", async ({ page }) => {
  await holdAnimations(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls", includeHidden: true });
  const panel = page.getByRole("region", { name: "Button controls", includeHidden: true });
  const expanded = await page.evaluate(() => Math.min(360, innerWidth - 32));
  for (const { action, opacity, duration } of [
    { action: trigger, opacity: "1", duration: 250 },
    { action: page.getByRole("button", { name: "Close controls" }), opacity: "0", duration: 150 },
  ]) {
    await action.dispatchEvent("click", { detail: 1 });
    const frames = [];
    for (const progress of [0.1, 0.3, 0.6]) {
      const durations = await seekAnimations(panel, progress);
      expect(durations.every(value => value === duration)).toBe(true);
      frames.push(await panel.evaluate(element => ({
        width: element.getBoundingClientRect().width,
        clip: getComputedStyle(element).clipPath,
        opacity: Number(getComputedStyle(element).opacity),
      })));
    }
    expect(frames.every(frame => Math.abs(frame.width - expanded) < 1)).toBe(true);
    expect(new Set(frames.map(frame => frame.clip)).size).toBeGreaterThan(2);
    expect(frames.every(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
    await seekAnimations(panel, 1);
    await expect(panel).toHaveCSS("opacity", opacity);
  }
});

test("keyboard opening is instant and reduced motion fades without a moving reveal", async ({ page }) => {
  await holdAnimations(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const trigger = page.getByRole("button", { name: "Open Button controls" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("region", { name: "Button controls" });
  await expect(panel).toBeFocused();
  await expect(panel).toHaveCSS("clip-path", "inset(0px round 12px)");
  await expect(panel).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Button", exact: true }).click();
  await trigger.dispatchEvent("click", { detail: 1 });
  await seekAnimations(panel, 0.5);
  await expect(panel).toHaveCSS("clip-path", "inset(0px round 12px)");
  const fading = await panel.evaluate(element => Number(getComputedStyle(element).opacity));
  expect(fading).toBeGreaterThan(0);
  expect(fading).toBeLessThan(1);
  await seekAnimations(panel, 1);
  await expect(panel).toHaveCSS("opacity", "1");
});

test("pointer-held controls stay pinned until release outside the panel", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse hold is covered on desktop; mobile retains the focus checks.");
  await page.goto("/#button");
  await page.getByRole("button", { name: "Open Button controls" }).click();
  const heading = page.getByRole("heading", { name: "Button controls" });
  await heading.hover();
  await page.mouse.down();
  await page.getByRole("heading", { level: 2, name: "Card", exact: true }).evaluate(element => {
    (document.activeElement as HTMLElement)?.blur();
    element.scrollIntoView({ block: "start" });
  });
  await expect(heading).toBeVisible();
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await expect(page.getByRole("region", { name: "Card controls" })).toBeVisible();
});

test("a closing reveal can reverse without hiding or remounting the controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  await page.getByRole("button", { name: "Open Button controls" }).click();
  const panel = page.getByRole("region", { name: "Button controls", includeHidden: true });
  await expect(panel).toHaveCSS("opacity", "1");
  await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("destructive");
  // Reverse as soon as the browser creates the closing animation. This proves
  // interruption without requiring the runner to render an intermediate frame.
  const interrupted = await panel.evaluate(element => new Promise<{ time: number; duration: number }>((resolve, reject) => {
    const trigger = document.querySelector<HTMLButtonElement>(`button[aria-controls="${CSS.escape(element.id)}"]`);
    const close = element.querySelector<HTMLButtonElement>('button[aria-label="Close controls"]');
    if (!trigger || !close) { reject(new Error("Expected surface controls")); return; }
    const animate = Element.prototype.animate;
    const timeout = setTimeout(() => {
      Element.prototype.animate = animate;
      reject(new Error("No closing animation was created"));
    }, 2000);
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      const effect = animation.effect as KeyframeEffect;
      if (this === element && Number(effect.getKeyframes().at(-1)?.opacity) === 0) {
        queueMicrotask(() => {
          Element.prototype.animate = animate;
          clearTimeout(timeout);
          const time = Number(animation.currentTime ?? 0);
          const duration = Number(effect.getTiming().duration);
          trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
          resolve({ time, duration });
        });
      }
      return animation;
    };
    close.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  }));
  expect(interrupted.duration).toBe(150);
  expect(interrupted.time).toBeLessThan(interrupted.duration);
  await expect(panel).toHaveCSS("opacity", "1");
  await expect(panel).toHaveCSS("clip-path", "inset(0px round 12px)");
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("destructive");
  await expect(panel).toBeFocused();
});
