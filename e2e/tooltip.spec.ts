import { expect, test } from "@playwright/test";

test("instant tooltip groups skip the subsequent entrance animation", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch has no hover tooltip interaction");
  await page.goto("/#tooltip");
  const section = page.locator("#tooltip");

  const bold = section.getByRole("button", { name: "Bold", exact: true });
  await bold.hover();
  await expect(page.getByRole("tooltip", { name: "Bold", exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Italic", exact: true }).hover();
  const next = page.getByRole("tooltip", { name: "Italic", exact: true });
  await expect(next).toBeVisible();
  await expect(next).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(next).toBeHidden();

  await page.keyboard.press("Tab");
  const save = section.getByRole("group", { name: "Single tooltip preview", exact: true }).getByRole("button", { name: "Save reference", exact: true });
  await save.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(save).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("tooltip playground settings and reset leave reference examples independent", async ({ page }) => {
  await page.goto("/#tooltip");
  const section = page.locator("#tooltip");
  const single = section.getByRole("group", { name: "Single tooltip preview", exact: true });
  const playground = section.getByRole("group", { name: "Tooltip playground preview", exact: true });
  await single.getByRole("button", { name: "Save reference", exact: true }).click();
  await playground.getByRole("button", { name: "Save reference", exact: true }).click();
  await page.getByRole("tab", { name: "Open Tooltip controls" }).click();
  const controls = page.getByRole("region", { name: "Tooltip controls" });
  await expect(controls.getByRole("slider", { name: "Instant window" })).toHaveCount(0);
  await controls.getByRole("button", { name: "Example", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Group", exact: true }).click();
  await expect(controls.getByRole("slider", { name: "Instant window" })).toBeVisible();
  await controls.getByRole("button", { name: "Side", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "bottom", exact: true }).click();
  await page.getByRole("button", { name: "Close controls" }).click();
  await playground.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(playground.getByRole("button", { name: "Bold", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(section.getByRole("group", { name: "Instant group preview", exact: true }).getByRole("button", { name: "Bold", exact: true })).toHaveAttribute("aria-pressed", "false");
  await section.getByRole("button", { name: "Show playground code", exact: true }).click();
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText('side="bottom"');
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText("TooltipGroup");
  await playground.getByRole("button", { name: "Bold", exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole("tab", { name: "Open Tooltip controls" }).click();
  await page.getByRole("button", { name: "Reset controls" }).click();
  await page.getByRole("button", { name: "Close controls" }).click();
  await expect(playground.getByRole("button", { name: "Save reference", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(single.getByRole("button", { name: "Saved reference", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText('side="top"');
});
