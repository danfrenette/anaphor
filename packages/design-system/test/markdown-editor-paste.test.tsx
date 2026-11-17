import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { MarkdownEditor, type MarkdownEditorHandle } from "@anaphor/system";
import { marked } from "marked";

beforeEach(() => {
  vi.stubGlobal("ClipboardEvent", Event);
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }) });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
});

async function setupPasteEditor(value = "", options: { readOnly?: boolean; disabled?: boolean; onChange?: (value: string) => void } = {}) {
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} presentation="field" defaultValue={value} aria-label="Paste editor" {...options} />);
  const dom = await screen.findByRole("textbox", { name: "Paste editor" });
  return { dom, getMarkdown: () => ref.current!.getMarkdown(), setMarkdown: (markdown: string) => ref.current!.setMarkdown(markdown) };
}

function pasteHTML(dom: HTMLElement, html: string) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { getData: (type: string) => type === "text/html" ? html : "", files: [], types: ["text/html"] } });
  act(() => { dom.dispatchEvent(event); });
}

async function selectText(dom: HTMLElement, from: number, to = from) {
  dom.focus();
  const text = dom.querySelector("p, h1, code")!.firstChild!;
  const range = document.createRange();
  range.setStart(text, from);
  range.setEnd(text, to);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  await act(async () => { document.dispatchEvent(new Event("selectionchange")); await new Promise(resolve => setTimeout(resolve, 30)); });
}

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "paste");

test.each([
  "&#106;avascript:alert(1)", "java&#x73;cript:alert(1)",
  "java&#9;script:alert(1)", "java&#10;script:alert(1)",
  "data&#58;text/html,evil", "JaVa&#x53;cript:alert(1)",
])("entity-encoded unsafe links do not survive rendering: %s", async destination => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(`[label](${destination})`);
  const html = await marked.parse(api.getMarkdown());
  expect(api.getMarkdown()).toBe(`\\[label\\](${destination.replace(/&/g, "&amp;")})`);
  const rendered = new DOMParser().parseFromString(html, "text/html");
  expect([...rendered.querySelectorAll<HTMLAnchorElement>("a[href]")].map(link => link.protocol)).not.toContain("javascript:");
  expect([...rendered.querySelectorAll<HTMLAnchorElement>("a[href]")].map(link => link.protocol)).not.toContain("data:");
  expect(api.dom.textContent).toContain("label");
});

test("entity-encoded reference destinations stay literal on paste", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("[label][ref]\n\n[ref]: &#106;avascript:alert(1)");
  expect(api.getMarkdown()).toBe("\\[label\\](&amp;#106;avascript:alert(1))");
  const rendered = new DOMParser().parseFromString(await marked.parse(api.getMarkdown()), "text/html");
  expect(rendered.querySelector("a[href]")).toBeNull();
  expect(api.dom.textContent).toContain("label");
});

// jsdom requires an explicit clipboardData object for HTML paste events.
test.each([
  ["anaphor-manual", "# Typography\n\nReading, navigation, and literal values share a small kit. Document structure chooses the heading level; purpose chooses its appearance.", "TypographyReading, navigation, and literal values share a small kit. Document structure chooses the heading level; purpose chooses its appearance."],
  ["google-docs", "Quarterly **report**\n\nPlain text and *emphasis*.", "Quarterly reportPlain text and emphasis."],
  ["blog", "## Field notes\n\nRead [the report](https://example.com) and **remember**.\n\n> Take care.\n\n- First\n- Second", "Field notesRead the report and remember.Take care.FirstSecond"],
])("pasting %s HTML keeps semantic formatting", async (name, expected, visible) => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, readFileSync(join(fixtureDir, `${name}.html`), "utf8"));
  expect(api.getMarkdown()).toBe(expected);
  expect(api.dom.textContent).toBe(visible);
});

test("unsupported form controls paste as unformatted text", async () => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, "<form><strong>Label</strong><button><em>Submit</em></button></form>");
  expect(api.getMarkdown()).toBe("LabelSubmit");
  expect(api.dom.textContent).toBe("LabelSubmit");
});

