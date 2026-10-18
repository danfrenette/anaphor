import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("diff reading controls, excerpts, file states and theme remain usable", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("anaphor-theme", "light"));
  await page.goto("/#diff");
  const section = page.locator("#diff");
  await section.scrollIntoViewIfNeeded();
  const full = section.getByRole("region", { name: "Diff playground", exact: true }).first();
  await expect(full.locator("diffs-container").getByText("if (index < 0) return undefined;", { exact: false })).toBeVisible();
  const header = full.locator("header");
  await expect(header.getByRole("button", { name: "Switch to split view", exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Copy new file" })).toBeVisible();
  await expect(section.locator("[data-line][data-selected-line]")).toHaveCount(0);
  await full.getByRole("button", { name: "Wrap lines", exact: true }).click();
  await expect(full.getByRole("button", { name: "Unwrap lines", exact: true })).toBeVisible();
  const split = full.getByRole("button", { name: "Switch to split view", exact: true });
  if (testInfo.project.name === "desktop-chromium") {
    await full.getByRole("button", { name: "Unwrap lines", exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("tooltip")).toContainText("compare the old and new code side by side");
    await page.keyboard.press("Escape");
    await split.click();
    await expect(full.locator("[data-diff-type='split']")).toBeVisible();
    await expect(full.getByRole("button", { name: "Switch to unified view" })).toBeVisible();
    await expect(split).toHaveCount(0);
  } else {
    await expect(split).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const panel = full.locator('[data-slot="collapsible-content"]');
  await expect(panel).toHaveCSS("transition-duration", "0.2s");
  await full.getByRole("button", { name: "Collapse src/articles/reading-position.ts" }).click();
  await expect(full.getByRole("region", { name: "Code changes: Diff playground" })).toBeHidden();
  await expect(header).toHaveCSS("border-bottom-width", "0px");
  await expect.poll(() => panel.evaluate(element => element.getBoundingClientRect().height)).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panel).toHaveCSS("transition-duration", "0s");
  await full.getByRole("button", { name: "Expand src/articles/reading-position.ts" }).focus();
  await page.keyboard.press("Enter");
  await expect(full.getByRole("region", { name: "Code changes: Diff playground" })).toBeVisible();
  await page.getByRole("tab", { name: "Open Diff controls", exact: true }).click();
  await page.getByRole("region", { name: "Diff controls", exact: true }).getByRole("button", { name: "Context", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "expanded", exact: true }).click();
  await page.getByRole("button", { name: "Height", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Bounded", exact: true }).click();
  await page.getByRole("button", { name: "Close controls", exact: true }).click();
  await expect(full.locator("diffs-container").getByText("export type ReadingPosition = {", { exact: false }).first()).toBeVisible();
  await section.getByRole("button", { name: "Locate the guard" }).click();
  await expect(section.locator("[data-line][data-selected-line]")).toHaveCount(1);
  await expect(section.locator("[data-line][data-selected-line]")).toBeInViewport();
  await expect(section.getByText("Highlighted line 20: the guard for a missing section.")).toBeVisible();
  await section.getByRole("button", { name: "Clear highlight" }).click();
  await expect(section.locator("[data-line][data-selected-line]")).toHaveCount(0);
  for (const name of ["Layouts", "Line emphasis", "File states", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await section.getByRole("button", { name: "Show layouts code" }).press("Enter");
  await expect(section.getByLabel("Layouts code", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Show layouts code" }).press("Enter");
  await expect(section.getByText("File renamed without content changes.")).toBeVisible();
  await expect(section.getByText("Binary file changed. A text diff is not available.")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include("#diff").analyze();
  expect(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  await full.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/diff-${testInfo.project.name}-light.png`, fullPage: false });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await full.scrollIntoViewIfNeeded();
  const darkAccessibility = await new AxeBuilder({ page }).include("#diff").analyze();
  expect(darkAccessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) }))).toEqual([]);
  await page.screenshot({ path: `test-results/diff-${testInfo.project.name}-dark.png`, fullPage: false });
});
