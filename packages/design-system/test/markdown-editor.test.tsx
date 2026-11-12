import { createRef, useLayoutEffect } from "react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Field, FieldDescription, FieldLabel, MarkdownEditor, type MarkdownEditorHandle } from "@anaphor/system";

// Anchored to the test file so the path survives running Vitest from elsewhere.
// (jsdom replaces the global URL, so new URL(relative, import.meta.url) resolves
// against the window origin rather than the file.)
const mixedFixture = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "markdown-editor", "mixed.md"), "utf8");

// jsdom has no pointer hit testing or range layout; real editing geometry is covered in Playwright.
beforeEach(() => {
  Object.defineProperty(document, "elementFromPoint", { configurable: true, value: () => document.querySelector('[contenteditable="true"]') });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }) });
});

// Renders the editor with a starting value and the shared accessible name. Tests
// that need an onChange spy, a different label, or surrounding focus targets build
// the editor themselves.
function setupEditor(defaultValue = "") {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue={defaultValue} aria-label="Research note" />);
  return { user, ref };
}

// Serialises a document without changing its content: typing then undoing still
// fires the update listener, so getMarkdown() returns the serializer's normal
// form of the supplied input. Undo is used instead of Backspace because Backspace
// at a list item boundary runs the list keymap rather than deleting the typed char.
async function serializeWithoutEdit(markdown: string) {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  const { unmount } = render(<MarkdownEditor ref={ref} defaultValue={markdown} aria-label="Stability check" />);
  const editor = await screen.findByRole("textbox", { name: "Stability check" });
  await user.click(editor);
  await user.keyboard("x");
  await user.keyboard("{Control>}z{/Control}");
  const value = ref.current?.getMarkdown() ?? "";
  unmount();
  return value;
}

test("keeps the supplied Markdown byte for byte without announcing a mount edit", async () => {
  const onChange = vi.fn();
  const ref = createRef<MarkdownEditorHandle>();
  const startingMarkdown = "# Draft\n\nA  paragraph with  unusual spacing.\n";
  render(<MarkdownEditor ref={ref} defaultValue={startingMarkdown} onChange={onChange} aria-label="Research note" />);

  expect(await screen.findByRole("textbox", { name: "Research note" })).toBeInTheDocument();
  expect(ref.current?.getMarkdown()).toBe(startingMarkdown);
  expect(onChange).not.toHaveBeenCalled();
});

test("reports Markdown after a real edit", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="Draft" onChange={onChange} aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("!");

  expect(onChange).toHaveBeenLastCalledWith("!Draft");
  expect(ref.current?.getMarkdown()).toBe("!Draft");
});

test("a starting Markdown link renders and writes back as a link", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="[Anaphor](https://anaphor.dev)" aria-label="Research note" />);

  const link = await screen.findByRole("link", { name: "Anaphor" });
  expect(link).toBeVisible();
  expect(link).toHaveAttribute("href", "https://anaphor.dev");

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("!");

  const markdown = ref.current?.getMarkdown() ?? "";
  expect(markdown).toContain("[Anaphor](https://anaphor.dev)");
});

test("announces a labelled multiline textbox and allows Tab focus in and out", async () => {
  const user = userEvent.setup();
  render(<><button>Before</button><span id="note-label">Research note</span><MarkdownEditor defaultValue="Note" aria-labelledby="note-label" /><button>After</button></>);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  expect(editor).toHaveAttribute("aria-multiline", "true");
  screen.getByRole("button", { name: "Before" }).focus();
  await user.tab();
  expect(editor).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});

test("a document ending in a non-paragraph block gains no trailing paragraph", async () => {
  const { user, ref } = setupEditor("# Heading");

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("!");

  expect(ref.current?.getMarkdown()).toBe("# !Heading");
});