test("pasted table cells keep all their text", async () => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, "<table><tr><th>Head</th></tr><tr><td><p>First</p><p>Second</p></td></tr></table>");
  expect(api.getMarkdown()).toBe("\n| Head            |\n| --------------- |\n| First<br>Second |\n");
  expect(api.dom.textContent).toBe("HeadFirstSecond");
});

test("pasted task lists retain checkbox states", async () => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Done</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Next</p></div></li></ul>');
  expect(api.getMarkdown()).toBe("- [x] Done\n- [ ] Next");
  expect(screen.getByText("Done")).toBeVisible();
  expect(screen.getByText("Next")).toBeVisible();
});

test("pasted HTML cannot create opaque nodes", async () => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, '<div data-opaque-block=""><strong>Visible</strong></div>');
  expect(api.getMarkdown()).toBe("**Visible**");
  expect(api.dom.textContent).toBe("Visible");
});

test("Markdown syntax pasted inside code stays literal", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("```\ncode\n```");
  await selectText(api.dom, 4);
  api.dom.focus();
  await user.paste("# literal\n**bold**");
  expect(api.getMarkdown()).toBe("```\ncode# literal\n**bold**\n```");
  expect(api.dom.textContent).toBe("code# literal\n**bold**");
});

test("pasting blocks splits a heading with a leading space in its saved form", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("# hello world");
  await selectText(api.dom, 5);
  api.dom.focus();
  await user.paste("# head\n\n- list");
  const saved = api.getMarkdown();
  expect(saved).toBe("# hello\n\n# head\n\n- list\n\n#  world");
  expect(api.dom.textContent).toBe("helloheadlist world");
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.textContent).toBe("helloheadlistworld");
  expect(api.getMarkdown()).toBe(saved);
});

test("pasted Markdown tables become tables", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("| A | B |\n| --- | --- |\n| C | D |");
  expect(api.getMarkdown()).toBe("\n| A   | B   |\n| --- | --- |\n| C   | D   |\n");
  expect(api.dom.textContent).toBe("ABCD");
  expect(api.dom.querySelector("table")).not.toBeNull();
});

test.each([["snake_case_names", "snake\\_case\\_names"], ["2 * 3 = 6", "2 \\* 3 = 6"], ["    indented", "&#32;&#32;&#32;&#32;indented"], ["#heading", "#heading"], ["2026. A year.", "2026\\. A year."]])("ordinary text stays a paragraph: %s", async (text, expected) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(text);
  expect(api.getMarkdown()).toBe(expected);
  expect(api.dom.textContent).toBe(text);
  expect(api.dom.querySelector("pre,ol,ul,h1,h2,strong,em")).toBeNull();
});

test("four-digit sentences retain inline Markdown without becoming lists", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("2026. **Important**");
  expect(api.getMarkdown()).toBe("2026\\. **Important**");
  expect(api.dom.textContent).toBe("2026. Important");
  expect(api.dom.querySelector("strong")).toHaveTextContent("Important");
  expect(api.dom.querySelector("ol")).toBeNull();
});

test("four-digit ordinary sentences stay paragraphs", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("2026. A year.");
  expect(api.getMarkdown()).toBe("2026\\. A year.");
  expect(api.dom.textContent).toBe("2026. A year.");
  expect(api.dom.querySelector("ol")).toBeNull();
});

test("four-digit sentences retain inline links without becoming lists", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("2026. [a link](https://example.com)");
  expect(api.getMarkdown()).toBe("2026\\. [a link](https://example.com)");
  expect(api.dom.textContent).toBe("2026. a link");
  expect(api.dom.querySelector("a")).toHaveAttribute("href", "https://example.com");
  expect(api.dom.querySelector("ol")).toBeNull();
});

test("pasted Markdown preserves unsupported syntax as literal text", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("# Heading\n\n<Widget>hello</Widget>\n\n[^n]: note");
  expect(api.getMarkdown()).toBe("# Heading\n\n&lt;Widget&gt;hello&lt;/Widget&gt;\n\n\\[^n\\]: note");
  expect(api.dom.textContent).toBe("Heading<Widget>hello</Widget>[^n]: note");
});

