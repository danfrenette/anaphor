import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`review elements preserve authored context, media controls and keyboard focus in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/review-elements");
    const code = page.locator("diffs-container").first();
    await expect(code.locator('[data-code] [data-line="2"][data-authored-range]')).toContainText("storage.write(draft)");
    const region = page.getByRole("button", { name: "Write before returning", exact: true });
    const viewport = page.getByRole("group", { name: "Scrollable captured source" }).first();
    await region.click();
    expect((await viewport.boundingBox())!.height).toBeLessThanOrEqual(384);
    await expect(page.getByRole("button", { name: "Source and full context" }).first()).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Reader selection: none", { exact: true })).toBeVisible();
    await expect(page.getByRole("note", { name: "Write before returning · After lines 2–2", exact: true })).toBeFocused();
    await code.locator('[data-column-number="2"]').last().click();
    await expect(page.getByText("Reader selection: after lines 2–2", { exact: true })).toBeVisible();
    await region.click();
    await expect(page.getByText("Reader selection: after lines 2–2", { exact: true })).toBeVisible();
    await expect(code.locator('[data-code] [data-line="2"][data-authored-range]')).toContainText("storage.write(draft)");
    const image = page.getByRole("img", { name: "Synthetic local reader showing tour revision 2 and a restored draft", exact: true });
    const enlarge = page.getByRole("button", { name: "Enlarge example screenshot", exact: true });
    await enlarge.focus();
    await enlarge.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Screenshot with numbered callouts" });
    await expect(dialog).toBeVisible();
    const enlargedImage = dialog.getByRole("img");
    const stage = dialog.getByRole("region", { name: "Enlarged screenshot" });
    await expect.poll(async () => {
      const imageBox = await enlargedImage.boundingBox();
      const stageBox = await stage.boundingBox();
      return !!imageBox && !!stageBox && imageBox.width <= stageBox.width + 1 && imageBox.height <= stageBox.height + 1;
    }).toBe(true);
    await dialog.getByRole("button", { name: "View image at actual size" }).click();
    await expect(enlargedImage).toHaveJSProperty("width", 960);
    await dialog.getByRole("button", { name: "Fit image to window" }).click();
    const violationsInDialog = (await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations;
    expect(violationsInDialog).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(enlarge).toBeFocused();
    await expect(image).toHaveCSS("outline-offset", "-1px");
    await expect(image).toHaveCSS("outline-color", theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)");
    const video = page.locator("video");
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
    await page.getByRole("button", { name: /After: playhead advanced/ }).click();
    await expect(video).toHaveJSProperty("currentTime", 0.8);
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toBeFocused();
    await page.getByText("Execution details and history", { exact: true }).click();
    await expect(page.getByText(/Example action: save, close, reopen/)).toBeVisible();
    await page.setViewportSize({ width: 320, height: 800 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const violations = (await new AxeBuilder({ page }).include("#content").analyze()).violations;
    expect(violations).toEqual([]);
  });
}
