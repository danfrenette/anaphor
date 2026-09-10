import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("palette unfolds, edits and keeps its selection on return", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const device = testInfo.project.name === "desktop-chromium" ? "desktop" : "mobile";
  if (device === "desktop") await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const spread = Number(document.querySelector(".palette-artwork")?.getAttribute("data-spread"));
      if (spread > 0.01 && spread < 0.99 && document.getAnimations().some(animation => animation.playState === "running" && (animation.effect as KeyframeEffect)?.pseudoElement?.startsWith("::view-transition-group"))) {
        document.documentElement.dataset.paletteLiveMorph = "true";
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-spread"] });
  });
  await page.goto("/studies");
  await page.getByRole("button", { name: "Swatch 5", exact: true }).click();
  await expect(page.getByRole("button", { name: "Swatch 5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".palette-study").scrollIntoViewIfNeeded();
  await expect(page.locator(".palette-shader .rocaille-artwork")).toHaveAttribute("data-renderer", "webgl");
  await page.getByRole("button", { name: "Pause background", exact: true }).click();
  await mkdir(".impeccable/review", { recursive: true });
  await page.locator(".palette-study").screenshot({ path: `.impeccable/review/palette-fan-${device}.png`, animations: "disabled" });
  await page.getByRole("link", { name: "A palette, unfolded", exact: true }).click();
  await expect(page).toHaveURL(/\/studies\/palette$/);
  await expect(page.locator(".palette-shader .rocaille-artwork")).toHaveAttribute("data-renderer", "webgl");
  await expect(page.getByRole("button", { name: "Play background", exact: true })).toBeVisible();
  await expect(page.locator(".palette-artwork")).toHaveAttribute("data-spread", "1");
  await expect(page.getByRole("button", { name: "Swatch 5", exact: true })).toHaveAttribute("aria-pressed", "true");
  if (device === "desktop") await expect(page.locator("html")).toHaveAttribute("data-palette-live-morph", "true");
  await page.getByRole("slider", { name: "Hue", exact: true }).fill("220");
  await expect(page.locator(".palette-readout output")).toContainText("220.00");
  await expect(page.locator(".palette-article [data-slot='card-preview']")).toHaveCount(0);
  await page.getByRole("button", { name: "Long way", exact: true }).click();
  await expect(page.getByRole("img", { name: "Gradient following the longer hue path" })).toBeVisible();
  await page.getByRole("slider", { name: "Lightness", exact: true }).fill("0.55");
  await page.getByRole("slider", { name: "Chroma", exact: true }).fill("0.12");
  await expect(page.locator(".palette-readout output")).toHaveText("oklch(0.6500 0.0900 220.00)");
  await page.screenshot({ path: `.impeccable/review/palette-${device}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await page.screenshot({ path: `.impeccable/review/palette-${device}-dark.png`, fullPage: true, animations: "disabled" });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.locator("html").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole("link", { name: "All studies", exact: true }).click();
  await expect(page.locator(".palette-artwork")).toHaveAttribute("data-spread", "0");
  await expect(page.getByRole("button", { name: "Swatch 5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("link", { name: "A palette, unfolded", exact: true }).click();
  await expect(page.locator(".palette-artwork")).toHaveAttribute("data-spread", "1");
  await expect(page.getByRole("slider", { name: "Hue", exact: true })).toHaveValue("220");
  await page.getByRole("button", { name: "Reset palette", exact: true }).click();
  await expect(page.locator(".palette-readout output")).toHaveText("oklch(0.6217 0.1850 39.44)");
  await page.getByRole("button", { name: "Swatch 2", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Swatch 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});
