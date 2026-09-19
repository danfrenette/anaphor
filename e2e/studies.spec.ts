import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Signal filters, expands, changes time range, and exports the visible data", async ({ page }) => {
  await page.goto("/studies/signal");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await page.getByLabel("Traffic period").selectOption("6");
  await expect(page.getByRole("img", { name: /over 6 hours/ })).toBeVisible();
  await page.getByLabel("Workload status").selectOption("Degraded");
  await expect(page.getByText("Showing 1 of 5 workloads", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: /image-pipeline/ }).click();
  await expect(page.getByText(/Elevated latency in sfo-1/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("signal-workloads.csv");
  await page.getByLabel("Search workloads").fill("missing");
  await expect(page.getByText("No workloads match.", { exact: false })).toBeVisible();
  await page.getByLabel("Search workloads").fill("");
  await page.getByLabel("Workload status").selectOption("All workloads");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect((await new AxeBuilder({ page }).include("#content").analyze()).violations).toEqual([]);
  await page.screenshot({ path: `test-results/signal-${test.info().project.name}-dark.png`, fullPage: true });
  await page.getByRole("button", { name: "Light mode" }).click();
  await page.locator("#content").evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)));
  expect((await new AxeBuilder({ page }).include("#content").analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Field Notes has a keyboard-operable figure and a readable mobile layout", async ({ page }) => {
  await page.goto("/studies/field-notes");
  await expect(page.getByRole("heading", { name: "Not everything needs to move." })).toBeVisible();
  const slider = page.getByRole("slider", { name: /Competing signals/ });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("3");
  expect((await new AxeBuilder({ page }).include("#content").analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/field-notes-${test.info().project.name}.png`, fullPage: true });
});

test("Studies overview links to both contexts", async ({ page }) => {
  await page.goto("/studies");
  await page.locator("#content").getByRole("link", { name: /Signal/ }).click();
  await expect(page).toHaveURL(/\/studies\/signal$/);
});
