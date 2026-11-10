import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the manual field shows starting Markdown and its current output", async ({ page, isMobile }) => {
  await page.goto("/markdown-editor");

  const editor = page.getByRole("textbox", { name: "Research note" });
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("aria-multiline", "true");
  await expect(editor.getByRole("heading", { name: "Field notes" })).toBeVisible();
  const output = page.getByLabel("Current Markdown", { exact: true });
  await expect(output).toContainText("## Field notes");
  await expect(output).toContainText("**bold**");
  await expect(output).toContainText("*italic*");

  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Markdown editor", exact: true });
  await expect(link).toHaveAttribute("href", "/markdown-editor");
  await expect(link).toHaveAttribute("aria-current", "page");
});

test("typed consecutive spaces stay visible and remain in Markdown", async ({ page, browserName }, testInfo) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  await editor.click();
  await editor.press("ControlOrMeta+A");
  await editor.pressSequentially("Alpha  beta   gamma");

  const output = page.getByLabel("Current Markdown", { exact: true });
  const expected = browserName === "webkit" ? "Alpha \u00a0beta \u00a0 gamma" : "Alpha\u00a0 beta\u00a0 \u00a0gamma";
  await expect.poll(() => output.textContent()).toBe(expected);
  const widths = await editor.evaluate(element => {
    const textNode = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = textNode.nextNode();
    while (node && (!node.textContent?.includes("Alpha") || !node.textContent.includes("gamma"))) node = textNode.nextNode();
    if (!node) throw new Error("Typed text is not visible");
    const range = document.createRange();
    const measure = (start: number, length: number) => {
      range.setStart(node, start);
      range.setEnd(node, start + length);
      return range.getBoundingClientRect().width;
    };
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas measurement is unavailable");
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return { one: context.measureText(" ").width, two: measure(5, 2), three: measure(11, 3) };
  });
  expect(widths.two).toBeGreaterThan(widths.one * 1.75);
  expect(widths.three).toBeGreaterThan(widths.one * 2.75);
  await editor.screenshot({ path: testInfo.outputPath("consecutive-spaces.png") });
});

test("a typed line break stays inside a paragraph", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  await editor.click();
  await editor.press("ControlOrMeta+A");
  await editor.pressSequentially("Alpha");
  // ProseMirror's iOS fallback redispatches Enter without Shift; Mod+Enter exercises the same HardBreak command there.
  await editor.press(browserName === "webkit" ? "ControlOrMeta+Enter" : "Shift+Enter");
  await editor.pressSequentially("Beta");

  await expect.poll(() => editor.evaluate(element => {
    if (!(element instanceof HTMLElement)) throw new Error("The editor must be an HTML element");
    return element.innerText;
  })).toBe("Alpha\nBeta");
  const output = page.getByLabel("Current Markdown", { exact: true });
  await expect.poll(() => output.textContent()).toBe("Alpha  \nBeta");
});

test("a soft line break in starting Markdown does not force a visual break", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  const paragraph = editor.getByText("This soft line wraps like rendered Markdown.", { exact: true });
  await expect(paragraph).toBeVisible();

  const lineHeight = await paragraph.evaluate(element => Number.parseFloat(getComputedStyle(element).lineHeight));
  const bounds = await paragraph.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.height).toBeCloseTo(lineHeight, 1);
});

test("typed formatting works in the browser", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  const output = page.getByLabel("Current Markdown", { exact: true });
  await editor.click();
  await editor.press("ControlOrMeta+A");
  await editor.pressSequentially("### Browser");
  await expect.poll(() => output.textContent()).toBe("### Browser");
  await editor.press("ControlOrMeta+A");
  await editor.press("ControlOrMeta+B");
  await expect.poll(() => output.textContent()).toBe("### **Browser**");
});

test("the editor keeps keyboard focus order and passes accessibility checks", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  await editor.focus();
  await expect(editor).toBeFocused();
  await editor.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("link", { name: "Help and documentation" })).toBeFocused();
  await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Shift+Tab" : "Shift+Tab");
  await expect(editor).toBeFocused();

  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("the manual page mounts without hydration warnings or browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/markdown-editor");
  await expect(page.getByRole("textbox", { name: "Research note" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Markdown editor", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
