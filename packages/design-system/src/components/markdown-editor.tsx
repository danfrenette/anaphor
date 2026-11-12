"use client";

import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import { getListMarker, ListItem, OrderedList } from "@tiptap/extension-list";
import { Extension, Node } from "@tiptap/core";
import type { MarkdownRendererHelpers, MarkdownToken, RenderContext } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorState, Selection } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { matchOpaqueBlock, matchOpaqueInline, splitFrontMatter } from "#lib/markdown-editor-tokenizers";
import { cn } from "../lib/utils";

declare module "@tiptap/core" {
  interface Storage {
    placeholderText: { placeholder: string };
  }
}

const PlaceholderText = Extension.create({
  name: "placeholderText",
  addStorage: () => ({ placeholder: "" }),
});

function updatePlaceholder(editor: Editor, placeholder: string) {
  editor.storage.placeholderText.placeholder = placeholder;
  editor.view.dispatch(editor.state.tr.setMeta("placeholderRefresh", true));
}

function focusAtEnd(editor: Editor) {
  const end = editor.state.doc.resolve(editor.state.doc.content.size);
  const last = editor.state.doc.lastChild;
  const selection = last && (last.isAtom || last.type.name === "codeBlock") ? new GapCursor(end) : Selection.atEnd(editor.state.doc);
  editor.view.dom.focus();
  editor.view.dispatch(editor.state.tr.setSelection(selection));
  if (!(selection instanceof GapCursor)) {
    const position = editor.view.domAtPos(selection.from);
    window.getSelection()?.collapse(position.node, position.offset);
  }
}

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

// ProseMirror's gap cursor treats textblocks as open unless their schema asks
// for a gap, so allow the default gap-cursor plugin to move past a code block.
const CodeBlockGapCursor = Extension.create({
  name: "codeBlockGapCursor",
  extendNodeSchema: extension => extension.name === "codeBlock" ? { createGapCursor: true } : {},
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

// Workaround 13: @tiptap/extension-list@3.33.0's ordered-list tokenizer reads a
// list item whose first content line is a code fence (e.g. `1. ```js`) as a
// paragraph holding the fence plus a closing-fence code block, so the code is
// lost on reload. Re-tokenise those items from their raw text so they parse to an
// empty leading paragraph plus the recovered blocks, matching the bullet path.
// The repair fires only when the first token is a paragraph whose first line is a
// valid fence opener and the second token is a code token; after the recovered
// blocks it keeps only a nested list token. Every other item shape is delegated
// to the stock tokenizer.
const stockOrderedListTokenizer = OrderedList.config.markdownTokenizer!;

/** True when `line` is a CommonMark fence opener: 0–3 spaces, then a run of 3+ backticks (or tildes) whose info string holds no fence character. */
function isFenceOpener(line: string): boolean {
  return /^( {0,3})(`{3,})([^`]*)$/.test(line) || /^( {0,3})(~{3,})([^~]*)$/.test(line);
}

const MarkdownOrderedList = OrderedList.extend({
  markdownTokenizer: {
    name: "orderedList",
    level: "block",
    start: stockOrderedListTokenizer.start,
    tokenize: (source, tokens, lexer) => {
      const result = stockOrderedListTokenizer.tokenize(source, tokens, lexer);
      const items = result?.items;
      if (!items) return result;
      for (const item of items) {
        const [first, second, ...trailing] = item.tokens ?? [];
        // The bug shape: the first token is a paragraph whose first line is a
        // valid fence opener, and the second is the tokenizer's closing-fence
        // `code` token (trailing content may have been swept into either token).
        if (first?.type !== "paragraph") continue;
        const firstParagraphRaw = first.raw ?? "";
        const firstParagraphNewline = firstParagraphRaw.indexOf("\n");
        const firstParagraphLine = firstParagraphNewline === -1 ? firstParagraphRaw : firstParagraphRaw.slice(0, firstParagraphNewline);
        if (!isFenceOpener(firstParagraphLine)) continue;
        if (second?.type !== "code") continue;
        const raw = item.raw ?? "";
        const newline = raw.indexOf("\n");
        const firstLine = newline === -1 ? raw : raw.slice(0, newline);
        const rest = newline === -1 ? "" : raw.slice(newline + 1);
        const content = firstLine.match(/^(\s*)(\S+?)([.)])\s+(.*)$/)?.[4];
        if (content === undefined) continue;
        const contentIndent = firstLine.length - content.length;
        const dedent = (line: string) => line.slice(Math.min(line.length - line.trimStart().length, contentIndent));
        const codeSource = [content, ...rest.split("\n").map(dedent)].join("\n");
        item.tokens = [{ type: "paragraph", raw: "", text: "", tokens: [] }, ...lexer.blockTokens(codeSource), ...trailing.filter(t => t.type === "list")];
      }
      return result;
    },
  },
});

