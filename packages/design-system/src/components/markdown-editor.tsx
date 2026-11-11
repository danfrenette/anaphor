"use client";

import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import { getListMarker, ListItem } from "@tiptap/extension-list";
import type { MarkdownRendererHelpers, RenderContext } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { cn } from "../lib/utils";

// --- Tiptap 3.33.0 serializer workarounds ---
// These overrides correct serialised-Markdown data loss; they do not change
// interaction behaviour. Each is minimal and pins a regression test in
// packages/design-system/test/markdown-editor.test.tsx.

/** Length of the longest run of backtick characters in `text`. */
function longestBacktickRun(text: string): number {
  let longest = 0;
  let current = 0;
  for (const character of text) {
    if (character === "`") {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

/** Fence length that can enclose a code block whose content is `text`. */
function codeFenceLength(text: string): number {
  return Math.max(3, longestBacktickRun(text) + 1);
}

/** True when a link destination must use the `<...>` form to survive a round-trip. */
function linkDestinationNeedsAngleBrackets(href: string): boolean {
  if (/\s/.test(href)) return true;
  let depth = 0;
  for (const character of href) {
    if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth < 0) return true;
    }
  }
  return depth !== 0;
}

// Workaround F1: write a fence longer than the longest backtick run in the
// content so a line of backticks inside the block cannot close the fence on
// reload. The stock renderer writes a fixed ``` fence.
const MarkdownCodeBlock = CodeBlock.extend({
  renderMarkdown: (node, h) => {
    const language = node.attrs?.language || "";
    if (!node.content) return `\`\`\`${language}\n\n\`\`\``;
    const content = h.renderChildren(node.content);
    const fence = "`".repeat(codeFenceLength(content));
    return `${fence}${language}\n${content}\n${fence}`;
  },
});

// Workaround F3: wrap a link destination in `<...>` when it holds spaces or
// unbalanced parentheses, which CommonMark only accepts in the bracketed form.
// The stock renderer writes the bare href, which re-parses as a shorter link.
const MarkdownLink = Link.extend({
  renderMarkdown: (node, h) => {
    const href = node.attrs?.href ?? "";
    const title = node.attrs?.title ?? "";
    const text = h.renderChildren(node);
    const destination = linkDestinationNeedsAngleBrackets(href) ? `<${href}>` : href;
    return title ? `[${text}](${destination} "${title}")` : `[${text}](${destination})`;
  },
}).configure({ openOnClick: false, autolink: false, linkOnPaste: false });

/** Width of a prefix in Markdown columns, where a tab runs to the next 4-column stop. */
function columnWidth(text: string): number {
  let width = 0;
  for (const character of text) width = character === "\t" ? width + 4 - (width % 4) : width + 1;
  return width;
}

/** The `- `, `1. ` (or other marker) prefix for a list item, as the stock renderer computes it. */
function listItemPrefix(ctx: RenderContext): string {
  if (ctx.parentType === "bulletList") return "- ";
  if (ctx.parentType === "orderedList") {
    const start = ctx.meta?.parentAttrs?.start || 1;
    return getListMarker(ctx.meta?.parentAttrs?.type, start - 1 + (ctx.index || 0), ". ");
  }
  return "- ";
}

/** Indents a continuation line the way the stock nested-content renderer does. */
function indentContinuationLine(line: string, prefix: string, h: MarkdownRendererHelpers, alignNestedToPrefix: boolean): string {
  if (!alignNestedToPrefix) return h.indent(line);
  const configured = h.indent("");
  const prefixWidth = columnWidth(prefix);
  return (columnWidth(configured) >= prefixWidth ? configured : " ".repeat(prefixWidth)) + line;
}

// Workaround F4: a code block that opens a list item must share the marker line.
// The stock renderer emits an empty "- " marker line before an indented fence,
// which re-parses outside the list item and drops the code. Delegates every other
// shape to the parent renderer via this.parent.
const MarkdownListItem = ListItem.extend({
  renderMarkdown(node, h, ctx) {
    const [first, second, ...rest] = node.content ?? [];
    if (first?.type !== "paragraph" || first.content?.length || second?.type !== "codeBlock") {
      return this.parent?.(node, h, ctx) ?? "";
    }
    const prefix = listItemPrefix(ctx);
    const alignNestedToPrefix = ctx.parentType === "orderedList";
    const indentLine = (line: string) => indentContinuationLine(line, prefix, h, alignNestedToPrefix);

    const codeContent = h.renderChild?.(second, 1) ?? h.renderChildren([second]);
    const codeLines = codeContent.split("\n");
    let output = prefix + codeLines[0];
    for (const line of codeLines.slice(1)) output += `\n${indentLine(line)}`;

    rest.forEach((child, index) => {
      const childContent = h.renderChild?.(child, index + 2) ?? h.renderChildren([child]);
      const indented = childContent.split("\n").map(line => (line ? indentLine(line) : indentLine(""))).join("\n");
      output += child.type === "paragraph" ? `\n\n${indented}` : `\n${indented}`;
    });
    return output;
  },
});

type MarkdownEditorLabel = { "aria-label": string; "aria-labelledby"?: never } | { "aria-label"?: never; "aria-labelledby": string };
type UseMarkdownEditorOptions = {
  defaultValue: string;
  onChange?: (markdown: string) => void;
} & MarkdownEditorLabel;
type UseMarkdownEditorResult = {
  /** Mounting/frame use only. `editor.getMarkdown()` is serializer-normalised and not byte-stable before the first edit. */
  editor: Editor | null;
  /** Read Markdown only here: original bytes before any edit, serializer normal form afterwards. */
  getMarkdown: () => string;
};
type MarkdownEditorHandle = { getMarkdown: () => string };
type MarkdownEditorProps = UseMarkdownEditorOptions & { ref?: Ref<MarkdownEditorHandle> };

function useMarkdownEditor({ defaultValue, onChange, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy }: UseMarkdownEditorOptions): UseMarkdownEditorResult {
  const currentValue = useRef(defaultValue);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const getMarkdown = useCallback(() => currentValue.current, []);
  const editor = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    extensions: [StarterKit.configure({
      // Disabled: underline has no CommonMark source and is not in the supported
      // set; trailingNode appends an extra empty paragraph after a document ending
      // in a non-paragraph block; dropcursor and gapcursor are drag/click-caret
      // affordances the field does not need.
      underline: false,
      trailingNode: false,
      dropcursor: false,
      gapcursor: false,
      // Replaced below by an .extend()ed copy whose renderer writes a fence long
      // enough for the content (F1).
      codeBlock: false,
      // Replaced below by an .extend()ed copy whose renderer writes angle-bracket
      // destinations when CommonMark requires them (F3). Interaction options are
      // unchanged: links render as links but never open on click, never auto-link
      // while typing, and never link on paste. Clicking places the caret instead.
      link: false,
      // Replaced below by an .extend()ed copy whose renderer keeps a leading code
      // block on the marker line (F4).
      listItem: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }), MarkdownCodeBlock, MarkdownLink, MarkdownListItem, Markdown],
    content: defaultValue,
    contentType: "markdown",
    editorProps: { attributes: {
      class: "anaphor-prose outline-none",
      role: "textbox",
      "aria-multiline": "true",
      ...(ariaLabel === undefined ? { "aria-labelledby": ariaLabelledBy } : { "aria-label": ariaLabel }),
    } },
  });
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      currentValue.current = editor.getMarkdown();
      onChangeRef.current?.(currentValue.current);
    };
    editor.on("update", onUpdate);
    return () => { editor.off("update", onUpdate); };
  }, [editor]);
  return { editor, getMarkdown };
}

function MarkdownEditor({ ref, ...options }: MarkdownEditorProps) {
  const { editor, getMarkdown } = useMarkdownEditor(options);
  useImperativeHandle(ref, () => ({ getMarkdown }), [getMarkdown]);
  return <div data-slot="markdown-editor" className={cn(
    // Layout and surface
    "w-full min-w-0 rounded-control border border-border bg-background px-3.5 py-3",
    // Focus state
    "focus-within:border-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
    // Motion
    "motion-safe:transition-[border-color,background-color,outline-color] motion-safe:duration-150",
    // Forced colors
    "forced-colors:border-[ButtonText]",
  )}>
    <EditorContent editor={editor} />
  </div>;
}

export { MarkdownEditor, useMarkdownEditor, type MarkdownEditorHandle, type MarkdownEditorProps, type UseMarkdownEditorOptions, type UseMarkdownEditorResult };