describe("typed triggers", () => {
  test.each([1, 2, 3, 4, 5, 6] as const)("typing a level %i heading trigger produces Markdown", async level => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard(`${"#".repeat(level)} Title`);

    expect(screen.getByRole("heading", { level, name: "Title" })).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe(`${"#".repeat(level)} Title`);
  });

  test("typing separate paragraphs produces Markdown blocks", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("First{Enter}Second");

    expect(ref.current?.getMarkdown()).toBe("First\n\nSecond");
  });

  test("typing bold markers produces bold Markdown", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("**bold**");

    expect(screen.getByText("bold")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("**bold**");
  });

  test.each([{ input: "*italic*" }, { input: "_italic_" }])("typing $input produces italic Markdown", async ({ input }) => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard(input);

    expect(screen.getByText("italic")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("*italic*");
  });

  test.each([{ trigger: "- ", expected: "- Item" }, { trigger: "* ", expected: "- Item" }])("typing $trigger starts a bullet list", async ({ trigger, expected }) => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard(`${trigger}Item`);

    expect(screen.getByRole("list")).toBeVisible();
    // The serializer normalises any bullet marker to `-`.
    expect(ref.current?.getMarkdown()).toBe(expected);
  });

  test("typing 1. starts a numbered list", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("1. First");

    expect(screen.getByRole("list")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("1. First");
  });

  test("typing > starts a blockquote", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("> Quoted");

    expect(screen.getByRole("blockquote")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("> Quoted");
  });

  test("typing three backticks and a space starts a fenced code block", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("``` ");
    await user.keyboard("const x = 1;");

    expect(ref.current?.getMarkdown()).toBe("```\nconst x = 1;\n```");
  });

  test("typing --- inserts a horizontal rule and keeps typing after it", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("---Next");

    expect(screen.getByRole("separator")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("---\n\nNext");
  });

  test("typing ~~x~~ strikes through", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("~~gone~~");

    expect(screen.getByText("gone")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("~~gone~~");
  });

  test("typing `x` marks inline code", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("`code`");

    expect(screen.getByText("code")).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe("`code`");
  });
});

describe("shortcuts", () => {
  test.each([{ text: "bold", key: "b", expected: "**bold**" }, { text: "italic", key: "i", expected: "*italic*" }])("Mod-$key formats selected $text", async ({ text, key, expected }) => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard(text);
    await user.keyboard(`{Control>}a{/Control}{Control>}${key}{/Control}`);

    expect(ref.current?.getMarkdown()).toBe(expected);
  });

  test.each([1, 2, 3, 4, 5, 6] as const)("Mod-Alt-%i formats a level %i heading", async level => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("Title");
    await user.keyboard(`{Control>}{Alt>}${level}{/Alt}{/Control}`);

    expect(screen.getByRole("heading", { level, name: "Title" })).toBeVisible();
    expect(ref.current?.getMarkdown()).toBe(`${"#".repeat(level)} Title`);
  });

  test.each([
    { text: "struck", shortcut: "Shift-S", key: "s", shift: true, expected: "~~struck~~" },
    { text: "coded", shortcut: "e", key: "e", shift: false, expected: "`coded`" },
  ])("Mod-$shortcut formats selected $text", async ({ text, key, shift, expected }) => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard(text);
    await user.keyboard(`{Control>}a{/Control}{Control>}${shift ? "{Shift>}" : ""}${key}${shift ? "{/Shift}" : ""}{/Control}`);

    expect(ref.current?.getMarkdown()).toBe(expected);
  });

  test("underlining is not available", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("text");
    await user.keyboard("{Control>}a{/Control}{Control>}u{/Control}");

    expect(ref.current?.getMarkdown()).toBe("text");
  });
});

describe("block editing", () => {
  test("Enter on an empty list item leaves the list", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("- One{Enter}Two{Enter}{Enter}After");

    expect(ref.current?.getMarkdown()).toBe("- One\n- Two\n\nAfter");
    expect(screen.getByRole("list")).not.toHaveTextContent("After");
  });

  test("retyping an ordered list marker on the line Enter created keeps it literal", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("1. a{Enter}1. b");

    expect(ref.current?.getMarkdown()).toBe("1. a\n2. 1. b");
  });

  test("retyping a bullet marker on the line Enter created keeps it literal", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("- a{Enter}- b");

    expect(ref.current?.getMarkdown()).toBe("- a\n- - b");
  });

  test("Backspace at the start of a list item lifts it to a paragraph", async () => {
    const { user, ref } = setupEditor("- One");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("{Backspace}");

    expect(ref.current?.getMarkdown()).toBe("One");
  });

  test("Enter on an empty quotation line leaves the blockquote", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("> Quoted{Enter}{Enter}After");

    expect(ref.current?.getMarkdown()).toBe("> Quoted\n\nAfter");
  });

  test("triple Enter leaves a code block", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("``` code{Enter}{Enter}{Enter}After");

    expect(ref.current?.getMarkdown()).toBe("```\ncode\n```\n\nAfter");
  });

  test("ArrowDown at the end of a code block leaves it", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("``` code");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("After");

    expect(ref.current?.getMarkdown()).toBe("```\ncode\n```\n\nAfter");
  });

  test("Tab nests a list item and Shift+Tab un-nests it", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("- One{Enter}Two");
    await user.keyboard("{Tab}");
    expect(ref.current?.getMarkdown()).toBe("- One\n  - Two");

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(ref.current?.getMarkdown()).toBe("- One\n- Two");
  });

  test("Backspace at the start of a quotation lifts it to a paragraph", async () => {
    const { user, ref } = setupEditor("> Quoted");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("{Backspace}");

    expect(ref.current?.getMarkdown()).toBe("Quoted");
  });
});

