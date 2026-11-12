import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`in-place parity: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    await page.evaluate(() => document.fonts.ready);
    const editor = page.getByRole("textbox", { name: "In-place note" });
    const prose = page.getByLabel("Rendered note");
    await expect(editor).toBeVisible();
    await editor.focus();
    const chrome = await editor.evaluate(element => [element, element.parentElement, element.parentElement?.parentElement].filter((node): node is HTMLElement => node instanceof HTMLElement).map(node => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, border: style.borderTopWidth, padding: style.padding, outline: style.outlineStyle, minHeight: style.minHeight, maxHeight: style.maxHeight, overflow: style.overflowY };
    }));
    for (const style of chrome) expect(style).toEqual({ background: "rgba(0, 0, 0, 0)", border: "0px", padding: "0px", outline: "none", minHeight: "0px", maxHeight: "none", overflow: "visible" });
    await editor.blur();
    const selectors = ["h1", ":scope > p:nth-of-type(1)", ":scope > p:nth-of-type(2)", "h2", ":scope > ul", "ul ul", ":scope > ol", "blockquote", "pre", "hr", ":scope > p:last-child"];
    const measure = (root: Element, queries: string[]) => {
      const rootRect = root.getBoundingClientRect();
      return queries.map(selector => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { selector, top: rect.top - rootRect.top, height: rect.height, marginTop: style.marginTop, marginBottom: style.marginBottom };
      });
    };
    const actual = await editor.evaluate(measure, selectors);
    const expected = await prose.evaluate(measure, selectors);
    console.log(JSON.stringify({ theme, actual, expected }));
    for (let i = 0; i < selectors.length; i++) {
      expect(Math.abs(actual[i].top - expected[i].top), `${selectors[i]} top`).toBeLessThanOrEqual(1);
      expect(Math.abs(actual[i].height - expected[i].height), `${selectors[i]} height`).toBeLessThanOrEqual(1);
    }
    expect(actual[0].marginTop).toBe(expected[0].marginTop);
    expect(actual.at(-1)?.marginBottom).toBe(expected.at(-1)?.marginBottom);
    expect(Math.abs((await editor.boundingBox())!.height - (await prose.boundingBox())!.height)).toBeLessThanOrEqual(1);
    for (const root of [editor, prose]) {
      const soft = root.getByText("A soft line continues here.");
      expect((await soft.boundingBox())!.height).toBeCloseTo(await soft.evaluate(element => parseFloat(getComputedStyle(element).lineHeight)), 0);
      const code = root.locator("pre");
      expect(await code.evaluate(element => ({ whiteSpace: getComputedStyle(element).whiteSpace, overflows: element.scrollWidth > element.clientWidth }))).toEqual({ whiteSpace: "pre", overflows: true });
    }
  });
}

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
    const content = node.textContent ?? "";
    const alpha = content.indexOf("Alpha");
    const beta = content.indexOf("beta", alpha + 1);
    const gamma = content.indexOf("gamma", beta + 1);
    if (alpha < 0 || beta < 0 || gamma < 0) throw new Error("Whitespace measurement words are missing");
    const firstStart = alpha + "Alpha".length;
    const secondStart = beta + "beta".length;
    return { one: context.measureText(" ").width, two: measure(firstStart, beta - firstStart), three: measure(secondStart, gamma - secondStart) };
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
  const existingPost = page.getByRole("textbox", { name: "Existing post" });
  const tabForward = browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
  const tabBackward = browserName === "webkit" && process.platform === "darwin" ? "Alt+Shift+Tab" : "Shift+Tab";
  await editor.focus();
  await expect(editor).toBeFocused();
  // Tab leaves the field editor to the second editor, then to the field-states controls.
  await page.keyboard.press(tabForward);
  await expect(existingPost).toBeFocused();
  await page.keyboard.press(tabForward);
  await expect(page.getByRole("button", { name: "Read-only" })).toBeFocused();
  await page.keyboard.press(tabBackward);
  await expect(existingPost).toBeFocused();
  await page.keyboard.press(tabBackward);
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

test("the starting fixture renders every supported construct formatted", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });

  await expect(editor.getByRole("heading", { name: "Field notes" })).toBeVisible();
  await expect(editor.getByRole("list").filter({ hasText: "Bullet one" })).toBeVisible();
  await expect(editor.getByText("Nested", { exact: true })).toBeVisible();
  await expect(editor.getByRole("blockquote")).toContainText("A quote");
  await expect(editor.locator("pre code")).toContainText("const x = 1;");
  await expect(editor.locator("pre code")).toHaveClass(/language-ts/);
  await expect(editor.locator("hr")).toBeVisible();
  await expect(editor.getByRole("link", { name: "link" })).toHaveAttribute("href", "https://anaphor.dev");
  await expect(editor.getByText("strike", { exact: true })).toBeVisible();
  await expect(editor.getByText("code", { exact: true })).toBeVisible();

  const output = page.getByLabel("Current Markdown", { exact: true });
  await expect(output).toContainText("```ts");
  await expect(output).toContainText("> A quote");
  await expect(output).toContainText("[link](https://anaphor.dev)");
});

