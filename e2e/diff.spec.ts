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
  expect(darkAccessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  await page.screenshot({ path: `test-results/diff-${testInfo.project.name}-dark.png`, fullPage: false });
});

for (const key of ["Enter", "Space"]) {
  test(`unchanged context expands from the keyboard with ${key}`, async ({ page }) => {
    await page.goto("/#diff");
    const full = page.getByRole("region", { name: "Diff playground", exact: true });
    const lines = full.locator("[data-line]");
    await expect(lines.first()).toBeVisible();
    const before = await lines.count();
    const expand = full.getByRole("button", { name: "Expand unchanged lines", exact: true }).first();
    await expand.focus();
    await expect(expand).toBeFocused();
    await expand.press(key);
    await expect.poll(() => lines.count()).toBeGreaterThan(before);
  });
}

test("authored notes disclose inline and popover explanations without duplicating external reveals", async ({ page }) => {
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  const note = diff.getByRole("button", { name: "1. Guard missing sections", exact: true });
  await expect(note).toHaveAttribute("aria-expanded", "false");
  await note.click();
  await expect(diff.getByText("Unknown sections return no next section instead of restarting at the beginning.")).toBeVisible();
  await note.click();
  await diff.getByRole("button", { name: "2. Keep the return nearby", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("The guard and successful return stay together.");
  await page.keyboard.press("Escape");
  await expect(diff.getByRole("button", { name: "2. Keep the return nearby", exact: true })).toBeFocused();
});

test("external notes open hidden context and reveal only inside the bounded diff", async ({ page }) => {
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  await diff.getByRole("button", { name: "Collapse src/articles/reading-position.ts", exact: true }).click();
  const external = page.getByRole("button", { name: "Locate 3: Keep the existing label", exact: true });
  await external.focus();
  const pagePosition = await page.evaluate(() => scrollY);
  await external.press("Enter");
  await expect(external).toBeFocused();
  await expect(diff.getByRole("button", { name: "Collapse src/articles/reading-position.ts", exact: true })).toBeVisible();
  const code = diff.getByRole("region", { name: "Code changes: Annotated navigation", exact: true });
  await expect(code.locator('[data-line][data-selected-line]').first()).toContainText("export function sectionLabel");
  await expect(diff.getByRole("button", { name: "3. Keep the existing label", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => diff.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  expect(await code.evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(280);
  expect(await page.evaluate(() => scrollY)).toBe(pagePosition);
  await expect.poll(() => code.evaluate(element => {
    const line = element.querySelector('diffs-container')?.shadowRoot?.querySelector('[data-line][data-selected-line]');
    if (!line) return false;
    const bounds = element.getBoundingClientRect();
    const target = line.getBoundingClientRect();
    return target.top >= bounds.top && target.bottom <= bounds.bottom;
  })).toBe(true);
});

test("unchanged excerpts preserve original numbering and expand surrounding context", async ({ page }) => {
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Unchanged label contract", exact: true });
  await expect(diff.getByText("Unchanged file · Excerpts with expandable context.")).toBeVisible();
  await expect(diff.locator('[data-line="8"]')).toContainText("export function sectionLabel");
  await expect(diff.locator('[data-line]').filter({ hasText: "export type ReadingPosition" })).toHaveCount(0);
  const lines = await diff.locator('[data-line]').count();
  await diff.getByRole("button", { name: "Expand unchanged lines", exact: true }).first().press("Enter");
  await expect.poll(() => diff.locator('[data-line]').count()).toBeGreaterThan(lines);
  await expect(diff.locator('[data-line]').filter({ hasText: "export type ReadingPosition" })).toBeVisible();
});

test("annotation focus, failure recovery, themes and zoom remain usable", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("anaphor-theme", "light"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  await page.getByRole("button", { name: "Locate 1: Guard missing sections", exact: true }).click();
  await expect(diff.locator('[data-line][data-selected-line]')).not.toHaveCount(0);
  await page.getByRole("button", { name: "Show unavailable source", exact: true }).click();
  await expect(diff.getByRole("status")).toContainText("Authored explanations are retained");
  const note = diff.getByRole("button", { name: "1. Guard missing sections", exact: true });
  await note.press("Enter");
  await expect(diff.getByText("Unknown sections return no next section instead of restarting at the beginning.")).toBeVisible();
  await page.getByRole("button", { name: "Restore captured source", exact: true }).click();
  await expect(diff.locator('[data-line][data-selected-line]')).toHaveCount(0);
  await expect(note).toHaveAttribute("aria-expanded", "false");
  await page.setViewportSize({ width: 640, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await note.press("Enter");
  await expect(note).toBeFocused();
  await expect(note).toHaveAttribute("aria-expanded", "true");
  await expect(note.locator('..').locator('[data-slot="collapsible-content"]')).toHaveCSS("transition-duration", "0s");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await note.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("notes-zoom.png") });
  await page.evaluate(() => { document.documentElement.style.zoom = "1"; });
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /light/);
    await diff.getByRole("button", { name: "2. Keep the return nearby", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Base UI's WebKit/VoiceOver focus sentinels intentionally use role=button
    // to intercept the virtual cursor (Base UI utils/FocusGuard). They are not
    // authored commands; keep every rule enabled for the actual note UI.
    const accessibility = await new AxeBuilder({ page }).include('[data-slot="popover-popup"]').include('#diff').exclude('[data-base-ui-focus-guard]').analyze();
    expect(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`notes-${theme}.png`) });
    await page.keyboard.press("Escape");
    await expect(diff.getByRole("button", { name: "2. Keep the return nearby", exact: true })).toBeFocused();
  }
});


test("before-side authored emphasis does not select the adjacent after-side code", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Two columns require a desktop surface.");
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  await expect(diff.locator('[data-diff-type="split"]')).toBeVisible();
  await page.getByRole("button", { name: "Locate 4: Replace implicit wrapping", exact: true }).click();
  await expect(diff.locator('code[data-deletions] [data-line][data-selected-line]')).toContainText("return document.sections[index + 1]");
  await expect(diff.locator('code[data-additions] [data-line][data-selected-line]')).toHaveCount(0);
});

test("unified authored ranges exclude interleaved changes from the other side", async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 800 });
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  await page.getByRole("button", { name: "Locate 1: Guard missing sections", exact: true }).click();
  await expect(diff.locator('[data-diff-type="single"]')).toBeVisible();
  await expect(diff.locator('[data-line][data-line-type="change-addition"][data-selected-line]')).toHaveCount(3);
  await expect(diff.locator('[data-line][data-line-type="change-deletion"][data-selected-line]')).toHaveCount(0);
});

