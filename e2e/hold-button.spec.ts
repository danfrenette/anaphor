import { expect, test } from "@playwright/test";

test("hold to delete cancels on early release and completes after the reveal", async ({ page }) => {
  await page.goto("/#button");
  const button = page.getByRole("button", { name: "Hold to delete", exact: true });
  await button.focus();

  await page.keyboard.down("Space");
  await expect(button).toHaveAttribute("data-holding", "true");
  await page.waitForTimeout(400);
  await page.keyboard.up("Space");
  await expect(button).not.toHaveAttribute("data-holding", "true");
  await page.waitForTimeout(2100);
  await expect(button).toBeVisible();

  await page.keyboard.down("Enter");
  await expect(page.getByText("Example item deleted.")).toBeVisible({ timeout: 3000 });
  await page.keyboard.up("Enter");
});

test("reduced motion keeps the hold duration without a moving reveal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  const button = page.getByRole("button", { name: "Hold to delete", exact: true });
  await button.focus();
  await page.keyboard.down("Enter");
  await expect(button).toHaveAttribute("data-holding", "true");
  await expect(button.locator('[data-slot="hold-button-overlay"]')).toHaveCSS("animation-name", "hold-duration");
  await expect(page.getByText("Example item deleted.")).toBeVisible({ timeout: 3000 });
  await page.keyboard.up("Enter");
});
