import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("required choice can be selected without showing premature errors", async ({ page }) => {
  await page.goto("/#checkbox");
  const checkbox = page.getByRole("checkbox", { name: "I agree to the example terms" });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await checkbox.press("Tab");
  await expect(checkbox).not.toHaveAttribute("aria-invalid", "true");
});

test("mixed selection becomes checked and follows individual choices", async ({ page }) => {
  await page.goto("/#checkbox");
  const all = page.getByRole("checkbox", { name: "Select all" });
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await all.press("Space");
  await expect(all).toBeChecked();
  for (const name of ["Product updates", "Design notes", "Community events"]) {
    await expect(page.getByRole("checkbox", { name })).toBeChecked();
  }
  await page.getByRole("checkbox", { name: "Design notes" }).uncheck();
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await all.check();
  await all.uncheck();
  await expect(page.getByRole("checkbox", { name: "Product updates" })).not.toBeChecked();
});

test("checkbox controls reset and both themes are accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#checkbox");
  await page.getByRole("button", { name: "Open Checkbox controls" }).click();
  const checkbox = page.getByRole("checkbox", { name: "Keep me updated" });
  const panel = page.getByRole("checkbox", { name: "Indeterminate", exact: true });
  await panel.check();
  await expect(checkbox).toHaveAttribute("aria-checked", "mixed");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(checkbox).not.toBeChecked();
  await page.getByRole("button", { name: "Close controls" }).click();
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    const accessibility = await new AxeBuilder({ page }).include("#checkbox").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  }
  expect(await checkbox.evaluate((element) => element.getBoundingClientRect().width)).toBe(20);
  expect(await checkbox.locator("..").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(32);
});

test("selection animates at a fixed size and reduced motion settles immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#checkbox");
  const checkbox = page.getByRole("checkbox", { name: "Keep me updated" });
  await checkbox.scrollIntoViewIfNeeded();
  // Pause before selection so a busy browser cannot skip the 150ms animation.
  const pausedMotion = await page.addStyleTag({ content: '[data-slot="checkbox-indicator"] { animation-play-state: paused !important; }' });
  await checkbox.check();
  const indicator = checkbox.locator('[data-slot="checkbox-indicator"]');
  await expect(indicator).toHaveCSS("animation-name", "anaphor-checkbox-enter");
  await expect(indicator).toHaveCSS("animation-duration", "0.15s");
  const frames = await indicator.evaluate((element) => {
    const animation = element.getAnimations().find((entry) => entry instanceof CSSAnimation && entry.animationName === "anaphor-checkbox-enter");
    if (!animation) throw new Error("Missing checkbox selection animation");
    return [0, 75, 149].map((time) => {
      animation.currentTime = time;
      return {
        scale: parseFloat(getComputedStyle(element).scale),
        width: element.parentElement!.getBoundingClientRect().width,
      };
    });
  });
  expect(frames.some(({ scale }) => scale > 0 && scale < 1)).toBe(true);
  expect(frames.every(({ width }) => width === 20)).toBe(true);
  await pausedMotion.evaluate((element) => element.remove());
  await checkbox.uncheck();
  await expect(checkbox.locator('[data-slot="checkbox-indicator"]')).toHaveCSS("opacity", "0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await checkbox.check();
  await expect(indicator).toHaveCSS("transition-duration", "0s");
  await expect(indicator).toHaveCSS("animation-name", "none");
  await expect(indicator).toHaveCSS("opacity", "1");
});

test("checkbox marks and boundaries meet non-text contrast in both themes", async ({ page }) => {
  await page.goto("/#checkbox");
  for (const theme of ["light", "dark"]) {
    const states = page.getByRole("group", { name: `${theme} checkbox states` });
    const ratios = await states.evaluate((element) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const luminance = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r = 0, g = 0, b = 0] = Array.from(context.getImageData(0, 0, 1, 1).data).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return r * 0.2126 + g * 0.7152 + b * 0.0722;
      };
      const contrast = (a: string, b: string) => {
        const first = luminance(a), second = luminance(b);
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      };
      const indicator = element.querySelector('[data-checked] [data-slot="checkbox-indicator"]');
      const unchecked = element.querySelector('[data-slot="checkbox"][data-unchecked]');
      if (!indicator || !unchecked) throw new Error("Missing checkbox examples");
      const fill = getComputedStyle(indicator);
      const surface = getComputedStyle(element).backgroundColor;
      return [contrast(fill.color, fill.backgroundColor), contrast(fill.backgroundColor, surface), contrast(getComputedStyle(unchecked).borderColor, surface)];
    });
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(3);
  }
});
