import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("dropdown keeps its anchor stable while the trigger is pressed", async ({ page }) => {
  await page.goto("/#dropdown-menu");
  const trigger = page.getByRole("button", { name: "File actions" });
  await trigger.hover();
  const resting = await trigger.boundingBox();

  await page.mouse.down();
  const pressed = await trigger.boundingBox();
  await page.mouse.up();

  expect(resting).not.toBeNull();
  expect(pressed).not.toBeNull();
  expect(pressed?.x).toBeCloseTo(resting?.x ?? 0, 1);
  expect(pressed?.y).toBeCloseTo(resting?.y ?? 0, 1);
  expect(pressed?.width).toBeCloseTo(resting?.width ?? 0, 1);
  expect(pressed?.height).toBeCloseTo(resting?.height ?? 0, 1);
});

test("dropdown supports pointer actions and keyboard dismissal", async ({ page }) => {
  await page.goto("/#dropdown-menu");
  const trigger = page.getByRole("button", { name: "File actions" });

  await trigger.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "Rename R" }).click();
  await expect(page.getByText("Rename selected")).toBeVisible();
  await expect(page.getByRole("menu")).toBeHidden();

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Rename R" })).toBeFocused();
  await expect(page.locator('[data-slot="menu-popup"]')).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Move to…" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("dropdown uses one fluid pointer highlight and stops it at structure", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-webkit", "Fluid hover is only active for fine pointers");
  await page.goto("/#dropdown-menu");
  await page.getByRole("button", { name: "File actions" }).click();
  const rename = page.getByRole("menuitem", { name: "Rename R" });
  const move = page.getByRole("menuitem", { name: "Move to…" });
  const highlight = page.locator('[data-slot="menu-fluid-highlight"]');

  await rename.hover();
  await expect(highlight).toBeVisible();
  await expect(highlight).toHaveCount(1);
  const renamePosition = await highlight.boundingBox();

  await move.hover();
  await expect.poll(async () => (await highlight.boundingBox())?.y).not.toBe(renamePosition?.y);

  const separator = page.locator('[data-slot="menu-separator"]');
  const separatorBox = await separator.boundingBox();
  expect(separatorBox).not.toBeNull();
  await page.mouse.move(
    (separatorBox?.x ?? 0) + (separatorBox?.width ?? 0) / 2,
    (separatorBox?.y ?? 0) + (separatorBox?.height ?? 0) / 2,
  );
  await expect(highlight).toBeHidden();
});

test("dropdown motion is restrained and reduced motion removes travel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#dropdown-menu");
  await page.getByRole("button", { name: "File actions" }).click();
  const popup = page.locator('[data-slot="menu-popup"]');
  const motion = await popup.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      duration: styles.transitionDuration,
      property: styles.transitionProperty,
      origin: styles.transformOrigin,
    };
  });
  expect(motion.duration).toBe("0.18s, 0.18s");
  expect(motion.property).toContain("opacity");
  expect(motion.property).toContain("transform");
  expect(motion.origin).not.toBe("50% 50%");

  const accessibility = await new AxeBuilder({ page })
    .include('[data-slot="menu-popup"]')
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("button", { name: "File actions" }).click();
  const reduced = await popup.evaluate((element) => {
    const styles = getComputedStyle(element);
    return { duration: styles.transitionDuration, property: styles.transitionProperty };
  });
  expect(reduced).toEqual({ duration: "0.2s", property: "opacity" });
});