// --- Preserving unsupported Markdown ---
// Unsupported content is held in opaque atom nodes that store their exact
// source and write it back unchanged. renderHTML emits the source as a text
// child only — never innerHTML, and never through generateJSON/DOMParser into
// live nodes — so preserved HTML stays inert (see the security regression
// test). parseHTML matches only the editor's own data-* markup, so pasted HTML
// never becomes an opaque node.

// Opaque chrome is quiet and visibly distinct, using existing tokens only. The
// data attribute set in renderHTML opts out of Prose's article rules.
const OPAQUE_BLOCK_CLASS = cn(
  // Spacing and wrapping
  "my-4 whitespace-pre-wrap break-words",
  // Quiet surface: control radius, hairline border, subtle fill
  "rounded-control border border-border bg-muted px-2.5 py-1.5",
  // Mono face and muted small text
  "font-mono text-small text-muted-foreground",
);
// The inline span shares the mono face and muted text; its `0.875em` matches
// the prose code size (`--text-prose-code`) so it sits naturally beside body text.
const OPAQUE_INLINE_CLASS = cn("font-mono text-muted-foreground", "text-[0.875em]");

type OpaqueNodeOptions = {
  name: "opaqueBlock" | "opaqueInline";
  group: "block" | "inline";
  inline: boolean;
  tag: "div" | "span";
  dataAttribute: "data-opaque-block" | "data-opaque-inline";
  className: string;
  /** `block` tokens include a trailing separator; `inline` tokens do not. */
  trimTrailingNewlines: boolean;
  match: (source: string) => MarkdownToken | undefined;
};

// Both opaque atom nodes share the same shape: a `source` attribute, a text-only
// renderHTML, parseHTML keyed on their own data-* hook, and renderMarkdown that
// writes the source back verbatim. Only the tag, hook, level and matcher differ.
function createOpaqueNode({ name, group, inline, tag, dataAttribute, className, trimTrailingNewlines, match }: OpaqueNodeOptions): Node {
  return Node.create({
    name,
    group,
    inline,
    atom: true,
    addAttributes: () => ({ source: { default: "" } }),
    parseHTML: () => [{ tag: `${tag}[${dataAttribute}]`, getAttrs: element => ({ source: element.textContent ?? "" }) }],
    renderHTML: ({ node }) => [tag, { [dataAttribute]: "", "data-prose-exclude": "", class: className }, node.attrs.source ?? ""],
    renderMarkdown: node => node.attrs?.source ?? "",
    markdownTokenName: name,
    parseMarkdown: (token, helpers) => helpers.createNode(name, { source: trimTrailingNewlines ? (token.raw ?? "").replace(/\n+$/, "") : (token.raw ?? "") }),
    markdownTokenizer: {
      name,
      level: group,
      // No start anchor: inline text already stops before `<` and `[`, and deriving
      // a start by calling tokenize once corrupts marked's lexer state.
      start: () => -1,
      tokenize: source => match(source),
    },
  });
}

/** Block content the editor does not interpret: raw HTML, comments, footnotes, ESM lines, MDX components. */
const OpaqueBlock = createOpaqueNode({
  name: "opaqueBlock",
  group: "block",
  inline: false,
  tag: "div",
  dataAttribute: "data-opaque-block",
  className: OPAQUE_BLOCK_CLASS,
  trimTrailingNewlines: true,
  match: matchOpaqueBlock,
});

// Raw HTML blocks and comments already lex as marked `html` tokens; this
// handler turns them into opaque blocks instead of letting the stock HTML
// parser fold recognised tags and drop the rest. Inline HTML never reaches
// block parsing, so only block-level tokens arrive here.
const OpaqueHtmlTokens = Extension.create({
  name: "opaqueHtmlTokens",
  markdownTokenName: "html",
  parseMarkdown: (token, helpers) => helpers.createNode("opaqueBlock", { source: (token.raw ?? "").replace(/\n+$/, "") }),
});

/** Inline syntax the editor does not interpret: inline HTML and footnote references. */
const OpaqueInline = createOpaqueNode({
  name: "opaqueInline",
  group: "inline",
  inline: true,
  tag: "span",
  dataAttribute: "data-opaque-inline",
  className: OPAQUE_INLINE_CLASS,
  trimTrailingNewlines: false,
  match: matchOpaqueInline,
});