test("a fenced code block keeps white-space: pre and scrolls instead of wrapping", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });

  // The starting fixture's code block already proves the editable pre rule.
  await expect(editor.locator("pre").first()).toBeVisible();
  expect(await editor.locator("pre").first().evaluate(element => getComputedStyle(element).whiteSpace)).toBe("pre");

  // A long line must overflow horizontally, not wrap.
  await editor.click();
  await editor.press("ControlOrMeta+A");
  await editor.pressSequentially("``` ");
  await editor.pressSequentially(`const x = ${"a".repeat(160)};`);
  const pre = editor.locator("pre");
  await expect(pre).toBeVisible();
  const { whiteSpace, scrolls } = await pre.evaluate(element => ({
    whiteSpace: getComputedStyle(element).whiteSpace,
    scrolls: element.scrollWidth > element.clientWidth,
  }));
  expect(whiteSpace).toBe("pre");
  expect(scrolls).toBe(true);
});

test("the existing post hides front matter and shows opaque blocks in both themes", async ({ page }, testInfo) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });

  await expect(editor.getByRole("heading", { name: "An existing post" })).toBeVisible();
  await expect(editor).not.toContainText('title: "An existing post"');
  await expect(editor).not.toContainText("draft: true");

  const blocks = editor.locator("[data-opaque-block]");
  await expect(blocks).toHaveCount(7);
  await expect(blocks.first()).toHaveText("[^1]: The note text.");

  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    const fontFamily = await blocks.first().evaluate(element => getComputedStyle(element).fontFamily);
    expect(fontFamily).toContain("mono");
    await blocks.first().screenshot({ path: testInfo.outputPath(`opaque-block-${dark ? "dark" : "light"}.png`) });
  }
});

test("an opaque block is selected and deleted as a whole", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });
  const output = page.getByLabel("Existing post Markdown", { exact: true });

  const block = editor.locator("[data-opaque-block]").first();
  await expect(block).toHaveText("[^1]: The note text.");
  await block.click();
  await editor.press("Delete");

  await expect(editor.locator("[data-opaque-block]")).toHaveCount(6);
  // The definition is gone as a whole; the surrounding content is untouched.
  await expect(output).not.toContainText("[^1]: The note text.");
  await expect(output).toContainText("Raw HTML");
  await expect(output).toContainText("A note with a footnote.[^1]");

  // One undo restores the block and its exact source in the output.
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("[data-opaque-block]")).toHaveCount(7);
  await expect(output).toContainText("[^1]: The note text.");
});

test("an opaque block's text cannot be edited in place", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });
  const output = page.getByLabel("Existing post Markdown", { exact: true });
  const block = editor.locator("[data-opaque-block]").first();

  // ProseMirror renders the atom non-editable, which Chromium reflects as an
  // attribute, so no caret can be placed inside its text.
  await expect(block).toHaveAttribute("contenteditable", "false");

  // Clicking the block and typing replaces the whole atom instead of editing
  // its source text: the block disappears as a unit, never a character edit.
  await block.click();
  await editor.press("z");
  await expect(editor.locator("[data-opaque-block]")).toHaveCount(6);
  await expect(output).not.toContainText("[^1]: The note text.");
});

test("the empty field shows the placeholder and keeps one Prose line of content", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await expect.poll(() => editor.locator("p").first().evaluate(element => getComputedStyle(element, "::before").content)).toBe('"Write a note…"');

  const { contentHeight, lineHeight } = await editor.evaluate(element => {
    if (!(element instanceof HTMLElement)) throw new Error("The editor must be an HTML element");
    return {
      contentHeight: element.offsetHeight,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
    };
  });
  // The placeholder adds no margin: the empty editor's content is one Prose line.
  expect(contentHeight).toBeLessThan(lineHeight * 1.5);

  await editor.click();
  await editor.pressSequentially("Draft");
  await expect.poll(() => editor.locator("p").first().evaluate(element => getComputedStyle(element, "::before").content)).not.toBe('"Write a note…"');
});

