import { expect, test } from "@playwright/test";

test("kbd catalog presets update notation and inline code", async ({ page }) => {
  await page.goto("/#kbd");
  const section = page.locator("#kbd");
  for (const name of ["Keys", "Combinations", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const preview = section.getByRole("group", { name: "Keyboard notation preview" });
  await section.getByRole("button", { name: "Show playground code", exact: true }).press("Enter");
  const code = section.getByLabel("Playground code", { exact: true });
  await expect(code).toContainText('aria-label="Command K"');
  await page.getByRole("tab", { name: "Open Kbd controls" }).click();
  const controls = page.getByRole("region", { name: "Kbd controls", exact: true });
  const choose = async (label: string, option: string) => {
    await controls.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("menuitemradio", { name: option, exact: true }).click();
  };
  await choose("Platform notation", "Windows");
  await expect(preview.locator("kbd[data-slot=kbd-group]")).toHaveAttribute("aria-label", "Control K");
  await expect(code).toContainText("<Kbd>Ctrl</Kbd>");
  const height = await preview.evaluate(el => el.getBoundingClientRect().height);
  await choose("Example", "Sequence");
  await expect(preview).toContainText("then");
  await expect(code).toContainText('aria-label="G then A"');
  await choose("Example", "Single key");
  await expect(preview.locator("kbd")).toHaveText("Esc");
  expect(await preview.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
  await controls.getByRole("button", { name: "Reset controls" }).click();
  await expect(code).toContainText('aria-label="Command K"');
  await page.getByRole("button", { name: "Close controls" }).click();
  await section.getByRole("button", { name: "Show playground code", exact: true }).press("Enter");
  await expect(code).toBeHidden();
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((el, value) => el.classList.toggle("dark", value), dark);
    expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect(preview.locator('[data-slot=kbd]').first()).toHaveCSS("height", "20px");
  }
});