/** Empty the editor's undo/redo history while leaving its document and selection intact. */
function resetHistory(editor: Editor): void {
  // Recreate the state from the current document so every plugin's state field,
  // including the history plugin's, is re-initialised. Undo and redo start empty.
  const state = editor.state;
  const nextState = EditorState.create({
    doc: state.doc,
    selection: state.selection,
    storedMarks: state.storedMarks,
    plugins: state.plugins,
  });
  editor.view.updateState(nextState);
}

type MarkdownEditorLabel = { "aria-label": string; "aria-labelledby"?: never } | { "aria-label"?: never; "aria-labelledby": string };
type UseMarkdownEditorOptions = {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  /** Shown in an empty editor; disappears on the first input. */
  placeholder?: string;
  /** Still focusable and selectable, but typing does nothing. */
  readOnly?: boolean;
  /** Not focusable and ignored by the pointer; styled with the input disabled tokens. */
  disabled?: boolean;
  /** Focus the editor on mount, with the caret at the end of the document. */
  autoFocus?: boolean;
  /** Marks the textbox invalid and applies the input's invalid border. */
  invalid?: boolean;
  /** The textbox element id, for external association. */
  id?: string;
  /** Ids of the description and error elements inside `Field`. */
  "aria-describedby"?: string;
} & MarkdownEditorLabel;
type UseMarkdownEditorResult = {
  /** Mounting/frame use only. `editor.getMarkdown()` is serializer-normalised and not byte-stable before the first edit. */
  editor: Editor | null;
  /** Read Markdown only here: original bytes before any edit, serializer normal form afterwards. */
  getMarkdown: () => string;
  /** Replace the document from outside. Does not fire `onChange` and resets undo history. */
  setMarkdown: (markdown: string) => void;
};
type MarkdownEditorHandle = { getMarkdown: () => string; setMarkdown: (markdown: string) => void };
type MarkdownEditorProps = UseMarkdownEditorOptions & { ref?: Ref<MarkdownEditorHandle> };

function useMarkdownEditor({
  defaultValue,
  onChange,
  placeholder,
  readOnly = false,
  disabled = false,
  autoFocus = false,
  invalid = false,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: UseMarkdownEditorOptions): UseMarkdownEditorResult {
  const { frontMatter, body } = useMemo(() => splitFrontMatter(defaultValue), [defaultValue]);
  const frontMatterRef = useRef(frontMatter);
  const currentValue = useRef(defaultValue);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const isReplacingRef = useRef(false);
  const pendingBodyRef = useRef<string | null>(null);
  const autofocusHandled = useRef(false);
  const getMarkdown = useCallback(() => currentValue.current, []);
  const editor = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    editable: !readOnly && !disabled,
    autofocus: autoFocus ? "end" : false,
    extensions: [StarterKit.configure({
      // Disabled: underline has no CommonMark source and is not in the supported
      // set; trailingNode appends an extra empty paragraph after a document ending
      // in a non-paragraph block; dropcursor is a drag affordance the field does not need.
      underline: false,
      trailingNode: false,
      dropcursor: false,
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
      // Replaced below by an .extend()ed copy whose tokenizer reads a code fence
      // that opens an ordered item as a code block (workaround 13).
      orderedList: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }), CodeBlockGapCursor, MarkdownCodeBlock, MarkdownLink, MarkdownListItem, MarkdownOrderedList, OpaqueBlock, OpaqueHtmlTokens, OpaqueInline, Markdown, PlaceholderText, Placeholder.configure({ placeholder: ({ editor }) => editor.storage.placeholderText.placeholder })],
    content: body,
    contentType: "markdown",
    editorProps: { attributes: {
      class: "anaphor-prose outline-none",
      role: "textbox",
      "aria-multiline": "true",
      ...(id !== undefined ? { id } : {}),
      ...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {}),
      // State attributes live here, not on an imperative effect, so ProseMirror
      // re-applies them on every view update and toggling never drops them.
      ...(invalid ? { "aria-invalid": "true" } : {}),
      ...(readOnly ? { "aria-readonly": "true" } : {}),
      ...(disabled ? { "aria-disabled": "true" } : {}),
      // Editable and read-only are focusable; disabled is removed from the tab
      // order. `tabindex` here wins over Tiptap's Tabindex extension.
      ...(disabled ? {} : { tabindex: "0" }),
      ...(ariaLabel === undefined ? { "aria-labelledby": ariaLabelledBy } : { "aria-label": ariaLabel }),
    } },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      updatePlaceholder(editor, placeholder ?? "");
    }
  }, [editor, placeholder]);

  useEffect(() => {
    if (editor && autoFocus && !autofocusHandled.current) {
      autofocusHandled.current = true;
      if (readOnly && !disabled) focusAtEnd(editor);
    }
  }, [editor, autoFocus, readOnly, disabled]);

  // Replace the document without emitting an update, then clear undo history.
  const replaceContent = useCallback((nextBody: string, target: Editor) => {
    isReplacingRef.current = true;
    try {
      target.commands.setContent(nextBody, { contentType: "markdown" });
      resetHistory(target);
    } finally {
      isReplacingRef.current = false;
    }
  }, []);

  const setMarkdown = useCallback((markdown: string) => {
    if (editor?.isDestroyed) return;
    const { frontMatter: nextFrontMatter, body: nextBody } = splitFrontMatter(markdown);
    // Until the next real edit, reading the value returns the replaced string
    // byte for byte, the same contract as `defaultValue`.
    currentValue.current = markdown;
    frontMatterRef.current = nextFrontMatter;
    if (editor) {
      replaceContent(nextBody, editor);
    } else {
      // Before the editor exists, remember the body and apply it on mount.
      pendingBodyRef.current = nextBody;
    }
  }, [editor, replaceContent]);

  // A replacement requested before the editor mounted wins over the starting value.
  useEffect(() => {
    if (!editor || pendingBodyRef.current === null) return;
    const nextBody = pendingBodyRef.current;
    pendingBodyRef.current = null;
    replaceContent(nextBody, editor);
  }, [editor, replaceContent]);

  // Keep editable state in step with props after mount. `setEditable(…, false)`
  // skips the update event, so toggling state never fires `onChange` or flips
  // the pre-edit byte guarantee. The accessible attributes are declared in
  // `editorProps.attributes` above, so they survive view updates.
  useEffect(() => {
    if (!editor) return;
    if (disabled && document.activeElement === editor.view.dom) editor.view.dom.blur();
    editor.setEditable(!readOnly && !disabled, false);
  }, [editor, readOnly, disabled]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      if (isReplacingRef.current) return;
      const serializedBody = editor.getMarkdown();
      const currentFrontMatter = frontMatterRef.current;
      // A front-matter-only document ends without a newline on its closing `---`,
      // so the body must be separated with one to keep the block intact on reload.
      const needsSeparator = currentFrontMatter !== "" && !currentFrontMatter.endsWith("\n") && serializedBody !== "";
      currentValue.current = currentFrontMatter + (needsSeparator ? "\n" : "") + serializedBody;
      onChangeRef.current?.(currentValue.current);
    };
    editor.on("update", onUpdate);
    return () => { editor.off("update", onUpdate); };
  }, [editor]);
  return { editor, getMarkdown, setMarkdown };
}