test("pasted front matter remains visible literal text", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("---\ntitle: Draft\n---\n\n# Heading");
  expect(api.dom.textContent).toBe("---title: Draft---Heading");
  expect(api.getMarkdown()).toBe("\\---  \ntitle: Draft  \n\\---\n\n# Heading");
});

test("front matter without other Markdown remains literal", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("---\ntitle: Draft\n---");
  expect(api.getMarkdown()).toBe("\\---  \ntitle: Draft  \n\\---");
  expect(api.dom.textContent).toBe("---title: Draft---");
});

test("pasted inline HTML and footnotes stay literal beside Markdown", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("**Bold** <b>text</b> [^note]");
  expect(api.getMarkdown()).toBe("**Bold** &lt;b&gt;text&lt;/b&gt; \\[^note\\]");
  expect(api.dom.textContent).toBe("Bold <b>text</b> [^note]");
});

test("pasting a URL over selected text links the selection", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("selected");
  await selectText(api.dom, 0, 8);
  api.dom.focus();
  await user.paste("https://example.com");
  expect(api.getMarkdown()).toBe("[selected](https://example.com)");
  expect(api.dom.textContent).toBe("selected");
  expect(api.dom.querySelector("a")).toHaveAttribute("href", "https://example.com");
});

test("pasting a rich clipboard URL links selected text", async () => {
  const api = await setupPasteEditor("selected");
  await selectText(api.dom, 0, 8);
  api.dom.focus();
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { getData: (type: string) => type === "text/plain" ? "https://example.com" : type === "text/html" ? '<a href="https://example.com">example</a>' : "", files: [], types: ["text/plain", "text/html"] } });
  act(() => { api.dom.dispatchEvent(event); });
  expect(api.getMarkdown()).toBe("[selected](https://example.com)");
  expect(api.dom.textContent).toBe("selected");
});

test.each(["javascript:alert(1)", "data:text/html,evil"])("unsafe Markdown URL stays text: %s", async url => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(`[label](${url})`);
  expect(api.getMarkdown()).toBe(`\\[label\\](${url})`);
  expect(api.dom.textContent).toBe(`[label](${url})`);
  expect(api.dom.querySelector("a")).toBeNull();
});

test("unsafe Markdown links with mixed formatting retain one literal destination", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("[hello **world**](javascript:alert(1))");
  expect(api.dom.textContent).toBe("[hello world](javascript:alert(1))");
  expect(api.dom.querySelector("a")).toBeNull();
  expect(api.getMarkdown()).toBe("\\[hello world\\](javascript:alert(1))");
});

test.each(["javascript:alert(1)", "data:text/html,evil"])("unsafe URLs are never pasted as HTML links: %s", async url => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, `<p><a href="${url}">Unsafe</a></p>`);
  expect(api.getMarkdown()).toBe("Unsafe");
  expect(api.dom.textContent).toBe("Unsafe");
  expect(api.dom.querySelector("a")).toBeNull();
});

test.each(["https://example.com", "mailto:reader@example.com"])("a pasted URL links itself: %s", async url => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(url);
  expect(api.getMarkdown()).toBe(`[${url}](${url})`);
  expect(api.dom.textContent).toBe(url);
  expect(api.dom.querySelector("a")).toHaveAttribute("href", url);
});

test.each([
  ["Markdown", "# Heading", false, "Original\n\n# Heading", "OriginalHeading"],
  ["link on selection", "https://example.com", true, "[Original](https://example.com)", "Original"],
  ["plain text", "ordinary text", false, "Originalordinary text", "Originalordinary text"],
  ["URL", "https://example.com", false, "Original[https://example.com](https://example.com)", "Originalhttps://example.com"],
])("one undo reverts a whole %s paste", async (_name, text, selected, expected, visible) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("Original");
  await selectText(api.dom, selected ? 0 : 8, 8);
  api.dom.focus();
  await user.paste(text);
  expect(api.getMarkdown()).toBe(expected);
  expect(api.dom.textContent).toBe(visible);
  await user.keyboard("{Control>}z{/Control}");
  expect(api.getMarkdown()).toBe("Original");
});