describe("history", () => {
  test("one undo reverts a bullet list conversion to the literal characters", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("- ");
    await user.keyboard("{Control>}z{/Control}");

    expect(ref.current?.getMarkdown()).toBe("- ");
  });

  test("one undo reverts a heading conversion to the literal characters", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("# ");
    await user.keyboard("{Control>}z{/Control}");

    expect(ref.current?.getMarkdown()).toBe("# ");
  });

  test("one undo reverts a horizontal rule conversion to the literal characters", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("---");
    await user.keyboard("{Control>}z{/Control}");

    expect(ref.current?.getMarkdown()).toBe("---");
  });

  test("undo and redo span typing and formatting", async () => {
    const { user, ref } = setupEditor();

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("bold");
    await user.keyboard("{Control>}a{/Control}{Control>}b{/Control}");
    expect(ref.current?.getMarkdown()).toBe("**bold**");

    await user.keyboard("{Control>}z{/Control}");
    expect(ref.current?.getMarkdown()).toBe("bold");

    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(ref.current?.getMarkdown()).toBe("**bold**");
  });
});

describe("serializer round-trip", () => {
  test("a code block holding a backtick run serialises with a fence longer than the run", async () => {
    const input = "````\n```\ninner\n```\n````";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a link destination needing angle brackets keeps them on round-trip", async () => {
    const input = "[a](<https://x.com/with space>)";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code block opening a list item serialises on the marker line", async () => {
    const input = "- ```js\n  a\n  ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code block opening a list item keeps text after it", async () => {
    const input = "- ```js\n  a\n  ```\n  after";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code block opening an ordered list item serialises on the marker line", async () => {
    const input = "1. ```js\n   a\n   ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("an ordered list item keeps a start marker when it opens with a code block", async () => {
    const input = "3. ```js\n   a\n   ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a lettered ordered list item keeps its marker when it opens with a code block", async () => {
    const input = "a. ```js\n   a\n   ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("known Tiptap 3.33.0 issue: an ordered item's text-then-code block drifts a leading space onto the code line", async () => {
    // The code content line gains a leading space on each save (a stock 3.33.0
    // tokenizer bug). Pinned so a Tiptap upgrade changing this output is reviewed.
    const { user, ref } = setupEditor("1. text\n   ```js\n   a\n   ```");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown()).toBe("1. !text\n   ```js\n    a\n   ```");
  });

  test("a code-first ordered item keeps a nested list that follows it", async () => {
    const input = "1. ```js\n   a\n   ```\n   1. nested";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code-first ordered item keeps trailing text after its code block", async () => {
    const input = "1. ```js\n   a\n   ```\n   after";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe("1. ```js\n   a\n   ```\n\n   after");
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code-first ordered item keeps a loose paragraph after its code block", async () => {
    const input = "1. ```js\n   a\n   ```\n\n   para";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code-first ordered item keeps a blockquote after its code block", async () => {
    const input = "1. ```js\n   a\n   ```\n   > q";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code-first ordered item keeps a nested bullet list after its code block", async () => {
    const input = "1. ```js\n   a\n   ```\n   - nested";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a code-first ordered item keeps a second code block after its code block", async () => {
    const input = "1. ```js\n   a\n   ```\n   ```\n   b\n   ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe(input);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("an inline-code then fence does not trigger the code-first repair", async () => {
    const input = "1. ```a```b\n   ```js\n   x\n   ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe("1. `a`b\n   ```js\n    x\n   ```");
  });

  test("a fence with a backtick in its info string does not trigger the code-first repair", async () => {
    const input = "1. ```a`b\n   c\n   ```";
    const output = await serializeWithoutEdit(input);
    expect(output).toBe("1. \\`\\`\\`a\\`b\n c\n   ```\n   \n   ```");
  });

  test("known Tiptap 3.33.0 issue: an ordered list nested in an ordered list loses its code-first inner item", async () => {
    // The inner item opens with a code fence; the repair is top-level only, so
    // the code is lost exactly as stock 3.33.0 loses it. Pinned so a Tiptap
    // upgrade changing this output is reviewed.
    const { user, ref } = setupEditor("1. outer\n   1. ```js\n      a\n      ```");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown()).toBe("1. !outer\n   1. \\`\\`\\`js\n    a\n      ```\n      \n      ```");
  });
});

