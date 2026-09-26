import { expect, test } from "@playwright/test";

test("instant tooltip groups skip the subsequent entrance animation", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch has no hover tooltip interaction");
  await page.goto("/#tooltip");
  const section = page.locator("#tooltip");
  await section.getByRole("tab", { name: "Instant group" }).click();
  const bold = section.getByRole("button", { name: "Bold", exact: true });
  await bold.hover();
  await expect(page.getByRole("tooltip", { name: "Bold", exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Italic", exact: true }).hover();
  const next = page.getByRole("tooltip", { name: "Italic", exact: true });
  await expect(next).toBeVisible();
  await expect(next).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(next).toBeHidden();
  await section.getByRole("tab", { name: "Single tooltip" }).click();
  await page.keyboard.press("Tab");
  const save = section.getByRole("button", { name: "Save reference", exact: true });
  await save.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(save).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
