import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, render, waitFor } from "@testing-library/react";
import { EditorContent } from "@tiptap/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { useMarkdownEditor, type UseMarkdownEditorResult } from "@anaphor/system";
import { marked } from "marked";

beforeEach(() => {
  vi.stubGlobal("ClipboardEvent", Event);
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }) });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
});

async function setupPasteEditor(value = "", options: { readOnly?: boolean; disabled?: boolean; onChange?: (value: string) => void } = {}) {
  let api: UseMarkdownEditorResult;
  function Harness() {
    api = useMarkdownEditor({ defaultValue: value, "aria-label": "Paste editor", ...options });
    return <EditorContent editor={api.editor} />;
  }
  render(<Harness />);
  await waitFor(() => { if (!api.editor) throw new Error("Editor not ready"); });
  return api!;
}

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "paste");

test.each([
  "&#106;avascript:alert(1)", "java&#x73;cript:alert(1)",
  "java&#9;script:alert(1)", "java&#10;script:alert(1)",
  "data&#58;text/html,evil", "JaVa&#x53;cript:alert(1)",
])("entity-encoded unsafe links do not survive rendering: %s", async destination => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste(`[label](${destination})`);
  const html = await marked.parse(api.getMarkdown());
  const rendered = new DOMParser().parseFromString(html, "text/html");
  expect([...rendered.querySelectorAll<HTMLAnchorElement>("a[href]")].map(link => link.protocol)).not.toContain("javascript:");
  expect([...rendered.querySelectorAll<HTMLAnchorElement>("a[href]")].map(link => link.protocol)).not.toContain("data:");
  expect(api.editor!.view.dom.textContent).toContain("label");
});

test("entity-encoded reference destinations stay literal on paste", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("[label][ref]\n\n[ref]: &#106;avascript:alert(1)");
  const rendered = new DOMParser().parseFromString(await marked.parse(api.getMarkdown()), "text/html");
  expect(rendered.querySelector("a[href]")).toBeNull();
  expect(api.editor!.view.dom.textContent).toContain("label");
});

// jsdom cannot populate an HTML clipboard through userEvent.paste; use ProseMirror's HTML paste entry point.
test.each([
  ["anaphor-manual", "# Typography\n\nReading, navigation, and literal values share a small kit. Document structure chooses the heading level; purpose chooses its appearance."],
  ["google-docs", "Quarterly **report**\n\nPlain text and *emphasis*."],
  ["blog", "## Field notes\n\nRead [the report](https://example.com) and **remember**.\n\n> Take care.\n\n- First\n- Second"],
])("pasting %s HTML keeps semantic formatting", async (name, expected) => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML(readFileSync(join(fixtureDir, `${name}.html`), "utf8")); });
  expect(api.getMarkdown()).toBe(expected);
});

test("unsupported form controls paste as unformatted text", async () => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML("<form><strong>Label</strong><button><em>Submit</em></button></form>"); });
  expect(api.getMarkdown()).toBe("LabelSubmit");
});

test("pasted table cells keep all their text", async () => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML("<table><tr><th>Head</th></tr><tr><td><p>First</p><p>Second</p></td></tr></table>"); });
  expect(api.getMarkdown()).toBe("\n| Head            |\n| --------------- |\n| First<br>Second |\n");
});

test("pasted task lists retain checkbox states", async () => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML('<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Done</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Next</p></div></li></ul>'); });
  expect(api.getMarkdown()).toBe("- [x] Done\n- [ ] Next");
});

test("pasted HTML cannot create opaque nodes", async () => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML('<div data-opaque-block=""><strong>Visible</strong></div>'); });
  expect(api.getMarkdown()).toBe("**Visible**");
  expect(api.editor!.view.dom.textContent).toBe("Visible");
});

