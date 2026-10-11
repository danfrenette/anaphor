import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("source outline keeps selection while sibling and nested disclosures toggle", async ({ page }, testInfo) => {
  await page.goto("/#collapsible");
  if (testInfo.project.name === "mobile-webkit") await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const outline = page.getByRole("navigation", { name: "Source outline" });
  const first = outline.getByRole("button", { name: "1 Putting the domain model to work", exact: true });
  const selected = outline.getByRole("button", { name: "1.1 Knowledge crunching", exact: true });
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(selected).toHaveAttribute("aria-current", "true");
  await expect(outline.getByRole("button", { name: "3 Binding model and implementation", exact: true })).toHaveAttribute("aria-expanded", "false");
  await outline.getByRole("button", { name: "2 Communication and language", exact: true }).click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await outline.getByRole("button", { name: "2.1 Model conversations", exact: true }).click();
  await expect(outline.getByRole("button", { name: "2.1.1 Shared vocabulary" })).toBeVisible();
  const nested = outline.getByRole("button", { name: "2.1.1 Shared vocabulary" });
  await nested.focus();
  const second = outline.getByRole("button", { name: "2 Communication and language", exact: true });
  await second.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
  await expect(second).toBeFocused();
  await expect(nested).toBeHidden();
  await first.click();
  await expect(selected).toBeHidden();
  await first.press("Enter");
  await expect(selected).toHaveAttribute("aria-current", "true");
  await outline.getByRole("button", { name: "1.2 Continuous learning", exact: true }).click();
  await expect(outline.getByRole("button", { name: "1.2 Continuous learning", exact: true })).toHaveAttribute("aria-current", "true");
  await first.click();
  await first.press("Space");
  await expect(outline.getByRole("button", { name: "1.2 Continuous learning", exact: true })).toHaveAttribute("aria-current", "true");
});

test("standalone controls expose state, hide descendants and return focus", async ({ page }) => {
  await page.goto("/#collapsible");
  const demo = page.locator("#collapsible");
  const controlled = demo.getByRole("button", { name: "Controlled section", exact: true });
  await expect(demo.getByRole("button", { name: "Reading notes", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(controlled).toHaveAttribute("aria-expanded", "false");
  await controlled.press("Enter");
  const close = demo.getByRole("button", { name: "Close from inside" });
  await expect(close).toBeVisible();
  await close.press("Enter");
  await expect(controlled).toBeFocused();
  await expect(close).toBeHidden();
  await expect(controlled).toHaveCSS("outline-style", "solid");
  await controlled.press("Space");
  await expect(close).toBeVisible();
  const disabled = demo.getByRole("button", { name: "Unavailable section", exact: true });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveAttribute("aria-expanded", "false");
  await demo.getByRole("button", { name: "Reset controlled example" }).click();
  await expect(controlled).toHaveAttribute("aria-expanded", "false");
});

for (const theme of ["light", "dark"]) {
  test(`outline wraps in narrow sidebars with ${theme} tokens and reduced motion`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.goto("/#collapsible");
    const themeControl = page.getByRole("button", { name: "Switch to dark theme", exact: true });
    await expect(themeControl).toBeEnabled();
    if (theme === "dark") await themeControl.click();
    await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
    if (testInfo.project.name === "mobile-webkit") await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
    const outline = page.getByRole("navigation", { name: "Source outline" });
    await outline.evaluate(element => { if (element instanceof HTMLElement) element.style.width = "200px"; });
    const chapter = outline.getByRole("button", { name: "1 Putting the domain model to work", exact: true });
    await chapter.scrollIntoViewIfNeeded();
    await chapter.press("Space");
    await expect(chapter).toHaveAttribute("aria-expanded", "false");
    await chapter.press("Tab");
    await expect(outline.getByRole("button", { name: "2 Communication and language", exact: true })).toBeFocused();
    await chapter.press("Space");
    await expect(outline.getByRole("button", { name: "1.1 Knowledge crunching", exact: true })).toBeVisible();
    await expect(outline.locator('[data-slot="collapsible-content"]').first()).toHaveCSS("transition-duration", "0s");
    expect(await outline.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).include('[aria-label="Source outline"]').analyze();
    expect(results.violations).toEqual([]);
    await outline.screenshot({ path: testInfo.outputPath(`outline-${theme}.png`) });
  });
}


test("rapid disclosure reversals settle without clipping visible content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#collapsible");
  const trigger = page.locator("#collapsible").getByRole("button", { name: "Controlled section", exact: true });
  await trigger.click();
  await trigger.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
  await trigger.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator("#collapsible").locator('[data-slot="collapsible-content"]').filter({ hasText: "Expansion belongs" });
  await expect(panel.getByRole("button", { name: "Close from inside" })).toBeVisible();
  await expect.poll(() => panel.evaluate(element => Math.abs(element.clientHeight - element.scrollHeight))).toBeLessThanOrEqual(1);
});

test("nested reading notes retain independent state and reveal every ancestor on a match", async ({ page }) => {
  await page.goto("/#collapsible");
  const notes = page.getByRole("group", { name: "Nested reading notes", exact: true });
  const journal = notes.getByRole("button", { name: "Reading journal", exact: true });
  const chapter = notes.getByRole("button", { name: "Chapter notes", exact: true });
  const field = notes.getByRole("button", { name: "Field observations", exact: true });
  const content = notes.getByText("The orchard notebook connects field observations to a shared language.", { exact: true });
  await field.click();
  await expect(content).toBeVisible();
  await notes.getByRole("button", { name: "Questions to revisit", exact: true }).click();
  await expect(field).toHaveAttribute("aria-expanded", "true");
  await field.click();
  await chapter.click();
  await journal.click();
  await expect(content).toBeHidden();
  const panel = notes.locator('[data-slot="collapsible-content"]').filter({ hasText: "The orchard notebook connects field observations to a shared language." }).last();
  await expect(panel).toHaveAttribute("hidden", "until-found");
  // Exercises the browser event contract in both engines; native matching is checked separately.
  await panel.evaluate(element => element.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(journal).toHaveAttribute("aria-expanded", "true");
  await expect(chapter).toHaveAttribute("aria-expanded", "true");
  await expect(field).toHaveAttribute("aria-expanded", "true");
  await expect(content).toBeVisible();
  await expect(notes.getByRole("button", { name: "Questions to revisit", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(notes.getByRole("button", { name: "Further reading", exact: true })).toHaveAttribute("aria-expanded", "false");
});

test("native text search reveals collapsed content", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Text fragment navigation is verified in Chromium; both engines cover beforematch.");
  await page.goto("/#collapsible");
  await page.getByRole("button", { name: "Chapter notes", exact: true }).click();
  await page.getByRole("button", { name: "Reading journal", exact: true }).click();
  const ancestors = page.getByRole("group", { name: "Nested reading notes", exact: true }).locator('[data-slot="collapsible-content"]').filter({ hasText: "The orchard notebook connects field observations to a shared language." });
  for (const panel of await ancestors.all()) await expect(panel).toHaveAttribute("hidden", "until-found");
  await page.goto("/#:~:text=orchard%20notebook");
  await expect(page.getByRole("button", { name: "Reading journal", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Chapter notes", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Field observations", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("The orchard notebook connects field observations to a shared language.", { exact: true })).toBeVisible();
});
