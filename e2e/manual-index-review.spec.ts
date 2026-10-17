import { expect, test } from "@playwright/test";

test("Tabs search navigates by keyboard and updates the manual context", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Search manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Search the manual" });
  const input = dialog.getByRole("combobox");
  await input.fill("Tabs");
  await expect(dialog.getByRole("option", { name: "Tabs", exact: true })).toBeVisible();
  await input.press("Enter");

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/#tabs$/);
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Tabs");
  await expect(page.locator("#tabs")).toHaveAttribute("data-active", "");
  if (isMobile) await expect(page.locator('[data-slot="sidebar"]')).toBeHidden();
});

test("a direct Tabs link settles the breadcrumb and active index entry", async ({ page, isMobile }) => {
  await page.goto("/#tabs");
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Tabs");
  await expect(page.locator("#tabs")).toHaveAttribute("data-active", "");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Tabs", exact: true });
  await expect(link).toHaveAttribute("href", "/#tabs");
  await expect(link).toHaveAttribute("aria-current", "page");
});

test("activating Tabs in the narrow index dismisses the drawer", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile index dismissal is breakpoint-specific");
  await page.goto("/");
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Tabs", exact: true });
  await link.focus();
  await link.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/#tabs$/);
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Tabs");
});

test("the combined Typography reference is searchable and has matching route context", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Search manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Search the manual" });
  const input = dialog.getByRole("combobox");
  await input.fill("Typography");
  await expect(dialog.getByRole("option", { name: "Typography", exact: true })).toBeVisible();
  await input.press("Enter");

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/typography$/);
  await expect(page.getByRole("heading", { name: "Typography", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Foundations/Typography");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Typography", exact: true })).toHaveAttribute("aria-current", "page");
});


test("legacy Principles links retain Overview context without retired navigation", async ({ page, isMobile }) => {
  await page.goto("/#principles");
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Manual/Overview");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const index = page.getByRole("navigation", { name: "Manual index" });
  await expect(index.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(index.getByRole("link", { name: /Studies|Signal|Field Notes|Source Outline|Principles/ })).toHaveCount(0);
});