test("Markdown syntax pasted inside code stays literal", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("```\ncode\n```");
  act(() => { api.editor!.commands.setTextSelection(5); });
  api.editor!.view.dom.focus();
  await user.paste("# literal\n**bold**");
  expect(api.getMarkdown()).toBe("```\ncode# literal\n**bold**\n```");
});

test("pasting blocks splits a heading with a leading space in its saved form", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("# hello world");
  act(() => { api.editor!.commands.setTextSelection(6); });
  api.editor!.view.dom.focus();
  await user.paste("# head\n\n- list");
  expect(api.getMarkdown()).toBe("# hello\n\n# head\n\n- list\n\n#  world");
  expect(api.editor!.view.dom.textContent).toBe("helloheadlist world");
});

test("pasted Markdown tables become tables", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("| A | B |\n| --- | --- |\n| C | D |");
  expect(api.getMarkdown()).toBe("\n| A   | B   |\n| --- | --- |\n| C   | D   |\n");
  expect(api.editor!.view.dom.querySelector("table")).not.toBeNull();
});

test.each(["snake_case_names", "2 * 3 = 6", "    indented", "#heading", "2026. A year."])("ordinary text stays a paragraph: %s", async text => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste(text);
  expect(api.editor!.view.dom.textContent).toBe(text);
  expect(api.editor!.view.dom.querySelector("pre,ol,ul,h1,h2,strong,em")).toBeNull();
});

test("four-digit sentences retain inline Markdown without becoming lists", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("2026. **Important**");
  expect(api.getMarkdown()).toBe("2026. **Important**");
  expect(api.editor!.view.dom.textContent).toBe("2026. Important");
  expect(api.editor!.view.dom.querySelector("strong")).toHaveTextContent("Important");
  expect(api.editor!.view.dom.querySelector("ol")).toBeNull();
});

test("four-digit ordinary sentences stay paragraphs", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("2026. A year.");
  expect(api.getMarkdown()).toBe("2026. A year.");
  expect(api.editor!.view.dom.textContent).toBe("2026. A year.");
  expect(api.editor!.view.dom.querySelector("ol")).toBeNull();
});

test("pasted Markdown preserves unsupported syntax as literal text", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("# Heading\n\n<Widget>hello</Widget>\n\n[^n]: note");
  expect(api.getMarkdown()).toBe("# Heading\n\n&lt;Widget&gt;hello&lt;/Widget&gt;\n\n\\[^n\\]: note");
  expect(api.editor!.view.dom.textContent).toBe("Heading<Widget>hello</Widget>[^n]: note");
});

test("pasted front matter remains visible literal text", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("---\ntitle: Draft\n---\n\n# Heading");
  expect(api.editor!.view.dom.textContent).toBe("---title: Draft---Heading");
  expect(api.getMarkdown()).toBe("\\---  \ntitle: Draft  \n\\---\n\n# Heading");
});

test("pasted inline HTML and footnotes stay literal beside Markdown", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("**Bold** <b>text</b> [^note]");
  expect(api.getMarkdown()).toBe("**Bold** &lt;b&gt;text&lt;/b&gt; \\[^note\\]");
  expect(api.editor!.view.dom.textContent).toBe("Bold <b>text</b> [^note]");
});

test("pasting a URL over selected text links the selection", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("selected");
  act(() => { api.editor!.commands.selectAll(); });
  api.editor!.view.dom.focus();
  await user.paste("https://example.com");
  expect(api.getMarkdown()).toBe("[selected](https://example.com)");
  expect(api.editor!.view.dom.querySelector("a")).toHaveAttribute("href", "https://example.com");
});

test("pasting a rich clipboard URL links selected text", async () => {
  const api = await setupPasteEditor("selected");
  act(() => { api.editor!.commands.selectAll(); });
  api.editor!.view.dom.focus();
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { getData: (type: string) => type === "text/plain" ? "https://example.com" : type === "text/html" ? '<a href="https://example.com">example</a>' : "", files: [], types: ["text/plain", "text/html"] } });
  act(() => { api.editor!.view.dom.dispatchEvent(event); });
  expect(api.getMarkdown()).toBe("[selected](https://example.com)");
  expect(api.editor!.view.dom.textContent).toBe("selected");
});

