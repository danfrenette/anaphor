import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { selectControl } from "./playground-select";

test("multiple real files retain the batch initiator through completion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/uploads");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.txt", mimeType: "text/plain", buffer: Buffer.from("First file") },
    { name: "second.md", mimeType: "text/markdown", buffer: Buffer.from("# Second file") },
  ]);
  await expect(page.getByRole("list", { name: "Selected files", exact: true }).getByRole("listitem")).toHaveCount(2);
  const batch = page.getByRole("button", { name: "Upload 2 files", exact: true });
  await batch.focus();
  await batch.press("Enter");
  const retained = page.getByRole("button", { name: "Upload files", exact: true });
  await expect(retained).toBeFocused();
  await expect(retained).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Complete", { exact: true })).toHaveCount(2, { timeout: 15_000 });
  await expect(retained).toBeFocused();
  await page.getByRole("listitem", { name: "second.md" }).getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByRole("listitem", { name: "first.txt" }).getByRole("button", { name: "Uploaded", exact: true })).toBeFocused();
  await expect.poll(() => page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).disableRules(["color-contrast"]).analyze();
  expect(accessibility.violations).toEqual([]);
  const contrast = await new AxeBuilder({ page }).withRules(["color-contrast"])
    .exclude('[data-tone="accent"][data-variant="solid"]').analyze();
  expect(contrast.violations).toEqual([]);
});

test("RTL activity traverses the complete track and reduces to a static indicator", async ({ page }) => {
  await page.goto("/uploads");
  await page.getByRole("button", { name: "Use sample files", exact: true }).click();
  await page.getByRole("tab", { name: "Open File upload controls", exact: true }).click();
  await page.getByRole("checkbox", { name: "Mirror layout (RTL)", exact: true }).check();
  await selectControl(page, "Inspect state", "processing");
  const track = page.locator('[data-slot="file-upload-progress"]').first();
  await expect(track.getByRole("progressbar")).not.toHaveAttribute("value");
  const segment = track.locator("span");
  await expect(segment).toHaveCSS("animation-name", "anaphor-upload-activity-rtl");
  const positions = await segment.evaluate(element => {
    const animation = element.getAnimations()[0];
    if (!animation?.effect || !element.parentElement) throw new Error("Expected an animated progress segment");
    animation.pause();
    const duration = Number(animation.effect.getTiming().duration);
    animation.currentTime = 0;
    const start = element.getBoundingClientRect().left;
    animation.currentTime = duration - 1;
    const end = element.getBoundingClientRect().right;
    const bounds = element.parentElement.getBoundingClientRect();
    return { start, end, left: bounds.left, right: bounds.right };
  });
  expect(Math.abs(positions.start - positions.right)).toBeLessThan(2);
  expect(Math.abs(positions.end - positions.left)).toBeLessThan(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(segment).toHaveCSS("animation-duration", "0s");
});
