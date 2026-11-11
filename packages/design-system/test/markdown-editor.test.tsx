import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { MarkdownEditor, type MarkdownEditorHandle } from "@anaphor/system";

// jsdom has no pointer hit testing or range layout; real editing geometry is covered in Playwright.
beforeEach(() => {
  Object.defineProperty(document, "elementFromPoint", { configurable: true, value: () => document.querySelector('[contenteditable="true"]') });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }) });
});

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

test.each([1, 2, 3, 4, 5, 6] as const)("typing a level %i heading trigger produces Markdown", async level => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard(`${"#".repeat(level)} Title`);

  expect(screen.getByRole("heading", { level, name: "Title" })).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe(`${"#".repeat(level)} Title`);
});

test("typing separate paragraphs produces Markdown blocks", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("First{Enter}Second");

  expect(ref.current?.getMarkdown()).toBe("First\n\nSecond");
});

test("typing bold markers produces bold Markdown", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("**bold**");

  expect(screen.getByText("bold")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("**bold**");
});

test.each([{ input: "*italic*" }, { input: "_italic_" }])("typing $input produces italic Markdown", async ({ input }) => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard(input);

  expect(screen.getByText("italic")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("*italic*");
});

test.each([{ text: "bold", key: "b", expected: "**bold**" }, { text: "italic", key: "i", expected: "*italic*" }])("Mod-$key formats selected $text", async ({ text, key, expected }) => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard(text);
  await user.keyboard(`{Control>}a{/Control}{Control>}${key}{/Control}`);

  expect(ref.current?.getMarkdown()).toBe(expected);
});

test.each([1, 2, 3, 4, 5, 6] as const)("Mod-Alt-%i formats a level %i heading", async level => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("Title");
  await user.keyboard(`{Control>}{Alt>}${level}{/Alt}{/Control}`);

  expect(screen.getByRole("heading", { level, name: "Title" })).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe(`${"#".repeat(level)} Title`);
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

test.each([{ trigger: "- ", expected: "- Item" }, { trigger: "* ", expected: "- Item" }])("typing $trigger starts a bullet list", async ({ trigger, expected }) => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard(`${trigger}Item`);

  expect(screen.getByRole("list")).toBeVisible();
  // The serializer normalises any bullet marker to `-`.
  expect(ref.current?.getMarkdown()).toBe(expected);
});

test("typing 1. starts a numbered list", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("1. First");

  expect(screen.getByRole("list")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("1. First");
});

test("typing > starts a blockquote", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("> Quoted");

  expect(screen.getByRole("blockquote")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("> Quoted");
});

test("typing three backticks and a space starts a fenced code block", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("``` ");
  await user.keyboard("const x = 1;");

  expect(ref.current?.getMarkdown()).toBe("```\nconst x = 1;\n```");
});

test("typing --- inserts a horizontal rule and keeps typing after it", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("---Next");

  expect(screen.getByRole("separator")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("---\n\nNext");
});

test("typing ~~x~~ strikes through", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("~~gone~~");

  expect(screen.getByText("gone")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("~~gone~~");
});

test("typing `x` marks inline code", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("`code`");

  expect(screen.getByText("code")).toBeVisible();
  expect(ref.current?.getMarkdown()).toBe("`code`");
});

test.each([
  { text: "struck", shortcut: "s", shift: true, expected: "~~struck~~" },
  { text: "coded", shortcut: "e", shift: false, expected: "`coded`" },
])("Mod-$shortcut formats selected $text", async ({ text, shortcut, shift, expected }) => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard(text);
  await user.keyboard(`{Control>}a{/Control}{Control>}${shift ? "{Shift>}" : ""}${shortcut}${shift ? "{/Shift}" : ""}{/Control}`);

  expect(ref.current?.getMarkdown()).toBe(expected);
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
  expect(markdown).not.toContain("_blank");
  expect(markdown).not.toContain("noopener");
});

test("one undo reverts a bullet list conversion to the literal characters", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("- ");
  await user.keyboard("{Control>}z{/Control}");

  expect(ref.current?.getMarkdown()).toBe("- ");
});

test("one undo reverts a horizontal rule conversion to the literal characters", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("---");
  await user.keyboard("{Control>}z{/Control}");

  expect(ref.current?.getMarkdown()).toBe("---");
});

test("Enter on an empty list item leaves the list", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("- One{Enter}Two{Enter}{Enter}After");

  expect(ref.current?.getMarkdown()).toBe("- One\n- Two\n\nAfter");
  expect(screen.getByRole("list")).not.toHaveTextContent("After");
});

test("Backspace at the start of a list item lifts it to a paragraph", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="- One" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("{Backspace}");

  expect(ref.current?.getMarkdown()).toBe("One");
});

test("Enter on an empty quotation line leaves the blockquote", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("> Quoted{Enter}{Enter}After");

  expect(ref.current?.getMarkdown()).toBe("> Quoted\n\nAfter");
});

test("triple Enter leaves a code block", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("``` code{Enter}{Enter}{Enter}After");

  expect(ref.current?.getMarkdown()).toBe("```\ncode\n```\n\nAfter");
});

test("Tab nests a list item and Shift+Tab un-nests it", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("- One{Enter}Two");
  await user.keyboard("{Tab}");
  expect(ref.current?.getMarkdown()).toBe("- One\n  - Two");

  await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(ref.current?.getMarkdown()).toBe("- One\n- Two");
});

test("Backspace at the start of a quotation lifts it to a paragraph", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="> Quoted" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("{Backspace}");

  expect(ref.current?.getMarkdown()).toBe("Quoted");
});

test("undo and redo span typing and formatting", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

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

test("underlining is not available", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  const { container } = render(<MarkdownEditor ref={ref} defaultValue="" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("text");
  await user.keyboard("{Control>}a{/Control}{Control>}u{/Control}");

  expect(container.querySelector("u")).toBeNull();
  expect(ref.current?.getMarkdown()).toBe("text");
});

test("a fixture with every construct loads formatted and edits to valid Markdown", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  const fixture = [
    "# Title",
    "",
    "A **bold** and *italic* line with ~~strike~~, `code`, and a [link](https://anaphor.dev).",
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
  render(<MarkdownEditor ref={ref} defaultValue={fixture} aria-label="Research note" />);

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
  expect(markdown).toContain("# !Title");
  expect(markdown).toContain("**bold**");
  expect(markdown).toContain("*italic*");
  expect(markdown).toContain("~~strike~~");
  expect(markdown).toContain("`code`");
  expect(markdown).toContain("[link](https://anaphor.dev)");
  expect(markdown).toContain("- Bullet one");
  expect(markdown).toContain("- Bullet two");
  expect(markdown).toContain("  - Nested");
  expect(markdown).toContain("1. First");
  expect(markdown).toContain("2. Second");
  expect(markdown).toContain("> A quote");
  expect(markdown).toContain("```ts\nconst x = 1;\n```");
  expect(markdown).toContain("---");
});
test("a document ending in a non-paragraph block gains no trailing paragraph", async () => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} defaultValue="# Heading" aria-label="Research note" />);

  const editor = await screen.findByRole("textbox", { name: "Research note" });
  await user.click(editor);
  await user.keyboard("!");

  expect(ref.current?.getMarkdown()).toBe("# !Heading");
});
