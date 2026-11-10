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