function MarkdownEditor({ ref, ...options }: MarkdownEditorProps) {
  const { disabled = false, invalid = false } = options;
  const { editor, getMarkdown, setMarkdown } = useMarkdownEditor(options);
  useImperativeHandle(ref, () => ({ getMarkdown, setMarkdown }), [getMarkdown, setMarkdown]);

  // A click on the frame's own surface (padding or the empty space below short
  // content) lands outside the editor content; place the caret at the end there.
  // Clicks inside the content are handled by ProseMirror itself, so opaque blocks
  // keep their own click and selection behaviour.
  const handleFrameClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !editor) return;
    const target = event.target;
    if (target instanceof globalThis.Node && editor.view.dom.contains(target)) return;
    focusAtEnd(editor);
  };

  return <div
    data-slot="markdown-editor"
    data-invalid={invalid || undefined}
    data-disabled={disabled || undefined}
    onClick={handleFrameClick}
    className={cn(
      // Layout and surface
      "w-full min-w-0 rounded-control border border-border bg-background px-3.5 py-3",
      // Field box: start small, grow to the maximum, then scroll.
      "min-h-[var(--anaphor-markdown-editor-min-height)] max-h-[var(--anaphor-markdown-editor-max-height)] overflow-y-auto",
      // Focus state
      "focus-within:border-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
      // Invalid state
      "data-invalid:border-danger data-invalid:focus-within:outline-danger",
      // Disabled state
      "data-disabled:pointer-events-none data-disabled:bg-[var(--anaphor-input-disabled)]",
      // Motion
      "motion-safe:transition-[border-color,background-color,outline-color] motion-safe:duration-150",
      // Forced colors
      "forced-colors:border-[ButtonText]",
    )}>
    <EditorContent editor={editor} />
  </div>;
}

export { MarkdownEditor, useMarkdownEditor, type MarkdownEditorHandle, type MarkdownEditorProps, type UseMarkdownEditorOptions, type UseMarkdownEditorResult };