describe("fixture", () => {
  test("a fixture with every construct loads formatted and edits to valid Markdown", async () => {
    const fixture = [
      "# Title",
      "",
      "A **bold** and *italic* line with ~~strike~~, `code`, and a [link](https://anaphor.dev).",
      "A hard  ",
      "break here.",
      "",
      "- Bullet one",
      "- Bullet two",
      "  - Nested",
      "",
      "1. First",
      "2. Second",
      "",
      "> A quote",
      "",
      "```ts",
      "const x = 1;",
      "```",
      "",
      "---",
    ].join("\n");
    const { user, ref } = setupEditor(fixture);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeVisible();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute("href", "https://anaphor.dev");
    expect(screen.getByRole("blockquote")).toHaveTextContent("A quote");
    expect(screen.getByRole("separator")).toBeVisible();
    expect(screen.getByText("const x = 1;")).toBeVisible();
    expect(screen.getAllByRole("list").length).toBeGreaterThanOrEqual(3);

    await user.click(editor);
    await user.keyboard("!");

    const markdown = ref.current?.getMarkdown() ?? "";
    // The hard break survives as two trailing spaces and a newline.
    expect(markdown).toContain("A hard  \nbreak here.");
    // Stability: parsing the output again and serialising it gives the same string.
    expect(await serializeWithoutEdit(markdown)).toBe(markdown);
  });
});

describe("front matter", () => {
  test("a leading horizontal rule followed by a blank line and a paragraph is not front matter", async () => {
    setupEditor("---\n\nParagraph\n---");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    // Nothing is hidden: the leading rule renders and the paragraph text shows.
    // The trailing `---` underlines the paragraph as a setext heading, which is
    // still visible content rather than swallowed front matter.
    expect(screen.getByRole("separator")).toBeVisible();
    expect(screen.getByText("Paragraph")).toBeVisible();
    expect(editor).toHaveTextContent("Paragraph");
  });

  test("empty front matter is hidden and returned byte for byte", async () => {
    const { user, ref } = setupEditor("---\n---\n# Body");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).not.toHaveTextContent("---");
    expect(screen.getByRole("heading", { level: 1, name: "Body" })).toBeVisible();

    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown()).toBe("---\n---\n# !Body");
  });

  test("front matter with CRLF line endings is returned byte for byte", async () => {
    const { user, ref } = setupEditor("---\r\ntitle: x\r\n---\r\n# Body");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).not.toHaveTextContent("title: x");

    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown()).toBe("---\r\ntitle: x\r\n---\r\n# !Body");
  });

  test("a titled front matter block still hides its fields and keeps the body", async () => {
    const { user, ref } = setupEditor("---\ntitle: x\n---\n# Body");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).not.toHaveTextContent("title: x");

    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown()).toBe("---\ntitle: x\n---\n# !Body");
  });

  test("front matter with a YAML block scalar is hidden and returned byte for byte", async () => {
    const { user, ref } = setupEditor("---\ndescription: |\n  a\n\n  b\n---\n# Body");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).not.toHaveTextContent("description");
    expect(screen.getByRole("heading", { level: 1, name: "Body" })).toBeVisible();

    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown()).toBe("---\ndescription: |\n  a\n\n  b\n---\n# !Body");
  });

  test("a blank line, paragraph, blank line and rule is still not front matter", async () => {
    setupEditor("---\n\nParagraph\n\n---");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    // Nothing is hidden: the paragraph shows and both `---` lines render as
    // horizontal rules now that a blank line separates them from the paragraph.
    expect(screen.getByText("Paragraph")).toBeVisible();
    expect(editor).toHaveTextContent("Paragraph");
    expect(screen.getAllByRole("separator").length).toBeGreaterThanOrEqual(1);
  });

  test("a rule followed by prose with no key is not front matter", async () => {
    // `---` then prose with no mapping key is not front matter; the trailing
    // `---` underlines the prose as a setext heading.
    setupEditor("---\nJust prose\n---");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(screen.getByRole("separator")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Just prose" })).toBeVisible();
    expect(editor).toHaveTextContent("Just prose");
  });

  test("typing into a front-matter-only document keeps a newline before the body", async () => {
    const { user, ref } = setupEditor("---\ntitle: x\n---");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    // The pre-edit read stays byte for byte.
    expect(ref.current?.getMarkdown()).toBe("---\ntitle: x\n---");

    await user.click(editor);
    await user.keyboard("hello");

    const output = "---\ntitle: x\n---\nhello";
    expect(ref.current?.getMarkdown()).toBe(output);
    // Re-splitting the output treats the whole block as front matter again, so
    // the document is stable on reload.
    expect(await serializeWithoutEdit(output)).toBe(output);
  });
});