test("the field inside Field is named by its label and associated with its feedback", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await expect(editor).toHaveAttribute("aria-labelledby", "notes-label");
  await expect(editor).toHaveAttribute("aria-describedby", "notes-feedback");

  await page.getByRole("button", { name: "Error" }).click();
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(frame).toHaveAttribute("data-invalid", "true");
  await expect(frame).not.toHaveAttribute("aria-invalid");
});

test("the field passes accessibility checks in both themes", async ({ page }) => {
  await page.goto("/markdown-editor");
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    const result = await new AxeBuilder({ page }).include('[aria-label="Field states"]').withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
});

test("read-only prevents typing but allows focus", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Read-only" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  await expect(editor).toHaveAttribute("aria-readonly", "true");

  await editor.click();
  await expect(editor).toBeFocused();
  await editor.pressSequentially("ignored");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("");
});

test("read-only autofocus and frame padding focus the editor", async ({ page, isMobile }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Toggle autofocus example" }).click();
  const editor = page.getByRole("textbox", { name: "Read-only autofocus example" });
  await expect(editor).toBeFocused();
  await expect.poll(() => editor.evaluate(element => {
    const selection = window.getSelection();
    if (!selection?.anchorNode) return "";
    const range = document.createRange();
    range.selectNodeContents(element);
    range.setEnd(selection.anchorNode, selection.anchorOffset);
    return range.toString();
  })).toBe("Read-only example");
  await page.getByRole("button", { name: "Read-only", exact: true }).click();
  const notes = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: notes });
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  if (!box) throw new Error("Frame has no bounding box");
  if (isMobile) await page.touchscreen.tap(box.x + 5, box.y + 5);
  else await page.mouse.click(box.x + 5, box.y + 5);
  await expect(notes).toBeFocused();
});

test("read-only text can be selected and copied", async ({ page, context, browserName }) => {
  if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  await page.getByRole("button", { name: "Read-only", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.press("ControlOrMeta+a");
  expect(await page.evaluate(() => window.getSelection()?.toString())).toContain("A loaded note");
  const copied = page.evaluate(() => new Promise<boolean>((resolve) => {
    document.addEventListener("copy", (event) => {
      queueMicrotask(() => resolve(event.defaultPrevented));
    }, { once: true });
  }));
  await editor.press("ControlOrMeta+c");
  expect(await copied).toBe(false);
  // WebKit does not expose the native clipboard to this test.
  if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("A loaded note");
});

test("dragging inside a field selects text without padding focus interference", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  const text = page.getByRole("textbox", { name: "Notes" }).getByText("A loaded note");
  await text.scrollIntoViewIfNeeded();
  const box = await text.boundingBox();
  if (!box) throw new Error("Text has no bounding box");
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  expect((await page.evaluate(() => window.getSelection()?.toString()))?.toLowerCase()).toContain("loaded note");
});

test("an opaque block in a field is selected whole and padding focuses after it", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  const block = editor.getByText("<!-- Field note -->");
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await editor.focus();
  await block.click();
  await editor.press("Delete");
  await expect(output).not.toContainText("<!-- Field note -->");
  await editor.press("ControlOrMeta+z");
  await expect(output).toContainText("<!-- Field note -->");
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  if (!box) throw new Error("Frame has no bounding box");
  await page.mouse.click(box.x + box.width - 5, box.y + box.height - 5);
  await expect(editor).toBeFocused();
  await page.keyboard.type("x");
  await expect(output).toHaveText("## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->\n\nx");
});

test("padding after a final code block starts a paragraph", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("``` ");
  await editor.pressSequentially("code");
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  if (!box) throw new Error("Frame has no bounding box");
  await page.mouse.click(box.x + box.width - 5, box.y + box.height - 5);
  await expect(editor).toBeFocused();
  await page.keyboard.type("x");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("```\ncode\n```\n\nx");
});

test("keyboard reaches the gap after a final opaque block", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.focus();
  await editor.getByText("<!-- Field note -->").click();
  await editor.press("ArrowDown");
  await page.keyboard.type("x");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->\n\nx");
});

test("keyboard reaches the gap after a final code block", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("``` code");
  await editor.press("ArrowRight");
  await page.keyboard.type("x");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("```\ncode\n```\n\nx");
});

