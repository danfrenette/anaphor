import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, render, waitFor } from "@testing-library/react";
import { EditorContent } from "@tiptap/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { useMarkdownEditor, type UseMarkdownEditorResult } from "@anaphor/system";

beforeEach(() => {
  vi.stubGlobal("ClipboardEvent", Event);
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }) });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
});

async function setupPasteEditor(value = "") {
  let api: UseMarkdownEditorResult;
  function Harness() {
    api = useMarkdownEditor({ defaultValue: value, "aria-label": "Paste editor" });
    return <EditorContent editor={api.editor} />;
  }
  render(<Harness />);
  await waitFor(() => { if (!api.editor) throw new Error("Editor not ready"); });
  return api!;
}

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "paste");

test.each([
  ["google-docs", "Quarterly **report**\n\nPlain text and *emphasis*."],
  ["blog", "## Field notes\n\nRead [the report](https://example.com) and **remember**.\n\n> Take care.\n\n- First\n- Second"],
])("pasting %s HTML keeps semantic formatting", async (name, expected) => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML(readFileSync(join(fixtureDir, `${name}.html`), "utf8")); });
  expect(api.getMarkdown()).toBe(expected);
});

test("Markdown syntax pasted inside code stays literal", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor("```\ncode\n```");
  act(() => { api.editor!.commands.setTextSelection(5); });
  api.editor!.view.dom.focus();
  await user.paste("# literal\n**bold**");
  expect(api.getMarkdown()).toBe("```\ncode# literal\n**bold**\n```");
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

test("pasted Markdown preserves unsupported syntax as literal text", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("# Heading\n\n<Widget>hello</Widget>\n\n[^n]: note");
  expect(api.getMarkdown()).toBe("# Heading\n\n&lt;Widget&gt;hello&lt;/Widget&gt;\n\n\\[^n\\]: note");
  expect(api.editor!.view.dom.textContent).toBe("Heading<Widget>hello</Widget>[^n]: note");
  expect(api.editor!.view.dom.querySelector("[data-opaque-block], [data-opaque-inline]")).toBeNull();
});

test("pasted front matter remains visible literal text", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("---\ntitle: Draft\n---\n\n# Heading");
  expect(api.editor!.view.dom.textContent).toBe("---title: Draft---Heading");
  expect(api.editor!.view.dom.querySelector("[data-opaque-block], [data-opaque-inline]")).toBeNull();
  expect(api.getMarkdown()).toBe("\\---  \ntitle: Draft  \n\\---\n\n# Heading");
});

test("pasted inline HTML and footnotes stay literal beside Markdown", async () => {
  const user = userEvent.setup();
  const api = await setupPasteEditor();
  api.editor!.view.dom.focus();
  await user.paste("**Bold** <b>text</b> [^note]");
  expect(api.getMarkdown()).toBe("**Bold** &lt;b&gt;text&lt;/b&gt; \\[^note\\]");
  expect(api.editor!.view.dom.querySelector("[data-opaque-block], [data-opaque-inline]")).toBeNull();
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