test("one undo reverts a whole HTML paste", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("Original");
  await selectText(api.dom, 8);
  pasteHTML(api.dom, '<p><strong>New</strong> text</p>');
  expect(api.getMarkdown()).toBe("Original**New** text");
  expect(api.dom.textContent).toBe("OriginalNew text");
  await user.keyboard("{Control>}z{/Control}");
  expect(api.getMarkdown()).toBe("Original");
  expect(api.dom.textContent).toBe("Original");
});

test.each(["readOnly", "disabled"] as const)("paste does not change a %s editor", async option => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const api = await setupPasteEditor("Original", { [option]: true, onChange });
  api.dom.focus();
  await user.paste("# Heading");
  expect(api.getMarkdown()).toBe("Original");
  expect(onChange).not.toHaveBeenCalled();
});

test("pasting web styling and unsupported controls does not import formatting", async () => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, '<h2 style="font-weight:900">Heading</h2><p><span style="font-weight:700;color:red">Plain</span> and <strong>bold</strong></p><button><em>Button</em></button>');
  expect(api.getMarkdown()).toBe("## Heading\n\nPlain and **bold**\n\nButton");
  expect(api.dom.textContent).toBe("HeadingPlain and boldButton");
});

test.each([
  ["heading", "# Heading", "# Heading", "h1", "Heading"],
  ["list", "- One\n- Two", "- One\n- Two", "ul", "OneTwo"],
  ["quote", "> Quote", "> Quote", "blockquote", "Quote"],
  ["fence", "```\ncode\n```", "```\ncode\n```", "pre", "code"],
  ["emphasis", "**bold**", "**bold**", "strong", "bold"],
  ["link", "[label](https://example.com)", "[label](https://example.com)", "a", "label"],
])("plain-text paste formats Markdown %s", async (_name, text, expected, format, visible) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(text);
  expect(api.getMarkdown()).toBe(expected);
  expect(api.dom.textContent).toBe(visible);
  expect(api.dom.querySelector(format)).not.toBeNull();
});

test("ordinal paragraph survives save and reparse", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("2026. **Important**");
  const saved = api.getMarkdown();
  expect(saved).toBe("2026\\. **Important**");
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.textContent).toBe("2026. Important");
  expect(api.dom.querySelector("ol")).toBeNull();
  expect(await marked.parse(saved)).toBe("<p>2026. <strong>Important</strong></p>\n");
});

test.each(["1.", "2.", "-", "+", ">", "3)"])("hard-break continuation survives HTML paste and starting value: %s", async marker => {
  const continuation = marker === ">" ? "&gt;" : marker.replace(/[.)+\-]/, "\\$&");
  const expected = `text  \n${continuation} next`;
  const api = await setupPasteEditor();
  pasteHTML(api.dom, `<p>text<br>${marker} next</p>`);
  expect(api.getMarkdown()).toBe(expected);
  act(() => { api.setMarkdown(expected); });
  expect(api.dom.textContent).toBe(`text${marker} next`);
  expect(api.dom.querySelector("ol, ul, blockquote")).toBeNull();
  expect(await marked.parse(expected)).toBe(`<p>text<br>${marker === ">" ? "&gt;" : marker} next</p>\n`);
  const user = userEvent.setup();
  await selectText(api.dom, 4);
  await user.keyboard("!");
  expect(api.getMarkdown()).toBe(`text!  \n${continuation} next`);
  act(() => { api.setMarkdown(api.getMarkdown()); });
  expect(api.dom.textContent).toBe(`text!${marker} next`);
});

test.each([
  ["2026. A year.", "2026\\. A year.", "2026. A year.", "<p>2026. A year.</p>\n"],
  ["2026. **Important**", "2026\\. **Important**", "2026. Important", "<p>2026. <strong>Important</strong></p>\n"],
  ["text\n\n2026. **Important**", "text\n\n2026\\. **Important**", "text2026. Important", "<p>text</p>\n<p>2026. <strong>Important</strong></p>\n"],
])("pasted ordinal paragraphs survive reparse: %s", async (source, expected, visible, rendered) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(source);
  expect(api.getMarkdown()).toBe(expected);
  act(() => { api.setMarkdown(expected); });
  expect(api.dom.textContent).toBe(visible);
  expect(api.dom.querySelector("ol")).toBeNull();
  expect(await marked.parse(expected)).toBe(rendered);
});