test("an unavailable authored target clears unrelated legacy emphasis without revealing it", async ({ page }) => {
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Navigation guard excerpt", exact: true });
  await page.getByRole("button", { name: "Locate the guard", exact: true }).click();
  await expect(diff.locator('[data-line][data-selected-line]')).toHaveCount(1);
  await diff.getByRole("button", { name: "Collapse src/articles/reading-position.ts", exact: true }).click();
  const missing = page.getByRole("button", { name: "Locate omitted context", exact: true });
  await missing.focus();
  const scroll = await page.evaluate(() => scrollY);
  await missing.press("Enter");
  await expect(diff.getByText("Code range unavailable in supplied source.")).toBeVisible();
  await expect(diff.locator('[data-line][data-selected-line]')).toHaveCount(0);
  await expect(missing).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await diff.getByRole("button", { name: "1. Explain omitted context", exact: true }).click();
  await expect(diff.getByText("This patch does not contain the unchanged label implementation.")).toBeVisible();
});

test("an invalid reveal cannot later turn emphasis-only selection into navigation", async ({ page }) => {
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  const code = diff.getByRole("region", { name: "Code changes: Annotated navigation", exact: true });
  await page.getByRole("button", { name: "Locate 5: Explain a missing capture", exact: true }).click();
  await expect(diff.getByText("Code range unavailable in supplied source.")).toBeVisible();
  const emphasize = page.getByRole("button", { name: "Emphasize guard only", exact: true });
  await emphasize.focus();
  await expect.poll(() => diff.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  await code.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const scroll = await code.evaluate(element => element.scrollTop);
  await emphasize.click();
  await expect(diff.locator('[data-line][data-selected-line]')).not.toHaveCount(0);
  await expect.poll(() => code.evaluate(element => element.scrollTop)).toBe(scroll);
});

test("source replacement and a new reveal key reveal the current target", async ({ page }) => {
  await page.goto("/#diff");
  const diff = page.getByRole("region", { name: "Annotated navigation", exact: true });
  const code = diff.getByRole("region", { name: "Code changes: Annotated navigation", exact: true });
  await page.getByRole("button", { name: "Locate 3: Keep the existing label", exact: true }).click();
  await expect(diff.locator('[data-line="8"][data-selected-line]').first()).toBeVisible();
  await code.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const replace = page.getByRole("button", { name: "Replace captured source", exact: true });
  await replace.click();
  await expect(replace).toBeFocused();
  await expect.poll(() => code.evaluate(element => {
    const line = element.querySelector('diffs-container')?.shadowRoot?.querySelector('[data-line][data-selected-line]');
    if (!line) return false;
    const bounds = element.getBoundingClientRect();
    const target = line.getBoundingClientRect();
    return target.top >= bounds.top && target.bottom <= bounds.bottom;
  })).toBe(true);
});