test("frame matches Input states and surfaces in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  const input = page.getByRole("textbox", { name: "Input comparison" });
  const styles = (element: Element) => {
    const style = getComputedStyle(element);
    return { border: style.borderTopColor, outline: style.outlineColor, outlineWidth: style.outlineWidth, background: style.backgroundColor };
  };
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    const normal = { frame: await frame.evaluate(styles), input: await input.evaluate(styles), page: await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor) };
    expect(normal.frame.border).toBe(normal.input.border);
    expect(normal.frame.background).toBe(normal.input.background);
    expect(normal.frame.background).toBe(normal.page);
    await editor.focus();
    const focusFrame = await frame.evaluate(styles);
    await input.focus();
    const focusInput = await input.evaluate(styles);
    expect(focusFrame.border).toBe(focusInput.border);
    expect(focusFrame.outline).toBe(focusInput.outline);
    expect(focusFrame.outlineWidth).toBe(focusInput.outlineWidth);
    await page.getByRole("button", { name: "Error", exact: true }).click();
    const invalidFrame = await frame.evaluate(styles);
    const invalidInput = await input.evaluate(styles);
    expect(invalidFrame.border).toBe(invalidInput.border);
    await page.getByRole("button", { name: "Error", exact: true }).click();
    await page.getByRole("button", { name: "Disabled", exact: true }).click();
    const disabledFrame = await frame.evaluate(styles);
    const disabledInput = await input.evaluate(styles);
    expect(disabledFrame.background).toBe(disabledInput.background);
    const token = await frame.evaluate(element => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--anaphor-input-disabled)";
      element.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    expect(disabledFrame.background).toBe(token);
    console.log(JSON.stringify({ theme: dark ? "dark" : "light", normal, focusFrame, focusInput, invalidFrame, invalidInput, disabledFrame, disabledInput, token }));
    await page.getByRole("button", { name: "Disabled", exact: true }).click();
  }
});

test("disabled removes focus and interaction", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Disabled" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await expect(editor).toHaveAttribute("aria-disabled", "true");
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await expect(editor).not.toHaveAttribute("tabindex");

  // A raw pointer click on the box does nothing: the editor stays unfocused.
  const box = await frame.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(editor).not.toBeFocused();
});

test("setMarkdown loads and discards notes without firing a change", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const output = page.getByLabel("Field states Markdown", { exact: true });

  await editor.click();
  await editor.pressSequentially("Unsaved edit");
  await expect(output).toContainText("Unsaved edit");

  await page.getByRole("button", { name: "Load another note" }).click();
  await expect(editor.getByRole("heading", { name: "A loaded note" })).toBeVisible();
  await expect(output).toContainText("setMarkdown");

  // Undo after a replace cannot return to the previous document.
  await editor.press("ControlOrMeta+z");
  await expect(editor.getByRole("heading", { name: "A loaded note" })).toBeVisible();

  await page.getByRole("button", { name: "Discard edits" }).click();
  await expect.poll(() => editor.locator("p").first().evaluate(element => getComputedStyle(element, "::before").content)).toBe('"Write a note…"');
});

test("the field keeps the input boundary and grows from the minimum to the maximum then scrolls", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });

  expect(await frame.evaluate(element => getComputedStyle(element).minHeight)).toBe("96px");
  expect(await frame.evaluate(element => getComputedStyle(element).maxHeight)).toBe("288px");
  expect(await frame.evaluate(element => element.getBoundingClientRect().height)).toBe(96);

  await editor.click();
  for (let i = 1; i <= 15; i += 1) {
    if (i > 1) await editor.press("Enter");
    await editor.pressSequentially(`Line ${i}`);
  }
  const grown = await frame.evaluate(element => ({ height: element.getBoundingClientRect().height, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight }));
  expect(grown.height).toBe(288);
  expect(grown.scrollHeight).toBeGreaterThan(grown.clientHeight);
});

test("clicking padding places the caret at the end", async ({ page, isMobile }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });

  for (const position of ["top-left", "middle-right", "bottom-right"]) {
    await page.getByRole("button", { name: "Discard edits" }).click();
    await editor.click();
    await page.keyboard.type("Draft");
    await page.getByRole("button", { name: "Read-only", exact: true }).focus();
    await frame.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    const box = await frame.boundingBox();
    if (!box) throw new Error("Frame has no bounding box");
    const x = position === "top-left" ? box.x + 5 : box.x + box.width - 5;
    const y = position === "top-left" ? box.y + 5 : position === "middle-right" ? box.y + box.height / 2 : box.y + box.height - 5;
    if (isMobile) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await expect(editor).toBeFocused();
    await page.keyboard.type(position);
    await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText(`Draft${position}`);
  }
});