test("a paragraph made ordinal by deleting its prefix survives reparse", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("x3. text");
  await selectText(api.dom, 0, 1);
  await user.keyboard("{Backspace}");
  const saved = api.getMarkdown();
  expect(saved).toBe("3\\. text");
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.textContent).toBe("3. text");
  expect(api.dom.querySelector("ol")).toBeNull();
  expect(await marked.parse(saved)).toBe("<p>3. text</p>\n");
});

test("four-digit text inside pasted fences stays literal", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste("```\n2026. text\n```");
  expect(api.dom.textContent).toBe("2026. text");
  expect(api.getMarkdown()).toBe("```\n2026. text\n```");
});

test.each([
  ["text\n\n> 2026. **Important**", "text\n\n> 2026\\. **Important**", "<p>text</p>\n<blockquote>\n<p>2026. <strong>Important</strong></p>\n</blockquote>\n", "blockquote > p"],
  ["- item\n\n  2026. **Important**", "- item\n\n  2026\\. **Important**", "<ul>\n<li><p>item</p>\n<p>2026. <strong>Important</strong></p>\n</li>\n</ul>\n", "li > p + p"],
])("nested four-digit sentences stay paragraphs: %s", async (source, expected, html, selector) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(source);
  const saved = api.getMarkdown();
  expect(saved).toBe(expected);
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector(selector)?.textContent).toBe("2026. Important");
  expect(api.dom.querySelector(`${selector} strong`)?.textContent).toBe("Important");
  expect(await marked.parse(saved)).toBe(html);
});

test.each([
  ["> 2026) **Important**", "> 2026\\) **Important**", "<blockquote>\n<p>2026) <strong>Important</strong></p>\n</blockquote>\n"],
  ["> 2026. **First**\n> 2027. **Second**", "> 2026\\. **First**\n>\n> 2027\\. **Second**", "<blockquote>\n<p>2026. <strong>First</strong></p>\n<p>2027. <strong>Second</strong></p>\n</blockquote>\n"],
  ["> ```\n> 2026. **Important**\n> ```", "> ```\n> 2026. **Important**\n> ```", "<blockquote>\n<pre><code>2026. **Important**\n</code></pre>\n</blockquote>\n"],
  ["> 1. First\n> 2. Second", "> 1. First\n> 2. Second", "<blockquote>\n<ol>\n<li>First</li>\n<li>Second</li>\n</ol>\n</blockquote>\n"],
])("nested paste preserves marker policy: %s", async (source, expected, html) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(source);
  expect(api.getMarkdown()).toBe(expected);
  act(() => { api.setMarkdown(expected); });
  expect(api.getMarkdown()).toBe(expected);
  expect(await marked.parse(expected)).toBe(html);
});

test("pasted link titles survive saving and rendering", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste('[label](https://example.com "a \\\"quote\\\" \\\\ path )")');
  const saved = api.getMarkdown();
  expect(saved).toBe('[label](https://example.com "a \\\"quote\\\" \\\\ path )")');
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("a")).toHaveAttribute("title", 'a "quote" \\ path )');
  const rendered = new DOMParser().parseFromString(await marked.parse(saved), "text/html");
  expect(rendered.querySelector("a")?.getAttribute("title")).toBe('a "quote" \\ path )');
  expect(rendered.querySelector("a")?.getAttributeNames().sort()).toEqual(["href", "title"]);
});

test("starting link title survives an edit and reparse", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor('[label](https://example.com "a \\\"quote\\\" \\\\ path )")');
  api.dom.focus();
  await user.keyboard("!");
  const saved = api.getMarkdown();
  expect(saved).toBe('\\![label](https://example.com "a \\\"quote\\\" \\\\ path )")');
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("a")).toHaveAttribute("title", 'a "quote" \\ path )');
  const rendered = new DOMParser().parseFromString(await marked.parse(saved), "text/html");
  expect(rendered.querySelector("a")?.getAttribute("title")).toBe('a "quote" \\ path )');
  expect(rendered.querySelector("a")?.getAttributeNames().sort()).toEqual(["href", "title"]);
});

