import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("email feedback clears on edit and stays clear until blur or submit", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#input");
  const input = page.getByRole("textbox", { name: "Email address", exact: true });
  const submit = page.getByRole("button", { name: "Submit example" });
  await input.fill("incomplete");
  const spacing = async () => await submit.evaluate((element) => element.getBoundingClientRect().y) - await input.evaluate((element) => element.getBoundingClientRect().y);
  const before = await spacing();
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription("Enter a complete email address, such as you@example.com.");
  expect(await spacing()).toBeCloseTo(before, 1);
  await input.focus();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.press("End");
  await input.press("x");
  await expect(input).not.toHaveAttribute("aria-invalid");
  await expect(input).toHaveAccessibleDescription("Used only for this example. Nothing is sent.");
  await page.clock.fastForward(5000);
  await expect(input).not.toHaveAttribute("aria-invalid");
  await input.press("Enter");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toBeFocused();
  await input.fill("you@example.com");
  await input.press("Enter");
  await expect(input).not.toHaveAttribute("aria-invalid");
  await expect(page.getByText("Example complete. Nothing was sent.")).toBeVisible();
});

test("input controls preserve native states and reset", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#input");
  await page.getByRole("button", { name: "Open Input controls" }).click();
  const input = page.getByLabel("Try an input", { exact: true });
  await page.getByRole("combobox", { name: "Size", exact: true }).selectOption("sm");
  expect(await input.evaluate((element) => element.getBoundingClientRect().height)).toBe(testInfo.project.name === "mobile-webkit" ? 44 : 32);
  await page.getByLabel("Read only", { exact: true }).check();
  await expect(input).not.toBeEditable();
  await page.getByLabel("Disabled", { exact: true }).check();
  await expect(input).toBeDisabled();
  await page.getByLabel("Invalid", { exact: true }).check();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(input).toBeEditable();
  await expect(input).not.toHaveAttribute("aria-invalid");
  await page.getByLabel("Invalid", { exact: true }).check();
  await page.getByRole("button", { name: "Close controls" }).click();
  for (const dark of [false, true]) {
  await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
  const accessibility = await new AxeBuilder({ page }).include("#input").exclude('[data-tone="accent"][data-variant="solid"]').withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  }
});

test("visible validation feedback transitions without moving the form", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#input");
  const input = page.getByRole("textbox", { name: "Email address", exact: true });
  const form = page.locator("form").filter({ has: input });
  const hint = form.locator('[aria-hidden="true"]').filter({ hasText: /^Used only for this example\. Nothing is sent\.$/ });
  const error = form.locator('[aria-hidden="true"]').filter({ hasText: /^Enter a complete email address, such as you@example\.com\.$/ });
  const submit = form.getByRole("button", { name: "Submit example" });
  const spacing = async () => await submit.evaluate((element) => element.getBoundingClientRect().y) - await input.evaluate((element) => element.getBoundingClientRect().y);
  await expect(input).not.toHaveAttribute("aria-invalid");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveCSS("opacity", "1");
  await expect(error).toHaveCSS("opacity", "0");
  await input.fill("incomplete");
  await expect(input).not.toHaveAttribute("aria-invalid");
  await expect(error).toHaveCSS("opacity", "0");
  const before = await spacing();
  await input.press("Tab");
  await expect(error).toBeVisible();
  await expect(error).toHaveCSS("opacity", "1");
  await expect(hint).toHaveCSS("opacity", "0");
  expect(await spacing()).toBeCloseTo(before, 1);
  await input.fill("still-incomplete");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveCSS("opacity", "1");
  await expect(error).toHaveCSS("opacity", "0");
  expect(await spacing()).toBeCloseTo(before, 1);
});
