import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { seekAnimations } from "./animation";

test("sidebar search opens, filters, and navigates on desktop and mobile", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByText("New component", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Search manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Search the manual" });
  const input = dialog.getByRole("combobox");
  await expect(isMobile ? dialog : input).toBeFocused();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await input.fill("Typography");
  await expect(dialog.getByRole("option", { name: "Typography", exact: true })).toBeVisible();
  await expect(dialog.getByRole("option")).toHaveCount(1);
  expect((await new AxeBuilder({ page }).include('[data-slot="command-palette"]').analyze()).violations).toEqual([]);
  await input.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/typography$/);
  if (isMobile) await expect(page.locator('[data-slot="sidebar"]')).not.toBeVisible();
});

test("Command-K opens from an input and Escape restores focus", async ({ page, isMobile }) => {
  test.skip(isMobile, "Hardware keyboard shortcut is covered on desktop");
  await page.goto("/#input");
  await expect(page.locator("[data-app-shell]")).toHaveAttribute("data-hydrated", "true");
  const field = page.getByRole("textbox", { name: "Email address", exact: true });
  await field.focus();
  await field.press("ControlOrMeta+k");
  const input = page.getByRole("combobox", { name: "Search the manual" });
  await expect(input).toBeFocused();
  await input.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Color", exact: true })).toHaveAttribute("data-highlighted", "");
  await input.fill("not-a-command");
  await expect(page.getByText("No commands found. Try another search.")).toBeVisible();
  await input.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(field).toBeFocused();
  await field.press("ControlOrMeta+k");
  await expect(input).toHaveValue("");
  await input.press("Escape");
  await expect(field).toBeFocused();
});

test("default highlighting is instant for pointer and keyboard selection", async ({ page, isMobile }) => {
  test.skip(isMobile, "Pointer motion is for fine pointers");
  await page.goto("/");
  await page.getByRole("button", { name: "Search manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Search the manual" });
  const input = dialog.getByRole("combobox");
  const highlight = dialog.locator('[data-slot="command-fluid-highlight"]');
  const color = dialog.getByRole("option", { name: "Color", exact: true });
  await color.hover();
  expect(await highlight.evaluate(el => el.getAnimations().length)).toBe(0);
  await expect.poll(async () => Math.abs((await color.boundingBox())!.y - (await highlight.boundingBox())!.y)).toBeLessThan(1);
  await input.press("ArrowDown");
  const typography = dialog.getByRole("option", { name: "Typography", exact: true });
  await expect(typography).toHaveAttribute("data-highlighted", "");
  await expect.poll(async () => Math.abs((await typography.boundingBox())!.y - (await highlight.boundingBox())!.y)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await color.hover();
  await expect.poll(async () => Math.abs((await color.boundingBox())!.y - (await highlight.boundingBox())!.y)).toBeLessThan(1);
  await page.locator("html").evaluate(el => el.classList.add("dark"));
  expect((await new AxeBuilder({ page }).include('[data-slot="command-palette"]').analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/command-palette-dark.png" });
  await page.mouse.click(5, 5);
  await expect(dialog).not.toBeVisible();
});

test("palette controls opt into motion and reset to instant highlights", async ({ page, isMobile }) => {
  if (!isMobile) await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.matches('[data-slot="command-fluid-highlight"]')) {
        animation.playbackRate = 0;
        animation.pause();
      }
      return animation;
    };
  });
  await page.goto("/#command-palette");
  await page.getByRole("tab", { name: "Open Command palette controls", exact: true }).click();
  const animate = page.getByRole("checkbox", { name: "Animate highlight", exact: true });
  const shortcuts = page.getByRole("checkbox", { name: "Show shortcuts", exact: true });
  await expect(animate).not.toBeChecked();
  await expect(shortcuts).toBeChecked();
  await animate.check();
  const trigger = page.getByRole("button", { name: "Open example palette" });
  await page.getByRole("button", { name: "Close controls" }).click();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Document commands" });
  await expect(dialog.getByRole("option", { name: /^Rename document/ }).locator('[data-slot="kbd-group"]')).toHaveText("GR");
  await dialog.press("Escape");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("g");
  await page.keyboard.press("r");
  await expect(page.getByRole("status").filter({ hasText: "Selected: Rename document" })).toBeVisible();
  await trigger.click();
  await expect(dialog.getByRole("option", { name: /^Copy link/ }).locator("svg")).toHaveCount(0);
  if (!isMobile) {
    const highlight = dialog.locator('[data-slot="command-fluid-highlight"]');
    await dialog.getByRole("option", { name: /^Rename document/ }).hover();
    await dialog.getByRole("option", { name: /^Copy link/ }).hover();
    expect(Math.max(...await seekAnimations(highlight, 1))).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const copy = dialog.getByRole("option", { name: /^Copy link/ });
    await expect.poll(async () => Math.abs((await copy.boundingBox())!.y - (await highlight.boundingBox())!.y)).toBeLessThan(1);
  }
  await dialog.getByRole("option", { name: /^Add to favorites/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Selected: Add to favorites" })).toBeVisible();
  // The nonmodal controls dismiss when the example is opened.
  await page.locator("#command-palette").evaluate(element => element.scrollIntoView({ block: "start" }));
  const controls = page.getByRole("tab", { name: "Open Command palette controls", exact: true });
  if (await controls.getAttribute("aria-expanded") === "false") await controls.click();
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await expect(animate).not.toBeChecked();
  await expect(shortcuts).toBeChecked();
});

test("catalog groups and empty results preserve palette geometry", async ({ page }) => {
  await page.goto("/#command-palette");
  await page.getByRole("button", { name: "Browse commands", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Commands & groups", exact: true });
  const input = dialog.getByRole("combobox");
  await expect(dialog.getByRole("option", { name: "Archive document", exact: true })).toBeDisabled();
  const initial = await dialog.boundingBox();
  await input.fill("bookmark");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await input.fill("no matching command");
  await expect(dialog.getByText("No commands found. Try another search.")).toBeVisible();
  const empty = await dialog.boundingBox();
  expect(empty!.height).toBeCloseTo(initial!.height, 0);
  expect(empty!.y).toBeCloseTo(initial!.y, 0);
  await input.fill("");
  await dialog.getByRole("option", { name: "Workspace settings", exact: true }).click();
  await expect(page.getByRole("group", { name: "Browse commands preview", exact: true }).getByRole("status")).toHaveText("Selected: Workspace settings");
  await expect(page.getByRole("group", { name: "Open example palette preview", exact: true }).getByRole("status")).toHaveText("Example commands report your selection here.");
});

test("palette arrow navigation keeps focus in search and Tab reaches close", async ({ page }) => {
  await page.goto("/#command-palette");
  const trigger = page.getByRole("button", { name: "Browse commands", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Commands & groups", exact: true });
  const input = dialog.getByRole("combobox");
  await input.focus();
  await input.press("ArrowDown");
  await expect(input).toBeFocused();
  const selected = dialog.getByRole("option", { name: /^Copy link/ });
  await expect(selected).toHaveAttribute("data-highlighted", "");
  await expect(input).toHaveAttribute("aria-activedescendant", await selected.getAttribute("id") ?? "");
  await expect(dialog.getByRole("option").locator("svg")).toHaveCount(0);
  await input.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close command palette", exact: true })).toBeFocused();
  await expect(dialog.getByRole("button")).toHaveCount(1);
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
  await input.press("Escape");
  await expect(trigger).toBeFocused();
});