test.each([
  "[x](&amp;#106;avascript:alert(1))",
  "[x](&#106avascript:alert(1))",
  "[x](javascript&colon;alert(1))",
  "[x](%6Aavascript:alert(1))",
  "[x](javascript：alert(1))",
  "[x](javascript꞉alert(1))",
  "![x](javascript:alert(1))",
])("pasted destination cannot render a dangerous protocol: %s", async source => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.dom.focus();
  await user.paste(source);
  const rendered = new DOMParser().parseFromString(await marked.parse(api.getMarkdown()), "text/html");
  for (const link of rendered.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    expect(["javascript:", "data:"]).not.toContain(link.protocol);
  }
  for (const link of api.dom.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    expect(["javascript:", "data:"]).not.toContain(link.protocol);
  }
});

test("a paragraph whose ordinal is bold survives reparse", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("**x3. text**");
  api.dom.focus();
  await user.keyboard("{Delete}");
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.textContent).toBe("3. text");
  expect(api.dom.querySelector("ol")).toBeNull();
  expect(await marked.parse(saved)).toContain("<strong>3. text</strong>");
});

test("setMarkdown keeps an escaped ordinal paragraph unchanged", async () => {
  const api = await setupPasteEditor();
  const source = "2026\\. A year.";
  act(() => { api.setMarkdown(source); });
  expect(api.getMarkdown()).toBe(source);
  expect(api.dom.textContent).toBe("2026. A year.");
  expect(api.dom.querySelector("ol")).toBeNull();
  act(() => { api.setMarkdown(api.getMarkdown()); });
  expect(api.dom.textContent).toBe("2026. A year.");
  expect(api.dom.querySelector("ol")).toBeNull();
});

test.each([
  ["formatted paragraph", "2026\\. **Important**", "2026. Important", "strong"],
  ["blockquote", "> 3\\. quoted", "3. quoted", "blockquote"],
  ["list item", "- 3\\. item", "3. item", "ul"],
  ["ordered list", "1. a\n2. b", "ab", "ol"],
])("setMarkdown preserves %s after an unrelated edit and reparse", async (_name, body, visible, element) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  act(() => { api.setMarkdown(`before\n\n${body}`); });
  expect(api.getMarkdown()).toBe(`before\n\n${body}`);
  await selectText(api.dom, 6);
  await user.keyboard("!");
  const saved = api.getMarkdown();
  expect(saved).toBe(`before!\n\n${body}`);
  expect(api.dom.textContent).toBe(`before!${visible}`);
  act(() => { api.setMarkdown(saved); });
  expect(api.getMarkdown()).toBe(saved);
  expect(api.dom.textContent).toBe(`before!${visible}`);
  expect(api.dom.querySelector(element)).not.toBeNull();
  expect(api.dom.querySelectorAll("ol")).toHaveLength(element === "ol" ? 1 : 0);
});

test.each(["# heading", "###### heading", "```", "~~~", "---", "* * *", "___", "==="]) ("paragraph block opener survives HTML paste and starting value: %s", async line => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, `<p>text<br>${line}</p>`);
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelectorAll("p")).toHaveLength(1);
  expect(api.dom.textContent).toBe(`text${line}`);
  expect(api.dom.querySelector("br")).not.toBeNull();
  const html = await new (await import("marked")).Marked().parse(saved);
  const rendered = new DOMParser().parseFromString(html, "text/html");
  expect(rendered.querySelector("p")?.textContent).toBe(`text${line}`);
  expect(rendered.querySelector("br")).not.toBeNull();
  await selectText(api.dom, 4);
  await userEvent.setup().keyboard("!");
  const edited = api.getMarkdown();
  act(() => { api.setMarkdown(edited); });
  expect(api.dom.textContent).toBe(`text!${line}`);
  expect(api.dom.querySelector("br")).not.toBeNull();
});

