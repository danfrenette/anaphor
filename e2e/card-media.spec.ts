import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Card documentation shows shader child content and an SVG placeholder", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/#card-media");
  const examples = page.locator("#card-media");
  await examples.scrollIntoViewIfNeeded();
  await expect(examples.locator(".rocaille-artwork")).toHaveAttribute("data-renderer", "webgl");
  await expect(examples.getByRole("link", { name: "Xor / @XorDev" })).toHaveAttribute("href", "https://x.com/XorDev/status/2015813875833225715");
  await expect(examples.getByText("Placeholder", { exact: true })).toBeVisible();
  await examples.getByRole("button", { name: "Pause Rocaille preview" }).click();
  await expect(examples.getByRole("button", { name: "Play Rocaille preview" })).toHaveAttribute("aria-pressed", "false");
  await mkdir(".impeccable/review", { recursive: true });
  await examples.screenshot({ path: `.impeccable/review/card-media-${testInfo.project.name}.png`, animations: "disabled" });
  expect((await new AxeBuilder({ page }).include("#card-media").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(examples.getByRole("button", { name: "Play Rocaille preview" })).toBeDisabled();
  expect(errors).toEqual([]);
});
