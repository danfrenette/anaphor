import { expect, test } from "@playwright/test";

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
  await page.getByRole("tab", { name: "Open Collapsible controls", exact: true }).click();
  await page.getByRole("region", { name: "Collapsible controls", exact: true }).getByRole("button", { name: "Reset controls" }).click();
  await expect(controlled).toHaveAttribute("aria-expanded", "false");
});

test("rapid disclosure reversals settle without clipping visible content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#collapsible");
  const trigger = page.locator("#collapsible").getByRole("button", { name: "Controlled section", exact: true });
  await trigger.click();
  await trigger.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
  await trigger.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("group", { name: "Collapsible playground" }).locator('[data-slot="collapsible-content"]');
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

test("catalog controls synchronize disclosure state and reset its presentation", async ({ page }) => {
  await page.goto("/#collapsible");
  const section = page.locator("#collapsible");
  for (const name of ["States", "Nested sections", "Playground"]) await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  const preview = section.getByRole("group", { name: "Collapsible playground" });
  const trigger = preview.getByRole("button", { name: "Controlled section", exact: true });
  await trigger.scrollIntoViewIfNeeded();
  const height = await preview.evaluate(el => el.getBoundingClientRect().height);
  await page.getByRole("tab", { name: "Open Collapsible controls", exact: true }).click();
  const controls = page.getByRole("region", { name: "Collapsible controls", exact: true });
  await controls.getByRole("checkbox", { name: "Open", exact: true }).check();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await controls.getByRole("checkbox", { name: "Show caret", exact: true }).uncheck();
  await expect(trigger.locator("svg")).toHaveCount(0);
  await controls.getByRole("checkbox", { name: "Disabled", exact: true }).check();
  await expect(trigger).toBeDisabled();
  await controls.getByRole("checkbox", { name: "Open", exact: true }).uncheck();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await controls.getByRole("button", { name: "Reset controls" }).click();
  await expect(trigger).toBeEnabled();
  await expect(trigger.locator("svg")).toHaveCount(1);
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await expect(preview.locator('[data-slot="collapsible-content"]')).toHaveCSS("transition-duration", "0s");
  expect(await preview.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
  await section.getByRole("button", { name: "Show playground code", exact: true }).press("Enter");
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText("useState(true)");
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
