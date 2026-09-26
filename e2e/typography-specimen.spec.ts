import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { selectControl } from "./playground-select";

for (const theme of ["light", "dark"]) {
  test(`typography defaults: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/typography");
    await expect.poll(() => page.locator("html").evaluate(element => element.classList.contains("dark"))).toBe(theme === "dark");
    await page.evaluate(() => document.fonts.ready);
    const sample = page.getByRole("article", { name: "Reading sample" });
    await expect(sample).toHaveCSS("font-size", "16px");
    await expect(sample).toHaveCSS("line-height", "25.6px");
    await expect(sample.locator("strong")).toHaveCSS("font-weight", "700");
    await expect(sample.locator("blockquote")).toHaveCSS("font-style", "italic");
    await expect(sample.locator("blockquote")).toHaveCSS("margin-block-start", "32px");
    await expect(sample.locator("blockquote > p")).toHaveCSS("margin-block-start", "0px");
    await expect(sample.locator("ul > li").last()).toHaveCSS("margin-block-start", "12px");
    await expect(sample.locator("li ul")).toHaveCSS("list-style-type", "circle");
    await expect(sample.locator("h2")).toHaveCSS("text-transform", "uppercase");
    await expect(sample.locator("h2")).toHaveText("A useful record of the work");
    await expect(sample.locator("h3")).toHaveCSS("text-transform", "none");
    const headingSizes = await page.locator("#content h1, [aria-label='Reading sample'] h2, [aria-label='Reading sample'] h3").evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
    expect(headingSizes).toEqual([36, 24, 20]);
    await expect(sample.locator("a")).toHaveCSS("text-decoration-line", "underline");
    await expect(sample.locator("h2")).toHaveCSS("font-family", /Bell Gothic Black/);
    await expect(sample.locator("em")).toHaveCSS("font-style", "italic");
    await expect(sample.locator("code").first()).toHaveCSS("font-family", /Magda Clean Mono/);
    expect((await new AxeBuilder({ page }).include("#content").analyze()).violations).toEqual([]);
    const screenshotStyle = await page.addStyleTag({ content: "header, [data-slot='morph-surface'], a[href='#content'] { visibility: hidden !important; }" });
    await expect(page.getByRole("region", { name: "Typography specimen", exact: true })).toHaveScreenshot(`typography-${theme}.png`, { animations: "disabled" });
    await screenshotStyle.evaluate(element => element.parentNode?.removeChild(element));

    const link = sample.getByRole("link", { name: "type reference" });
    await link.focus();
    await expect(link).toHaveCSS("outline-style", "solid");
    await link.press("Enter");
    await expect(page).toHaveURL(/#type-reference$/);
    await expect(page.locator("#type-reference")).toBeFocused();
    const reveal = page.getByRole("button", { name: "Show value" });
    await reveal.focus();
    await reveal.press("Enter");
    await expect(page.locator("#full-identifier")).toHaveCSS("text-overflow", "clip");
    await expect(page.getByRole("button", { name: "Hide value" })).toHaveAttribute("aria-expanded", "true");
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    await expect(sample).toHaveCSS("font-size", "32px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("reading experiments are bounded, local, and resettable", async ({ page }) => {
  await page.goto("/typography");
  await page.getByText("Reading experiments", { exact: true }).click();
  const sample = page.getByRole("article", { name: "Reading sample" });
  const before = await sample.evaluate(element => element.style.cssText);
  for (const [label, value] of [["Body size (px)", "20"], ["Body weight", "600"], ["Measure (ch)", "45"], ["Leading", "1.8"], ["Tracking (em)", "0.02"], ["Color role", "Primary"], ["Link decoration", "Double"]] as const) {
    await selectControl(page, label, value);
  }
  await expect(page.getByRole("status")).toHaveText("Local experiment — not a system change");
  await expect(sample).toHaveCSS("font-size", "20px");
  await expect(sample).toHaveCSS("font-weight", "600");
  await expect(sample).toHaveCSS("line-height", "36px");
  await expect(sample.locator("a")).toHaveCSS("text-decoration-style", "double");
  await expect(page.locator('#type-reference [data-variant="body"]').first()).toHaveCSS("font-size", "16px");
  await page.getByRole("button", { name: "Reset typography" }).click();
  expect(await sample.evaluate(element => element.style.cssText)).toBe(before);
  await expect(page.getByRole("status")).toHaveText("Approved defaults");
});
