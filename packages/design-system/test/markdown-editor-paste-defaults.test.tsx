import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { MarkdownEditor, type MarkdownEditorHandle } from "@anaphor/system";

beforeEach(() => {
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: () => Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }),
  });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
});

test.each([
  ["snake case", "snake_case_names", "snake\\_case\\_names"],
  ["arithmetic", "2 * 3 = 6", "2 \\* 3 = 6"],
  ["indented text", "    indented", "&#32;&#32;&#32;&#32;indented"],
  ["URL", "https://example.com", "[https://example.com](https://example.com)"],
  ["hash without space", "#heading", "#heading"],
  ["numbered sentence", "2026. A year.", "2026\\. A year."],
  ["unsafe URL", "javascript:alert(1)", "javascript:alert(1)"],
  ["HTML", "<script>alert(1)</script>", "&lt;script&gt;alert(1)&lt;/script&gt;"],
  ["footnote", "[^note]", "\\[^note\\]"],
  ["plain multiline", "First\nSecond", "First\n\nSecond"],
])("measure default text paste: %s", async (_name, text, expected) => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  const { unmount } = render(<MarkdownEditor presentation="field" ref={ref} defaultValue="" aria-label="Paste measurement" />);
  const editor = await screen.findByRole("textbox", { name: "Paste measurement" });
  editor.focus();
  await user.paste(text);
  expect(ref.current?.getMarkdown()).toBe(expected);
  expect(editor.textContent).toBe(text.replace("\n", ""));
  unmount();
});

test("pasting 50k characters of realistic Markdown preserves complete output", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor presentation="field" ref={ref} defaultValue="" aria-label="Paste performance" />);
  const editor = await screen.findByRole("textbox", { name: "Paste performance" });
  editor.focus();
  const text = "# Heading\n\n- One\n- Two\n\nA paragraph of realistic Markdown content.\n\n".repeat(750);
  await user.paste(text);
  expect(ref.current?.getMarkdown()).toBe(text);
  expect(editor).toHaveTextContent("A paragraph of realistic Markdown content.");
}, 15000);
