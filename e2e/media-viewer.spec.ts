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


test("hiding details returns keyboard focus to the console", async ({ page }) => {
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect landscape image", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const hide = dialog.getByRole("button", { name: "Hide details" });
  await hide.focus();
  await hide.press("Enter");
  await expect(dialog.getByRole("tab", { name: "Annotations", exact: true })).toBeFocused();
  await expect(dialog.getByRole("complementary", { name: "Supporting details" })).toHaveCount(0);
});


test("a consumed annotation reveal does not replace the reader's retained pan", async ({ page }) => {
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect mixed collection" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Actual size", exact: true }).click();
  const viewport = dialog.getByLabel("Landscape inspection image inspection", { exact: true });
  await dialog.getByRole("button", { name: "Reveal detail" }).click();
  await expect.poll(() => viewport.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await viewport.evaluate(el => { el.scrollTop = 0; el.scrollLeft = 0; });
  await dialog.getByRole("button", { name: "Next", exact: true }).click();
  await dialog.getByRole("button", { name: "Previous", exact: true }).click();
  await expect.poll(() => viewport.evaluate(el => el.scrollTop)).toBe(0);
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(0);
});


test("long titles keep close and console reachable in a short window", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect long title" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Close media viewer" })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Fit", exact: true })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Actual size", exact: true })).toBeInViewport();
  const title = dialog.getByRole("heading", { level: 2 });
  await title.focus();
  await title.press("End");
  await expect.poll(() => title.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await dialog.getByRole("button", { name: "Close media viewer" }).click();
  await expect(page.getByRole("button", { name: "Inspect long title" })).toBeFocused();
});


test("nested Escape closes the popover before the viewer and backdrop is inert", async ({ page }) => {
  await page.goto("/#media-viewer");
  const opener = page.getByRole("button", { name: "Inspect landscape image", exact: true });
  await opener.click();
  const viewer = page.getByRole("dialog", { name: "Landscape inspection", exact: true });
  await viewer.getByRole("tab", { name: "Evidence", exact: true }).click();
  await viewer.getByRole("button", { name: "About this fixture" }).click();
  await expect(page.getByRole("dialog", { name: "Fixture details" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Fixture details" })).toBeHidden();
  await expect(viewer).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(viewer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

test("retry recovers an unavailable image without replacing its explanation", async ({ page }) => {
  let requests = 0;
  await page.route("**/media/intentionally-unavailable.png", async route => {
    requests += 1;
    if (requests === 1) await route.fulfill({ status: 404, body: "Missing" });
    else await route.fulfill({ path: "apps/demo/public/media/landscape.svg", contentType: "image/svg+xml" });
  });
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect unavailable image", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Retry image", exact: true }).click();
  await expect(dialog.getByRole("img")).toBeVisible();
  await expect.poll(() => dialog.getByRole("img").evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1440);
  await expect(dialog.getByText("This explanation remains available when the capture cannot load.")).toBeVisible();
});

test("short narrow inspection keeps media, caption, and details in separate rows", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect landscape image", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const caption = dialog.getByText("Illustrative desktop interface · 1440 × 900 pixels", { exact: true });
  const details = dialog.getByRole("complementary", { name: "Supporting details" });
  const captionBox = await caption.boundingBox();
  const detailsBox = await details.boundingBox();
  expect(captionBox).not.toBeNull();
  expect(detailsBox).not.toBeNull();
  expect(detailsBox!.y).toBeGreaterThanOrEqual(captionBox!.y + captionBox!.height);
  await dialog.getByRole("button", { name: "Hide details" }).click();
  await expect(dialog.getByRole("button", { name: "Close media viewer" })).toBeInViewport();
});


test("inspection controls remain reachable under 200 percent layout magnification", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto("/#media-viewer");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await page.getByRole("button", { name: "Inspect landscape image", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Close media viewer" })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Fit", exact: true })).toBeInViewport();
  await dialog.getByRole("button", { name: "Close media viewer" }).click();
});


test("video failure retains the account and retries without autoplay", async ({ page }) => {
  let requests = 0;
  await page.route("**/media/intentionally-unavailable.mp4", async route => {
    requests += 1;
    if (requests === 1) await route.fulfill({ status: 404, body: "Missing" });
    else await route.fulfill({ path: "apps/demo/public/media/inspection.mp4", contentType: "video/mp4" });
  });
  await page.goto("/#media-viewer");
  await page.getByRole("button", { name: "Inspect unavailable recording", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Action, 0:02: an orange rectangle appears on the left.")).toBeVisible();
  await dialog.getByRole("button", { name: "Retry video", exact: true }).click();
  const video = dialog.locator("video");
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState)).toBeGreaterThan(0);
  await expect(video).toHaveJSProperty("paused", true);
});
