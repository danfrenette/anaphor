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
