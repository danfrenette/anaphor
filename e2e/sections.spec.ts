import { expect, test } from "@playwright/test";

const section = (page: import("@playwright/test").Page, id: string) => page.locator(`[data-slot="section"][id="${id}"]`);

test("manual navigation moves focus, retargets held keys, and keeps the URL quiet", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("j");
  await expect(section(page, "principles")).toBeFocused();
  await page.keyboard.down("j");
  await page.keyboard.down("j");
  await page.keyboard.up("j");
  await expect(section(page, "typography")).toBeFocused();
  await expect.poll(async () => Math.abs(((await section(page, "typography").boundingBox())?.y ?? 0) - 88)).toBeLessThan(1);
  await page.keyboard.press("k");
  await expect(section(page, "color")).toBeFocused();
  await page.keyboard.press("Shift+G");
  await expect(section(page, "dropdown-menu")).toBeFocused();
  await page.keyboard.press("j");
  await expect(section(page, "dropdown-menu")).toBeFocused();
  await page.keyboard.press("g");
  await expect(section(page, "dropdown-menu")).toBeFocused();
  await page.keyboard.press("g");
  await expect(section(page, "purpose")).toBeFocused();
  await page.keyboard.press("k");
  await expect(section(page, "purpose")).toBeFocused();
  expect(new URL(page.url()).hash).toBe("");
});

test("manual scrolling determines the next section and Tab enters its content", async ({ page, isMobile }) => {
  await page.goto("/");
  await section(page, "typography").evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 88, behavior: "instant" }));
  await expect(section(page, "typography")).toHaveAttribute("data-active", "");
  if (!isMobile) await expect(page.getByRole("link", { name: "Typography", exact: true })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("j");
  await expect(section(page, "motion")).toBeFocused();
  await page.keyboard.press("k");
  await expect(section(page, "typography")).toBeFocused();
  await page.keyboard.press(isMobile ? "Alt+Tab" : "Tab");
  await expect(section(page, "typography").getByRole("link").first()).toBeFocused();
});

test("typing and modal navigation never move the underlying manual", async ({ page, isMobile }) => {
  await page.goto("/#input");
  const input = section(page, "input").getByRole("textbox").first();
  await input.focus();
  await page.keyboard.type("jkggG");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(/jkggG/);
  if (isMobile) {
    await page.getByRole("button", { name: "Open sidebar", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Close sidebar" }).focus();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Close sidebar" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").locator(":focus")).toHaveCount(1);
  }
});

test("uses 100 ms motion and reduced motion settles immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('[data-slot="sections"]')).toHaveCSS("--anaphor-section-duration", /^(100ms|0?\.1s)$/);
  await page.keyboard.press("j");
  await expect.poll(async () => Math.abs(((await section(page, "principles").boundingBox())?.y ?? 0) - 88)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const top = await page.evaluate(() => {
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "j", bubbles: true }));
    return document.getElementById("color")!.getBoundingClientRect().top;
  });
  expect(Math.abs(top - 88)).toBeLessThan(1);
  await expect(section(page, "color")).toBeFocused();
});
