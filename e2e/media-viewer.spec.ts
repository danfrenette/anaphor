import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("media viewer is an alphabetized Content destination with working single-image inspection", async ({ page, isMobile }) => {
  await page.goto("/#media-viewer");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const index = page.getByRole("navigation", { name: "Manual index" });
  await expect(index.getByRole("link", { name: "Media viewer", exact: true })).toHaveAttribute("href", "/#media-viewer");
  if (isMobile) await index.getByRole("link", { name: "Media viewer", exact: true }).click();
  const opener = page.getByRole("button", { name: "Inspect landscape image", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Landscape inspection", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Actual size", exact: true }).click();
  await expect(dialog.getByRole("img", { name: "Illustrative reading room with a continue reading action" })).toHaveJSProperty("clientWidth", 1440);
  await dialog.getByRole("button", { name: "Fit", exact: true }).click();
  await dialog.getByRole("button", { name: "Close media viewer", exact: true }).click();
  await expect(opener).toBeFocused();
});

test("finite collection preserves inspection state and pauses departing video", async ({ page }) => {
  await page.goto("/#media-viewer");
  const opener = page.getByRole("button", { name: "Inspect mixed collection", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Actual size", exact: true }).click();
  await dialog.getByRole("button", { name: "Next", exact: true }).click();
  const video = dialog.locator("video");
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState)).toBeGreaterThan(0);
  await expect(video).toHaveJSProperty("paused", true);
  await video.evaluate(async (el: HTMLVideoElement) => { el.currentTime = 2; await el.play(); });
  await dialog.getByRole("button", { name: "Next", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(video).toHaveJSProperty("paused", true);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThanOrEqual(2);
  await dialog.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Actual size", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Fit", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("media failure keeps supporting explanation and offers retry", async ({ page }) => {
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect unavailable image", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("This explanation remains available when the capture cannot load.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Retry image", exact: true })).toBeVisible();
});

test("viewer reflows in both themes and keeps accessible controls", async ({ page }) => {
  await page.goto("/#media-viewer");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.classList.toggle("dark", theme === "dark"); }, theme);
    await page.getByRole("button", { name: "Inspect landscape image", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    const report = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(report.violations).toEqual([]);
    await dialog.press("Escape");
  }
});
