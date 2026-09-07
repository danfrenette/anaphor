import { expect, test } from "@playwright/test";

test("playgrounds retain independent settings across panel switches and resets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("button", { name: "Open Button controls" }).click();
  const navigation = page.getByRole("navigation", { name: "Manual index" });
  const visit = (name: string) => navigation.getByRole("link", { name, exact: true }).click();

  await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("destructive");
  await visit("Card");
  await page.getByRole("checkbox", { name: "Footer", exact: true }).uncheck();
  await visit("Input");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("search");
  await expect(page.getByRole("searchbox", { name: "Try an input" })).toBeVisible();

  await visit("Button");
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("destructive");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.getByRole("combobox", { name: "Variant", exact: true })).toHaveValue("solid");
  await visit("Card");
  await expect(page.getByRole("checkbox", { name: "Footer", exact: true })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Open workspace" })).toHaveCount(0);
  await visit("Input");
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("search");
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.getByRole("button", { name: "Open Input controls" }).click();
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("search");
});