test.each(["# not a heading", "a`b``c"]) ("inline code after a hard break survives serialization: %s", async code => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, `<p>text<br><code>${code}</code></p>`);
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("code")?.textContent).toBe(code);
  expect(api.dom.querySelector("br")).not.toBeNull();
  const html = await new (await import("marked")).Marked().parse(saved);
  const rendered = new DOMParser().parseFromString(html, "text/html");
  expect(rendered.querySelector("code")?.textContent).toBe(code);
  expect(rendered.querySelector("br")).not.toBeNull();
});

test.each(["# heading", "```", "~~~", "---", "***", "___", "===", "- item", "+ item", "* item", "> quote"]) ("paragraph opener on its first line survives paste: %s", async line => {
  const api = await setupPasteEditor();
  pasteHTML(api.dom, `<p>${line.replace(">", "&gt;")}</p>`);
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("p")?.textContent).toBe(line);
  const html = await new (await import("marked")).Marked().parse(saved);
  expect(new DOMParser().parseFromString(html, "text/html").querySelector("p")?.textContent).toBe(line);
});

test.each(["    indented", "      indented", "\tindented"]) ("pasted indentation stays a paragraph: %j", async text => {
  const api = await setupPasteEditor();
  api.dom.focus();
  await userEvent.setup().paste(text);
  const visible = api.dom.textContent;
  expect(visible).toBe(text);
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("p")?.textContent).toBe(visible);
  expect(api.dom.querySelector("pre")).toBeNull();
  const html = await new (await import("marked")).Marked().parse(saved);
  const rendered = new DOMParser().parseFromString(html, "text/html");
  expect(rendered.querySelector("p")?.textContent).toBe(visible);
  expect(rendered.querySelector("pre")).toBeNull();
});

test("typed leading spaces stay a paragraph", async () => {
  const api = await setupPasteEditor();
  api.dom.focus();
  await userEvent.setup().keyboard("    indented");
  const visible = api.dom.textContent;
  expect(visible?.replace(/\u00a0/g, " ")).toBe("    indented");
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("p")?.textContent).toBe(visible);
  expect(api.dom.querySelector("pre")).toBeNull();
  const html = await new (await import("marked")).Marked().parse(saved);
  expect(new DOMParser().parseFromString(html, "text/html").querySelector("p")?.textContent).toBe(visible);
});

test.each(["paste", "starting value"]) ("table cell hard break survives %s", async source => {
  const input = "| A |\n| --- |\n| a<br>b |";
  const api = await setupPasteEditor(source === "starting value" ? input : "");
  if (source === "paste") pasteHTML(api.dom, "<table><tr><th>A</th></tr><tr><td>a<br>b</td></tr></table>");
  if (source === "starting value") {
    const cell = api.dom.querySelector("td")!;
    expect(cell.querySelector("br")).not.toBeNull();
    await selectText(api.dom, 1);
    await userEvent.setup().keyboard("!");
  }
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  const cell = api.dom.querySelector("td")!;
  expect(cell.textContent).toBe("ab");
  expect(cell.querySelector("br")).not.toBeNull();
  expect(cell.querySelector("[data-opaque-inline]")).toBeNull();
  const html = await new (await import("marked")).Marked().parse(saved);
  expect(new DOMParser().parseFromString(html, "text/html").querySelector("td br")).not.toBeNull();
});

test("typed table cell hard break survives save", async () => {
  const api = await setupPasteEditor("| A |\n| --- |\n| ab |");
  const text = api.dom.querySelector("td p")!.firstChild!;
  api.dom.focus();
  const range = document.createRange();
  range.setStart(text, 1);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  await act(async () => { document.dispatchEvent(new Event("selectionchange")); await new Promise(resolve => setTimeout(resolve, 30)); });
  await userEvent.setup().keyboard("{Shift>}{Enter}{/Shift}");
  expect(api.dom.querySelector("td br")).not.toBeNull();
  const saved = api.getMarkdown();
  act(() => { api.setMarkdown(saved); });
  expect(api.dom.querySelector("td")?.textContent).toBe("ab");
  expect(api.dom.querySelector("td br")).not.toBeNull();
  const html = await new (await import("marked")).Marked().parse(saved);
  expect(new DOMParser().parseFromString(html, "text/html").querySelector("td br")).not.toBeNull();
});
