import { expect, test } from "@playwright/test";
import { seekAnimations } from "./animation";

test("tabs catalog configures existing variants and keeps selection valid", async ({ page }) => {
  await page.goto("/#tabs");
  const section = page.locator("#tabs");
  for (const name of ["Variants", "Sizes", "Orientation & states", "Playground"]) await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  const preview = section.getByRole("group", { name: "Tabs playground" });
  const reports = preview.getByRole("tab", { name: "Reports", exact: true });
  await reports.click();
  await expect(preview.getByRole("tabpanel")).toContainText("A compact view");
  const height = await preview.evaluate(el => el.getBoundingClientRect().height);
  await page.getByRole("tab", { name: "Open Tabs controls", exact: true }).click();
  const controls = page.getByRole("region", { name: "Tabs controls", exact: true });
  const choose = async (name: string, value: string) => {
    await controls.getByRole("button", { name, exact: true }).click();
    await page.getByRole("menuitemradio", { name: value, exact: true }).click();
  };
  await controls.getByRole("checkbox", { name: "Disable Reports", exact: true }).check();
  await expect(reports).toBeDisabled();
  await expect(preview.getByRole("tab", { name: "Library", exact: true })).toHaveAttribute("aria-selected", "true");
  await choose("Variant", "line");
  await choose("Size", "lg");
  await choose("Orientation", "vertical");
  await controls.getByRole("checkbox", { name: "Icons", exact: true }).check();
  await page.getByRole("button", { name: "Close controls" }).click();
  await expect(preview.getByRole("tablist")).toHaveAttribute("data-variant", "line");
  await expect(preview.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  await preview.getByRole("tab", { name: "Library", exact: true }).press("ArrowDown");
  await expect(preview.getByRole("tab", { name: "Recents", exact: true })).toBeFocused();
  await preview.getByRole("tab", { name: "Recents", exact: true }).press("Enter");
  await expect(preview.getByRole("tabpanel")).toContainText("four references");
  await section.getByRole("button", { name: "Show playground code", exact: true }).press("Enter");
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText('orientation="vertical"');
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText('value="reports" disabled');
  expect(await preview.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
  await page.getByRole("tab", { name: "Open Tabs controls", exact: true }).click();
  await controls.getByRole("button", { name: "Reset controls" }).click();
  await expect(reports).toBeEnabled();
  await expect(preview.getByRole("tablist")).toHaveAttribute("data-size", "md");
  await expect(preview.getByRole("tab", { name: "Library", exact: true })).toHaveAttribute("aria-selected", "true");
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("lifted tabs move the raised surface with the clip only for pointer selection", async ({ page }) => {
  await page.addInitScript(() => document.addEventListener("transitionrun", event => {
    const indicator = event.target instanceof Element ? event.target.closest('[data-slot="tabs-indicator"]') : null;
    for (const animation of indicator?.getAnimations({ subtree: true }) ?? []) animation.pause();
  }));
  await page.goto("/#tabs");
  const list = page.getByRole("tablist", { name: "lifted variant", exact: true });
  const indicator = list.locator('[data-slot="tabs-indicator"]');
  const running = () => indicator.evaluate(el => el.getAnimations({ subtree: true }).length);
  const edges = () => indicator.evaluate(el => {
    const [, clipRight = NaN, , clipLeft = NaN] = getComputedStyle(el).clipPath.match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
    const surface = getComputedStyle(el, "::before");
    return { clipLeft, left: parseFloat(surface.left) - clipLeft, right: parseFloat(surface.right) - clipRight, shadow: surface.boxShadow };
  });
  await list.scrollIntoViewIfNeeded();
  expect(await running()).toBe(0);
  const start = await edges();
  expect(start.shadow).not.toBe("none");

  await list.getByRole("tab", { name: "Reports", exact: true }).click();
  await seekAnimations(indicator, 0.5);
  const middle = await edges();
  expect(middle.clipLeft).toBeGreaterThan(start.clipLeft);
  expect(middle.left).toBeCloseTo(1, 2);
  expect(middle.right).toBeCloseTo(1, 2);
  await seekAnimations(indicator, 1);

  await list.getByRole("tab", { name: "Reports", exact: true }).press("ArrowLeft");
  await page.keyboard.press("Enter");
  await expect(list.getByRole("tab", { name: "Recents", exact: true })).toHaveAttribute("aria-selected", "true");
  expect(await running()).toBe(0);
  await expect(list.getByRole("tab", { name: "Recents", exact: true })).toHaveCSS("outline-style", "solid");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await list.getByRole("tab", { name: "Library", exact: true }).click();
  await expect(list.getByRole("tab", { name: "Library", exact: true })).toHaveAttribute("aria-selected", "true");
  expect(await running()).toBe(0);
});
