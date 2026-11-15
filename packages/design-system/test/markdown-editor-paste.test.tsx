import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, render, waitFor } from "@testing-library/react";
import { EditorContent } from "@tiptap/react";
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

test("pasting web styling and unsupported controls does not import formatting", async () => {
  const api = await setupPasteEditor();
  act(() => { api.editor!.view.pasteHTML('<h2 style="font-weight:900">Heading</h2><p><span style="font-weight:700;color:red">Plain</span> and <strong>bold</strong></p><button><em>Button</em></button>'); });
  expect(api.getMarkdown()).toBe("## Heading\n\nPlain and **bold**\n\nButton");
});