test.each(["javascript:alert(1)", "data:text/html,evil"])("unsafe Markdown URL stays text: %s", async url => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste(`[label](${url})`);
  expect(api.getMarkdown()).toBe(`\\[label\\](${url})`);
  expect(api.editor!.view.dom.querySelector("a")).toBeNull();
});

test("unsafe Markdown links with mixed formatting retain one literal destination", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("[hello **world**](javascript:alert(1))");
  expect(api.editor!.view.dom.textContent).toBe("[hello world](javascript:alert(1))");
  expect(api.editor!.view.dom.querySelector("a")).toBeNull();
  expect(api.getMarkdown()).toBe("\\[hello world\\](javascript:alert(1))");
});

test.each(["javascript:alert(1)", "data:text/html,evil"])("unsafe URLs are never pasted as HTML links: %s", async url => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML(`<p><a href="${url}">Unsafe</a></p>`); });
  expect(api.getMarkdown()).toBe("Unsafe");
  expect(api.editor!.view.dom.querySelector("a")).toBeNull();
});

test.each(["https://example.com", "mailto:reader@example.com"])("a pasted URL links itself: %s", async url => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste(url);
  expect(api.getMarkdown()).toBe(`[${url}](${url})`);
  expect(api.editor!.view.dom.querySelector("a")).toHaveAttribute("href", url);
});

test.each([
  ["Markdown", "# Heading", false],
  ["link on selection", "https://example.com", true],
  ["plain text", "ordinary text", false],
  ["URL", "https://example.com", false],
])("one undo reverts a whole %s paste", async (_name, text, selected) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("Original");
  act(() => { if (selected) api.editor!.commands.selectAll(); else api.editor!.commands.setTextSelection(9); });
  api.editor!.view.dom.focus();
  await user.paste(text);
  expect(api.getMarkdown()).not.toBe("Original");
  act(() => { api.editor!.commands.undo(); });
  expect(api.getMarkdown()).toBe("Original");
});

test("one undo reverts a whole HTML paste", async () => {
  const api = await setupPasteEditor("Original");
  act(() => { api.editor!.commands.setTextSelection(9); api.editor!.view.pasteHTML('<p><strong>New</strong> text</p>'); });
  expect(api.getMarkdown()).not.toBe("Original");
  act(() => { api.editor!.commands.undo(); });
  expect(api.getMarkdown()).toBe("Original");
});

test.each(["readOnly", "disabled"] as const)("paste does not change a %s editor", async option => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const api = await setupPasteEditor("Original", { [option]: true, onChange });
  api.editor!.view.dom.focus();
  await user.paste("# Heading");
  expect(api.getMarkdown()).toBe("Original");
  expect(onChange).not.toHaveBeenCalled();
});

test("pasting web styling and unsupported controls does not import formatting", async () => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML('<h2 style="font-weight:900">Heading</h2><p><span style="font-weight:700;color:red">Plain</span> and <strong>bold</strong></p><button><em>Button</em></button>'); });
  expect(api.getMarkdown()).toBe("## Heading\n\nPlain and **bold**\n\nButton");
});

test.each([
  ["heading", "# Heading", "# Heading", "h1"],
  ["list", "- One\n- Two", "- One\n- Two", "ul"],
  ["quote", "> Quote", "> Quote", "blockquote"],
  ["fence", "```\ncode\n```", "```\ncode\n```", "pre"],
  ["emphasis", "**bold**", "**bold**", "strong"],
  ["link", "[label](https://example.com)", "[label](https://example.com)", "a"],
])("plain-text paste formats Markdown %s", async (_name, text, expected, format) => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste(text);
  expect(api.getMarkdown()).toBe(expected);
  expect(api.editor!.view.dom.querySelector(format)).not.toBeNull();
});
