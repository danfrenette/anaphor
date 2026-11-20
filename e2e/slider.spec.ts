import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { selectControl } from "./playground-select";

test("Slider section uses DialKit with configurable steps, numeric editing and reset", async ({ page }) => {
  await page.goto("/#slider");
  const amount = page.getByRole("slider", { name: "Amount", exact: true });
  await expect(amount).toBeVisible();
  await page.getByRole("tab", { name: "Open Slider controls" }).click();
  await selectControl(page, "Step", "20");
  await expect(amount).toHaveAttribute("aria-valuenow", "60");
  await amount.focus();
  await amount.press("ArrowRight");
  await expect(amount).toHaveAttribute("aria-valuenow", "80");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(amount).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "Close controls" }).click();
  await amount.focus();
  await amount.press("Enter");
  await page.getByRole("textbox", { name: "Amount value" }).fill("73");
  await page.getByRole("textbox", { name: "Amount value" }).press("Enter");
  await expect(amount).toHaveAttribute("aria-valuenow", "70");
  expect((await new AxeBuilder({ page }).include("#slider").analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("magnetic mode holds detents until the release threshold", async ({ page }) => {
  await page.goto("/#slider");
  const amount = page.getByRole("slider", { name: "Amount", exact: true });
  const dragTo = async (points: number[], expected: number[]) => {
    await amount.scrollIntoViewIfNeeded();
    // The closing controls surface can briefly cover the slider on mobile.
    await expect.poll(() => amount.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return element === document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    })).toBe(true);
    const rect = (await amount.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    for (const [index, fraction] of points.entries()) {
      await page.mouse.move(rect.x + rect.width * fraction, rect.y + rect.height / 2);
      await expect(amount).toHaveAttribute("aria-valuenow", String(expected[index]));
    }
    await page.mouse.up();
  };
  await dragTo([0.555, 0.565, 0.545, 0.535], [50, 60, 60, 50]);
  await page.getByRole("tab", { name: "Open Slider controls" }).click();
  const threshold = page.getByRole("slider", { name: "Release threshold" });
  await threshold.focus();
  await threshold.press("End");
  await expect(threshold).toHaveAttribute("aria-valuenow", "80");
  await page.getByRole("button", { name: "Close controls" }).click();
  await dragTo([0.575, 0.585, 0.525, 0.515], [50, 60, 60, 50]);
  await page.getByRole("tab", { name: "Open Slider controls" }).click();
  await selectControl(page, "Snapping", "standard");
  await expect(threshold).toHaveCount(0);
  await page.getByRole("button", { name: "Close controls" }).click();
  await dragTo([0.555], [60]);
});

for (const theme of ["light", "dark"] as const) {
  test(`magnetic mode preserves the standard DialKit appearance in ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/#slider");
    await expect(page.locator("[data-app-shell]")).toHaveAttribute("data-hydrated", "true");
    await page.evaluate(() => document.fonts.ready);
    const amount = page.getByRole("slider", { name: "Amount", exact: true });
    await expect(amount).toHaveAttribute("aria-valuenow", "50");
    await page.mouse.move(0, 0);
    const magnetic = await amount.screenshot({ animations: "disabled" });

    await page.getByRole("tab", { name: "Open Slider controls" }).click();
    await selectControl(page, "Snapping", "standard");
    await page.getByRole("button", { name: "Close controls" }).click();
    await page.mouse.move(0, 0);
    await expect(amount).toHaveAttribute("aria-valuenow", "50");
    const standard = await amount.screenshot({ animations: "disabled" });

    expect(magnetic, "Magnetic snapping should preserve the standard slider's pixels").toEqual(standard);
  });
}

test("slider fill and thumb travel use transforms and preserve endpoint geometry", async ({ page }) => {
  await page.goto("/#slider");
  const amount = page.getByRole("slider", { name: "Amount", exact: true });
  await expect(amount).toBeVisible();
  await amount.scrollIntoViewIfNeeded();
  await amount.hover();
  for (const direction of ["ltr", "rtl"]) {
    await amount.evaluate((element, dir) => { element.setAttribute("dir", dir); }, direction);
    for (const [key, fraction] of [["Home", 0], ["End", 1]] as const) {
      await amount.press(key);
      await expect.poll(() => amount.evaluate((element, value) => {
        const track = element.getBoundingClientRect();
        const fill = element.querySelector<HTMLElement>(".dialkit-slider-fill")!;
        const handle = element.querySelector<HTMLElement>(".dialkit-slider-handle")!;
        const position = handle.parentElement!;
        return Math.max(
          Math.abs(fill.getBoundingClientRect().width - track.width * value),
          Math.abs(position.getBoundingClientRect().left - track.left - Math.max(5, track.width * value - 9)),
        );
      }, fraction)).toBeLessThan(1);
    }
  }
  const box = (await amount.boundingBox())!;
  await amount.click({ position: { x: box.width * 0.3, y: box.height / 2 } });
  const frames = await amount.evaluate(async element => {
    const fill = element.querySelector<HTMLElement>(".dialkit-slider-fill")!;
    const handle = element.querySelector<HTMLElement>(".dialkit-slider-handle")!;
    const frames: { width: string; left: string; fill: string; position: string }[] = [];
    for (let index = 0; index < 16; index++) {
      await new Promise(requestAnimationFrame);
      frames.push({ width: fill.style.width, left: handle.style.left, fill: fill.style.transform, position: handle.parentElement!.style.transform });
    }
    return frames;
  });
  expect(frames.every(frame => frame.width === "100%" && frame.left === "0px")).toBe(true);
  expect(new Set(frames.map(frame => frame.fill)).size).toBeGreaterThan(1);
  expect(new Set(frames.map(frame => frame.position)).size).toBeGreaterThan(1);
});