describe("preserved unsupported content", () => {
  const preservedBlocks: Array<{ name: string; source: string }> = [
    { name: "raw HTML block", source: '<div class="aside">\n  Raw HTML stays verbatim.\n</div>' },
    { name: "HTML comment", source: "<!-- A comment about the post. -->" },
    { name: "footnote definition", source: "[^1]: The note text.\n    With an indented continuation." },
    { name: "MDX import", source: 'import Button from "./button";' },
    { name: "MDX export", source: "export const width = 640;" },
    { name: "self-closing component", source: '<Avatar user="alice" />' },
    { name: "multi-line component", source: '<Card\n  title="Hello"\n>\n  Nested <Inner /> content.\n</Card>' },
  ];
  const preservedInline: Array<{ name: string; source: string }> = [
    { name: "footnote reference", source: "A note[^1] here." },
    { name: "inline HTML", source: 'Text with <b>bold</b> and <span class="tag">a span</span>.' },
  ];

  test("front matter is kept out of sight and returned byte for byte after an edit", async () => {
    const frontMatter = '---\ntitle: "Hello: world"\ntags: [a, b]\n---\n';
    const { user, ref } = setupEditor(`${frontMatter}\n# Body\n\nEdited elsewhere.`);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).not.toHaveTextContent("Hello: world");
    expect(editor).not.toHaveTextContent("[a, b]");

    await user.click(editor);
    await user.keyboard("!");

    expect(ref.current?.getMarkdown() ?? "").toMatch(/^---\ntitle: "Hello: world"\ntags: \[a, b\]\n---\n/);
  });

  test.each(preservedBlocks)("$name comes back byte-identical after an unrelated edit", async ({ source }) => {
    const output = await serializeWithoutEdit(source);
    expect(output).toBe(source);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test.each(preservedInline)("$name comes back byte-identical after an unrelated edit", async ({ source }) => {
    const output = await serializeWithoutEdit(source);
    expect(output).toBe(source);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  const opaqueShapes: Array<{ name: string; source: string }> = [
    { name: "nested same-name component", source: "<Card>\n  <Card>inner</Card>\n</Card>" },
    { name: "nested multi-line child component", source: "<Card>\n  <Inner>\n    deep\n  </Inner>\n</Card>" },
    { name: "component with a blank line inside", source: "<Card>\n  first\n\n  second\n</Card>" },
    { name: "raw HTML block inside a bullet item", source: "- item\n  <div>raw</div>" },
    { name: "component inside a bullet item", source: "- item\n  <Card>\n    body\n  </Card>" },
    { name: "raw HTML block inside a blockquote", source: "> quote\n>\n> <div>raw</div>" },
    { name: "component inside a blockquote", source: '> quote\n> <Avatar user="a" />' },
  ];

  test.each(opaqueShapes)("$name comes back byte-identical and stable after an unrelated edit", async ({ source }) => {
    const output = await serializeWithoutEdit(source);
    expect(output).toBe(source);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a paragraph with a footnote reference and inline HTML is not broken by a list", async () => {
    const source = "- item with <b>bold</b> and a note[^1]\n- second item";
    const output = await serializeWithoutEdit(source);
    expect(output).toBe(source);
  });

  test("prose that mentions import and export is not mistaken for ESM", async () => {
    const source = "I want to import the data from the CSV and export everything.";
    expect(await serializeWithoutEdit(source)).toBe(source);
  });

  test("adjacent ESM lines keep their source but gain a blank-line separator", async () => {
    const source = 'import A from "./a";\nimport B from "./b";';
    const output = await serializeWithoutEdit(source);
    expect(output).toBe('import A from "./a";\n\nimport B from "./b";');
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("a lowercase HTML block with blank lines follows CommonMark and round-trips", async () => {
    const source = "<div>\n\ntext\n\n</div>";
    const output = await serializeWithoutEdit(source);
    expect(output).toBe(source);
    expect(await serializeWithoutEdit(output)).toBe(output);
  });

  test("known Tiptap 3.33.0 issue: a component on an ordered continuation line drifts its indent", async () => {
    // The continuation line loses a leading space on each save until it leaves
    // the item. No content is lost, and the same drift affects plain
    // continuation text in stock 3.33.0.
    const output = await serializeWithoutEdit('1. item\n   <Foo bar="1" />\n2. second');
    expect(output).toBe('1. item\n <Foo bar="1" />\n2. second');
  });

  test("known Tiptap 3.33.0 issue: an unclosed multi-line component loses its leading `>`", async () => {
    // `<Card\n  title="x"\n>` is invalid MDX and outside supported input, so it
    // falls back to stock behaviour, which escapes the tag and drops the `>`.
    const output = await serializeWithoutEdit('<Card\n  title="x"\n>');
    expect(output).toBe('&lt;Card\n  title="x"\n\n');
  });

  test("an opaque block shows its source quietly, opts out of Prose, and stays off the root", async () => {
    const source = '<div class="aside">Raw HTML</div>';
    setupEditor(source);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).not.toHaveAttribute("data-prose-exclude");

    const block = editor.querySelector("[data-opaque-block]");
    expect(block).not.toBeNull();
    expect(block).toHaveTextContent(source);
    expect(block).toHaveAttribute("data-prose-exclude");
    // The atom node is not an editable region, so its text cannot be edited.
    // jsdom reflects `contenteditable="false"` as an IDL property, not an attribute.
    expect(block).toHaveProperty("contentEditable", "false");
  });

  test("an inline opaque span shows its source quietly", async () => {
    setupEditor("Text <b>bold</b>");

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    const span = editor.querySelector("[data-opaque-inline]");
    expect(span).not.toBeNull();
    expect(span).toHaveTextContent("<b>");
    expect(span).toHaveAttribute("data-prose-exclude");
    expect(span).toHaveProperty("contentEditable", "false");
  });

  test("preserved HTML renders inert: no elements, no handlers", async () => {
    setupEditor('Text <script>window.__opaque = true</script> <img src=x onerror="window.__opaque = true"> <a href="javascript:window.__opaque = true">link</a>');

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor.querySelector("script")).toBeNull();
    // ProseMirror adds its own `<img class="ProseMirror-separator">` chrome;
    // the dangerous `<img src onerror>` must not have become an element.
    expect(editor.querySelector("img[src], img[onerror]")).toBeNull();
    expect(editor.querySelector("a")).toBeNull();
    expect(editor).toHaveTextContent('Text <script>window.__opaque = true</script> <img src=x onerror="window.__opaque = true"> <a href="javascript:window.__opaque = true">link</a>');
    expect(Reflect.get(window, "__opaque")).toBeUndefined();
  });

  test("a raw HTML block holding a script renders inert", async () => {
    setupEditor('<div>\n  <script>window.__opaque = true</script>\n  <img src=x onerror="window.__opaque = true">\n</div>');

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor.querySelector("script")).toBeNull();
    expect(editor.querySelector("img[src], img[onerror]")).toBeNull();
    expect(editor.querySelector("[data-opaque-block]")).not.toBeNull();
    expect(Reflect.get(window, "__opaque")).toBeUndefined();
  });

  test("the mixed fixture keeps every construct and is stable on re-parse", async () => {
    const frontMatter = '---\ntitle: "A mixed post"\ntags: [markdown, editor]\n---\n';
    const output = await serializeWithoutEdit(mixedFixture);

    expect(output.startsWith(frontMatter)).toBe(true);
    for (const { source } of preservedBlocks) expect(output).toContain(source);
    expect(output).toContain("A paragraph with **bold**, *italic*, and a footnote reference.[^1]");
    expect(output).toContain('Inline HTML like <b>bold</b> and <span class="tag">a span</span> stays as written.');
    expect(output).toContain("# Existing post");
    expect(output).toContain("- A list item\n- Another item");
    expect(output).toContain("```ts\nconst x = 1;\n```");

    expect(await serializeWithoutEdit(output)).toBe(output);
  });
});

describe("field presentation", () => {
  test("updates the placeholder after mount", async () => {
    const { rerender } = render(<MarkdownEditor defaultValue="" placeholder="First" aria-label="Research note" />);
    const editor = await screen.findByRole("textbox", { name: "Research note" });
    rerender(<MarkdownEditor defaultValue="" placeholder="Second" aria-label="Research note" />);
    // The decoration attribute is the only observable placeholder signal in jsdom.
    await waitFor(() => expect(editor.querySelector("[data-placeholder]")).toHaveAttribute("data-placeholder", "Second"));
  });

  test("an empty editor shows the placeholder and it disappears on input", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor defaultValue="" placeholder="Write a note…" aria-label="Research note" />);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor.querySelector("[data-placeholder]")).toHaveAttribute("data-placeholder", "Write a note…");

    await user.click(editor);
    await user.keyboard("x");
    expect(editor.querySelector("[data-placeholder]")).toBeNull();
  });

  test("read-only prevents edits but stays focusable and announced", async () => {
    const user = userEvent.setup();
    const ref = createRef<MarkdownEditorHandle>();
    render(<MarkdownEditor ref={ref} defaultValue="Draft" readOnly aria-label="Research note" />);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).toHaveAttribute("aria-readonly", "true");
    expect(editor).toHaveAttribute("tabindex", "0");

    await user.click(editor);
    expect(editor).toHaveFocus();
    await user.keyboard("x");
    expect(ref.current?.getMarkdown()).toBe("Draft");
  });

  test("disabled is not focusable, announced, and ignores typing", async () => {
    const user = userEvent.setup();
    const ref = createRef<MarkdownEditorHandle>();
    render(<MarkdownEditor ref={ref} defaultValue="Draft" disabled aria-label="Research note" />);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).toHaveAttribute("aria-disabled", "true");
    expect(editor).not.toHaveAttribute("tabindex");

    await user.click(editor);
    expect(editor).not.toHaveFocus();
    expect(ref.current?.getMarkdown()).toBe("Draft");
  });

  test("toggling read-only after mount keeps the pre-edit bytes and does not fire onChange", async () => {
    const onChange = vi.fn();
    const ref = createRef<MarkdownEditorHandle>();
    const { rerender } = render(<MarkdownEditor ref={ref} defaultValue="Draft" onChange={onChange} aria-label="Research note" />);
    await screen.findByRole("textbox", { name: "Research note" });

    rerender(<MarkdownEditor ref={ref} defaultValue="Draft" onChange={onChange} readOnly aria-label="Research note" />);
    expect(onChange).not.toHaveBeenCalled();
    expect(ref.current?.getMarkdown()).toBe("Draft");
  });

  test("state attributes survive later re-renders", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    const { rerender } = render(<MarkdownEditor ref={ref} defaultValue="Draft" readOnly aria-label="Research note" />);
    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).toHaveAttribute("aria-readonly", "true");
    expect(editor).toHaveAttribute("tabindex", "0");

    rerender(<MarkdownEditor ref={ref} defaultValue="Draft" readOnly invalid aria-label="Research note" />);
    expect(editor).toHaveAttribute("aria-readonly", "true");
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAttribute("tabindex", "0");
  });

  test("autofocus places the caret on mount at the end", async () => {
    const user = userEvent.setup();
    const ref = createRef<MarkdownEditorHandle>();
    render(<MarkdownEditor ref={ref} defaultValue="Draft" autoFocus aria-label="Research note" />);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await waitFor(() => expect(editor).toHaveFocus());
    await user.keyboard("!");
    expect(ref.current?.getMarkdown()).toBe("Draft!");
  });

  test("the label names the editor and the description is associated with it", async () => {
    render(
      <Field orientation="vertical">
        <FieldLabel id="note-label">Notes</FieldLabel>
        <MarkdownEditor defaultValue="Note" aria-labelledby="note-label" aria-describedby="note-desc" />
        <FieldDescription id="note-desc">A helpful description of the note.</FieldDescription>
      </Field>,
    );

    const editor = await screen.findByRole("textbox", { name: "Notes" });
    expect(editor).toHaveAttribute("aria-labelledby", "note-label");
    expect(editor).toHaveAttribute("aria-describedby", "note-desc");
    expect(screen.getByText("A helpful description of the note.")).toBeVisible();
  });

  test("invalid state is announced on the textbox and reflected on the frame", async () => {
    render(<MarkdownEditor defaultValue="Note" invalid aria-label="Research note" />);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    expect(editor).toHaveAttribute("aria-invalid", "true");
    const frame = editor.closest('[data-slot="markdown-editor"]');
    expect(frame).toHaveAttribute("aria-invalid", "true");
  });
});

