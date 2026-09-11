import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("rocaille pauses rendering, preserves state across routes, and remains accessible", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      document.documentElement.dataset.fieldDraws = String(Number(document.documentElement.dataset.fieldDraws || 0) + 1);
      return draw.apply(this, args);
    };
    if (document.startViewTransition) {
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (...args: Parameters<typeof start>) => {
        document.documentElement.dataset.transitions = String(Number(document.documentElement.dataset.transitions || 0) + 1);
        return start(...args);
      };
    }
  });
  if (testInfo.project.name === "desktop-chromium") await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/studies");
  const field = page.getByRole("img", { name: /Rocaille 2: layered/ });
  await expect(field).toHaveAttribute("data-renderer", "webgl");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.waitForTimeout(500);
  const draws = () => page.locator("html").getAttribute("data-field-draws");
  const idle = await draws();
  await page.waitForTimeout(300);
  expect(await draws()).toBe(idle);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const playing = await draws();
  await expect.poll(draws).not.toBe(playing);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.waitForTimeout(600);
  const paused = await draws();
  await page.waitForTimeout(300);
  expect(await draws()).toBe(paused);

  await mkdir(".impeccable/review", { recursive: true });
  const device = testInfo.project.name === "desktop-chromium" ? "desktop" : "mobile";
  await page.screenshot({ path: `.impeccable/review/studies-${device}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(field).toHaveAttribute("data-renderer", "webgl");
  await page.screenshot({ path: `.impeccable/review/studies-${device}-dark.png`, fullPage: true, animations: "disabled" });
  const darkAccessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(darkAccessibility.violations).toEqual([]);
  await page.getByRole("slider", { name: "Zoom" }).fill("1.25");
  await page.getByRole("link", { name: "Rocaille 2", exact: true }).click();
  await expect(page).toHaveURL(/studies\/rocaille-2$/);
  await expect(page.getByRole("button", { name: "Use light theme" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Zoom" })).toHaveValue("1.25");
  await expect(field).toHaveAttribute("data-renderer", "webgl");
  if (await page.evaluate(() => Boolean(document.startViewTransition))) {
    await expect.poll(() => page.locator("html").getAttribute("data-transitions")).not.toBeNull();
  }
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `.impeccable/review/rocaille-${device}-dark.png`, fullPage: true, animations: "disabled" });
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(await page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(errors).toEqual([]);

  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  await page.waitForTimeout(200);
  const reduced = await draws();
  await page.waitForTimeout(300);
  expect(await draws()).toBe(reduced);
});

test("rocaille keeps a readable poster when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (args[0] === "webgl2") return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto("/studies");
  await expect(page.locator(".rocaille-card").getByText("Static preview")).toBeVisible();
  await expect.poll(() => page.locator(".rocaille-card .rocaille-poster").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("img", { name: /Rocaille 2: layered/ })).toHaveAttribute("data-renderer", "static");
  await page.getByRole("link", { name: "Rocaille 2", exact: true }).click();
  await expect(page).toHaveURL(/studies\/rocaille-2$/);
  await expect(page.locator(".rocaille-card").getByText("Static preview")).toBeVisible();
  await expect.poll(() => page.locator(".rocaille-card .rocaille-poster").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test("navigation morphs the live shader while playback is paused", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const names = new WeakMap<WebGLUniformLocation, string>();
    const locate = WebGL2RenderingContext.prototype.getUniformLocation;
    const uniform = WebGL2RenderingContext.prototype.uniform1f;
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const location = locate.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    WebGL2RenderingContext.prototype.uniform1f = function (location, value) {
      const name = location && names.get(location);
      if (name && !(this.canvas as HTMLCanvasElement).closest(".palette-shader")) {
        document.documentElement.dataset[name] = String(value);
        if (name === "foldStrength" && value > 0.851 && value < 0.999 && document.getAnimations().some(animation => animation.playState === "running" && (animation.effect as KeyframeEffect)?.pseudoElement?.startsWith("::view-transition-group"))) {
          document.documentElement.dataset.liveMorph = "true";
        }
      }
      return uniform.call(this, location, value);
    };
  });
  await page.goto("/studies");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-phase", "0");
  await page.getByRole("link", { name: "Rocaille 2", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-fold-strength", "0.85");
  await expect(page.locator("html")).toHaveAttribute("data-zoom", "1.35");
  await expect(page.locator("html")).toHaveAttribute("data-phase", "0");
  if (testInfo.project.name === "desktop-chromium") await expect(page.locator("html")).toHaveAttribute("data-live-morph", "true");
  await page.getByRole("link", { name: "All studies", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-fold-strength", "1");
  await expect(page.locator("html")).toHaveAttribute("data-zoom", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("link", { name: "Rocaille 2", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-fold-strength", "0.85");
  await expect(page.locator("html")).toHaveAttribute("data-phase", "0");
});
