import type { Page } from "@playwright/test";

export async function selectControl(page: Page, label: string, value: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("menuitemradio", { name: value, exact: true }).click();
}
