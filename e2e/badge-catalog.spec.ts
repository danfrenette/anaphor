import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { selectControl } from "./playground-select";

test("badge catalog compares appearances and preserves playground controls", async ({ page }) => {
  await page.goto("/#badge");
  const section = page.locator("#badge");
  for (const name of ["Variants", "Sizes", "Icons & Shapes", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const trigger = section.getByRole("button", { name: "Show icons & shapes code" });
  await trigger.press("Enter");
  await expect(section.getByLabel("Icons & Shapes code", { exact: true })).toBeVisible();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("tab", { name: "Open Badge controls" }).click();
  await selectControl(page, "Variant", "outline");
  await selectControl(page, "Size", "lg");
  await selectControl(page, "Shape", "round");
  await page.getByRole("checkbox", { name: "Icon", exact: true }).check();
  const badge = section.getByRole("group", { name: "Badge preview" }).locator('[data-slot="badge"]');
  await expect(badge).toHaveAttribute("data-variant", "outline");
  await expect(badge).toHaveAttribute("data-size", "lg");
  await expect(badge).toHaveAttribute("data-shape", "round");
  await expect(badge.locator("svg")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(badge).toHaveAttribute("data-variant", "soft");
  await expect(badge).toHaveAttribute("data-size", "md");
  await expect(badge).toHaveAttribute("data-shape", "square");
  await expect(badge.locator("svg")).toHaveCount(0);
  await page.getByRole("button", { name: "Close controls" }).click();
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((el, dark) => el.classList.toggle("dark", dark), theme === "dark");
    expect((await new AxeBuilder({ page }).include("#badge").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});