describe("imperative replace", () => {
  test("setMarkdown replaces the document and reads back byte for byte without firing onChange", async () => {
    const onChange = vi.fn();
    const ref = createRef<MarkdownEditorHandle>();
    render(<MarkdownEditor ref={ref} defaultValue="Draft" onChange={onChange} aria-label="Research note" />);
    await screen.findByRole("textbox", { name: "Research note" });

    const replacement = "## Replaced\n\nNew body\n";
    act(() => { ref.current?.setMarkdown(replacement); });

    expect(onChange).not.toHaveBeenCalled();
    expect(ref.current?.getMarkdown()).toBe(replacement);
    expect(screen.getByRole("heading", { level: 2, name: "Replaced" })).toBeVisible();
  });

  test("setMarkdown resets undo history", async () => {
    const { user, ref } = setupEditor("Draft");
    const editor = await screen.findByRole("textbox", { name: "Research note" });

    await user.click(editor);
    await user.keyboard(" edit");
    expect(ref.current?.getMarkdown()).toBe(" editDraft");

    act(() => { ref.current?.setMarkdown("Replaced"); });
    await user.keyboard("{Control>}z{/Control}");
    expect(ref.current?.getMarkdown()).toBe("Replaced");
  });

  test("setMarkdown preserves front matter", async () => {
    const user = userEvent.setup();
    const ref = createRef<MarkdownEditorHandle>();
    render(<MarkdownEditor ref={ref} defaultValue="---\ntitle: a\n---\n# Old" aria-label="Research note" />);
    const editor = await screen.findByRole("textbox", { name: "Research note" });

    act(() => { ref.current?.setMarkdown("---\ntitle: b\n---\n# New"); });
    expect(ref.current?.getMarkdown()).toBe("---\ntitle: b\n---\n# New");
    expect(editor).not.toHaveTextContent("title: b");
    expect(screen.getByRole("heading", { level: 1, name: "New" })).toBeVisible();

    await user.click(editor);
    await user.keyboard("!");
    expect(ref.current?.getMarkdown()).toBe("---\ntitle: b\n---\n# !New");
  });

  test("a real edit after setMarkdown fires onChange with the replaced document", async () => {
    const onChange = vi.fn();
    const ref = createRef<MarkdownEditorHandle>();
    const user = userEvent.setup();
    render(<MarkdownEditor ref={ref} defaultValue="Draft" onChange={onChange} aria-label="Research note" />);
    const editor = await screen.findByRole("textbox", { name: "Research note" });

    act(() => { ref.current?.setMarkdown("Replaced"); });
    expect(onChange).not.toHaveBeenCalled();

    await user.click(editor);
    await user.keyboard("!");
    expect(onChange).toHaveBeenLastCalledWith("!Replaced");
    expect(ref.current?.getMarkdown()).toBe("!Replaced");
  });

  test("setMarkdown before the editor mounts wins on mount", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    function Parent() {
      useLayoutEffect(() => { ref.current?.setMarkdown("Replaced"); });
      return <MarkdownEditor ref={ref} defaultValue="Draft" aria-label="Research note" />;
    }
    render(<Parent />);

    const editor = await screen.findByRole("textbox", { name: "Research note" });
    await waitFor(() => expect(editor).toHaveTextContent("Replaced"));
    expect(ref.current?.getMarkdown()).toBe("Replaced");
  });
});
