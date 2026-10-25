import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("button reference exposes comparisons and keyboard-accessible code at narrow widths", async ({ page }) => {
  await page.goto("/#button");
  const section = page.locator("#button");
  for (const name of ["Variants & tones", "Sizes", "Icons & Shapes", "States", "Hold to delete", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const variants = section.getByRole("region", { name: "Variants & tones", exact: true });
  await expect(variants.getByRole("button", { name: /^solid$/i })).toHaveCount(3);
  const trigger = variants.getByRole("button", { name: "Show variants & tones code" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const code = variants.getByLabel("Variants & tones code", { exact: true });
  await expect(code).toBeVisible();
  await expect(code).toContainText('tone="neutral"');
  await expect(variants.getByRole("button", { name: "Copy variants & tones code" })).toBeVisible();
  expect((await new AxeBuilder({ page }).include('#button [data-slot="collapsible"]').analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await section.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(code).toBeHidden();
});


test("code controls share equal vertical insets and icon buttons keep touch targets", async ({ page, isMobile }) => {
  await page.goto("/#button");
  const example = page.locator("#button").getByRole("region", { name: "Icons & Shapes", exact: true });
  const trigger = example.getByRole("button", { name: "Show icons & shapes code", exact: true });
  const copy = example.getByRole("button", { name: "Copy icons & shapes code", exact: true });
  const squircle = example.getByRole("button", { name: "Squircle icon button", exact: true });
  const triggerBox = await trigger.boundingBox();
  const copyBox = await copy.boundingBox();
  const squircleBox = await squircle.boundingBox();
  expect(copyBox!.y).toBeCloseTo(triggerBox!.y, 0);
  expect(copyBox!.height).toBe(triggerBox!.height);
  expect(copyBox!.width).toBe(copyBox!.height);
  expect(squircleBox!.width).toBe(copyBox!.width);
  expect(copyBox!.height).toBeGreaterThanOrEqual(isMobile ? 44 : 36);
});

test("button icon edges use optical padding in both writing directions", async ({ page }) => {
  await page.goto("/#button");
  const section = page.locator("#button");
  const leading = section.getByRole("button", { name: "Leading icon", exact: true });
  const trailing = section.getByRole("button", { name: "Trailing icon", exact: true });
  for (const direction of ["ltr", "rtl"]) {
    await section.evaluate((element, dir) => { element.setAttribute("dir", dir); }, direction);
    await expect(leading).toHaveCSS("padding-inline-start", "12px");
    await expect(leading).toHaveCSS("padding-inline-end", "14px");
    await expect(trailing).toHaveCSS("padding-inline-start", "14px");
    await expect(trailing).toHaveCSS("padding-inline-end", "12px");
    const iconOnly = section.getByRole("button", { name: "Squircle icon button", exact: true });
    await expect(iconOnly).toHaveCSS("padding-inline-start", "0px");
    await expect(iconOnly).toHaveCSS("padding-inline-end", "0px");
    const textOnly = section.getByRole("region", { name: "Sizes", exact: true }).getByRole("button", { name: "Continue", exact: true });
    for (const [index, padding] of ["8px", "10px", "14px", "16px"].entries()) {
      await expect(textOnly.nth(index)).toHaveCSS("padding-inline-start", padding);
      await expect(textOnly.nth(index)).toHaveCSS("padding-inline-end", padding);
    }
  }
});
