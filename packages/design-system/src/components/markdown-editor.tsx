"use client";

import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import { getListMarker, ListItem, OrderedList, TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Extension, Node } from "@tiptap/core";
import type { JSONContent, MarkdownRendererHelpers, MarkdownToken, RenderContext } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Image } from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { EditorState, Plugin, PluginKey, Selection, TextSelection } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import { closeHistory } from "@tiptap/pm/history";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus";
import { TextB, TextItalic, TextStrikethrough, Code, Link as LinkIcon } from "@phosphor-icons/react/dist/ssr";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react";
import { cleanPastedHtml, handleMarkdownPaste, isSafePasteUri, literalPastedImage, normalizeLinkHref, PasteOrdinal, suppressPastedOrdinal } from "#lib/markdown-editor-paste";
import { matchOpaqueBlock, matchOpaqueInline, splitFrontMatter } from "#lib/markdown-editor-tokenizers";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Kbd } from "./kbd";
import { Input } from "./input";
import { Tooltip, TooltipGroup, TooltipPopup, TooltipTrigger } from "./tooltip";

declare module "@tiptap/core" {
  interface Storage {
    placeholderText: { placeholder: string };
  }
}

const PlaceholderText = Extension.create({
  name: "placeholderText",
  addStorage: () => ({ placeholder: "" }),
});

// Tiptap 3.33.0 workaround: serialize a link across inline images as one span.
function renderLinkedImages(node: JSONContent, helpers: MarkdownRendererHelpers): string | undefined {
  const content = node.content ?? [];
  if (!content.some(child => child.type === "image" && child.marks?.some(mark => mark.type === "link"))) return undefined;
  let markdown = "";
  for (let i = 0; i < content.length;) {
    const link = content[i]?.marks?.find(mark => mark.type === "link");
    let end = i + 1;
    while (end < content.length && JSON.stringify(content[end]?.marks?.find(mark => mark.type === "link")) === JSON.stringify(link)) end++;
    const children = content.slice(i, end).map(child => ({ ...child, marks: child.marks?.filter(mark => mark.type !== "link") }));
    const text = helpers.renderChildren(children);
    if (link) {
      const href = link.attrs?.href ?? "";
      const destination = serializeLinkDestination(href);
      const title = (link.attrs?.title ?? "").replace(/[\\"]/g, "\\$&");
      markdown += title ? `[${text}](${destination} "${title}")` : `[${text}](${destination})`;
    } else markdown += text;
    i = end;
  }
  return markdown;
}

const MarkdownStarterKit = StarterKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map(extension => extension.name === "heading" ? extension.extend({
      // Tiptap 3.33.0 workaround: group links across inline images in headings.
      renderMarkdown(node, helpers, context) {
        const content = renderLinkedImages(node, helpers);
        return content === undefined ? this.parent?.(node, helpers, context) ?? "" : `${"#".repeat(Number(node.attrs?.level) || 1)} ${content}`;
      },
    }) : extension.name !== "paragraph" ? extension : extension.extend({
      // Spec requirement (AC-7): serialize pasted unsupported blocks as literal text.
      addAttributes() {
        return { pasteLiteral: { default: false, parseHTML: () => false, renderHTML: () => ({}) } };
      },
      // Tiptap 3.33.0 workaround: preserve authored NBSP-only paragraphs anywhere;
      // stock serialization loses their visible gap on reparse, including #8719's authored separator.
      parseMarkdown(token, helpers) {
        // Spec requirement (AC-1, AC-2): an image-only paragraph stays a paragraph.
        if (token.tokens?.length === 1 && token.tokens[0]?.type === "image") {
          return helpers.createNode("paragraph", undefined, helpers.parseInline(token.tokens));
        }
        if (token.tokens?.length === 1 && token.tokens[0]?.type === "text" && ["&nbsp;", "\u00a0"].includes(token.tokens[0].raw ?? "")) {
          return helpers.createNode("paragraph", undefined, [{ type: "text", text: "\u00a0" }]);
        }
        return this.parent?.(token, helpers) ?? [];
      },
      renderMarkdown(node, helpers, context) {
        if (node.content?.length === 1 && node.content[0]?.type === "text" && node.content[0].text === "\u00a0") return "&nbsp;";
        const markdown = renderLinkedImages(node, helpers) ?? this.parent?.(node, helpers, context) ?? "";
        // Spec requirement (AC-7): keep pasted literal rules from becoming Markdown rules.
        // Tiptap 3.33.0 workaround: paragraph lines must not reparse as blocks.
        const paragraph = markdown.replace(/^(?: {4,}| {0,3}\t)[ \t]*/gm, indent => [...indent].map(character => character === "\t" ? "&#9;" : "&#32;").join(""))
          .replace(/^( {0,3})(\d+)([.)])(?=[ \t])/gm, "$1$2\\$3")
          .replace(/^( {0,3})([-+>])(?=[ \t])/gm, "$1\\$2")
          .replace(/^( {0,3})((?:#{1,6}(?=[ \t])|`{3,}|~{3,}|(?:[-*_][ \t]*){3,}$|={3,}[ \t]*$)[^\n]*)/gm, (line, indent: string, content: string) => {
            const fence = /^`{3,}/.exec(content)?.[0];
            if (fence && [...content.slice(fence.length).matchAll(/`+/g)].some(run => run[0] === fence)) return line;
            return `${indent}\\${content}`;
          });
        return node.attrs?.pasteLiteral ? paragraph.replace(/^( {0,3})(?=-{3,}(?:\s|$))/gm, "$1\\") : paragraph;
      },
    }));
  },
});

const MarkdownTable = Table.extend({
  // Tiptap 3.33.0 workaround: table serialization writes hard breaks as HTML.
  parseMarkdown(token, helpers) {
    const table = this.parent?.(token, helpers) ?? [];
    const restoreBreaks = (node: JSONContent) => {
      if (node.type === "opaqueInline" && /^<br\s*\/?>$/i.test(node.attrs?.source ?? "")) {
        node.type = "hardBreak";
        delete node.attrs;
      }
      node.content?.forEach(restoreBreaks);
    };
    (Array.isArray(table) ? table : [table]).forEach(restoreBreaks);
    return table;
  },
  // Tiptap 3.33.0 workaround (#8719): don't double the separator between tables.
  renderMarkdown(node, helpers, context) {
    const markdown = this.parent?.(node, helpers, context) ?? "";
    return context.previousNode?.type === "table" ? markdown.replace(/^\n/, "") : markdown;
  },
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // The editor spec excludes adding rows: at the last cell, allow native Tab to leave.
      Tab: () => this.editor.commands.goToNextCell(),
    };
  },
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

// Tiptap 3.33.0 workaround: bare destinations cannot terminate in injected HTML.
function serializeLinkDestination(href: string): string {
  return normalizeLinkHref(href).replace(/[()&]/g, "\\$&");
}

/** True when an image destination must use the `<...>` form to survive a round-trip. */
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
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [new Plugin({
      props: {
        decorations(state) {
          const attributes = editor.options.editorProps.attributes;
          if (typeof attributes === "function" || attributes?.["aria-readonly"] !== "true" || attributes?.["aria-disabled"] === "true") return null;
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === "codeBlock") decorations.push(Decoration.node(pos, pos + node.nodeSize, { tabindex: "0" }));
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    })];
  },
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

// Tiptap 3.33.0 workaround: serialize link destinations without syntax breakout.
const MarkdownLink = Link.extend({
  // Tiptap 3.33.0 workaround: paste rules can create a non-normalized link mark.
  renderHTML(props) {
    const href = props.HTMLAttributes.href;
    return this.parent!({ ...props, HTMLAttributes: { ...props.HTMLAttributes, href: isSafePasteUri(href) ? normalizeLinkHref(href) : href } });
  },
  addAttributes() {
    return { ...this.parent?.(), href: { default: null, parseHTML: element => {
      const href = element.getAttribute("href");
      return href && isSafePasteUri(href) ? normalizeLinkHref(href) : href;
    } } };
  },
  // Tiptap 3.33.0 workaround: applyMark skips inline image nodes.
  parseMarkdown: (token, helpers) => helpers.parseInline(token.tokens ?? []).map(node => ({
    ...node,
    marks: [...(node.marks ?? []), { type: "link", attrs: { href: isSafePasteUri(token.href) ? normalizeLinkHref(token.href ?? "") : token.href, title: token.title || null } }],
  })),
  renderMarkdown: (node, h) => {
    const href = node.attrs?.href ?? "";
    const title = node.attrs?.title ?? "";
    const text = h.renderChildren(node);
    const destination = serializeLinkDestination(href);
    // Tiptap 3.33.0 workaround: escape title delimiters and backslashes.
    const escapedTitle = title.replace(/[\\"]/g, "\\$&");
    return title ? `[${text}](${destination} "${escapedTitle}")` : `[${text}](${destination})`;
  },
// Spec requirement (AC-4): paste linking is handled by the safety-checked adapter.
}).configure({ openOnClick: false, autolink: false, linkOnPaste: false });

// Tiptap 3.33.0 workaround: preserve delimiters in image alt text and destinations.
const MarkdownImage = Image.extend({
  // Tiptap 3.33.0 workaround: decode CommonMark escapes and entities in image alt text.
  parseMarkdown: (token, helpers) => {
    const literal = literalPastedImage(token);
    if (literal) return literal;
    const element = document.createElement("span");
    const alt = (token.text ?? "").replace(/\\([!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~])|&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#[0-9]{1,7}|#[xX][a-fA-F0-9]{1,6});/g, (match, escaped: string | undefined) => {
      if (escaped) return escaped;
      element.innerHTML = `<span data-entity="${match}"></span>`;
      return element.firstElementChild!.getAttribute("data-entity")!;
    });
    return helpers.createNode("image", { src: token.href, title: token.title, alt });
  },
  renderMarkdown: node => {
    const src = node.attrs?.src ?? "";
    // Tiptap 3.33.0 workaround: preserve literal Markdown syntax in alt text.
    const alt = (node.attrs?.alt ?? "").replace(/\s*[\r\n]\s*/g, " ").replace(/&/g, "&amp;").replace(/[\\`*_[\]<>~]/g, "\\$&");
    const title = (node.attrs?.title ?? "").replace(/[\\"]/g, "\\$&");
    const destination = linkDestinationNeedsAngleBrackets(src) ? `<${src}>` : src;
    const image = title ? `![${alt}](${destination} "${title}")` : `![${alt}](${destination})`;
    // Tiptap 3.33.0 workaround: inline atom marks are not rendered by the serializer.
    const link = node.marks?.find(mark => mark.type === "link");
    if (!link) return image;
    const href = link.attrs?.href ?? "";
    const linkDestination = serializeLinkDestination(href);
    const linkTitle = (link.attrs?.title ?? "").replace(/[\\"]/g, "\\$&");
    return linkTitle ? `[${image}](${linkDestination} "${linkTitle}")` : `[${image}](${linkDestination})`;
  },
}).configure({ inline: true });

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
      const suppressed = suppressPastedOrdinal(source, result || undefined);
      if (suppressed) return suppressed;
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
type MarkdownEditorImageHandler = (file: File) => Promise<{ src: string; alt: string }>;
type UseMarkdownEditorOptions = {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  /** Resolve a pasted or dropped image file to an address and alt text. */
  onImageFile?: MarkdownEditorImageHandler;
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
type MarkdownEditorProps = UseMarkdownEditorOptions & { presentation: "field" | "in-place"; ref?: Ref<MarkdownEditorHandle> };

function useMarkdownEditor({
  defaultValue,
  onChange,
  onImageFile,
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
  const imageHandlerRef = useRef(onImageFile);
  useLayoutEffect(() => { imageHandlerRef.current = onImageFile; }, [onImageFile]);
  const imageGeneration = useRef(0);
  const pendingImageCleanup = useRef(new Set<() => void>());
  const cancelPendingImages = useCallback(() => {
    imageGeneration.current++;
    for (const cleanup of pendingImageCleanup.current) cleanup();
  }, []);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const isReplacingRef = useRef(false);
  const pendingBodyRef = useRef<string | null>(null);
  const autofocusHandled = useRef(false);
  const getMarkdown = useCallback(() => currentValue.current, []);
  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    editable: !readOnly && !disabled,
    autofocus: autoFocus ? "end" : false,
    extensions: [MarkdownStarterKit.configure({
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
    // Spec requirement (AC-1, AC-2): Markdown images are inline content.
    }), CodeBlockGapCursor, MarkdownCodeBlock, MarkdownLink, MarkdownListItem, MarkdownOrderedList, PasteOrdinal, TaskList, TaskItem.configure({ nested: true }), MarkdownTable, TableRow, TableHeader, TableCell, MarkdownImage, OpaqueBlock, OpaqueHtmlTokens, OpaqueInline, Markdown, PlaceholderText, Placeholder.configure({ placeholder: ({ editor }) => editor.storage.placeholderText.placeholder })],
    content: body,
    contentType: "markdown",
    // Spec requirement (AC-1–5, AC-7): clean and classify pasted content.
    editorProps: { transformPastedHTML: cleanPastedHtml, handleDOMEvents: {
      paste: (view, event) => handleImageFiles(view, event, event.clipboardData?.files, false),
      drop: (view, event) => handleImageFiles(view, event, event.dataTransfer?.files, true),
    }, handlePaste: (view, event): boolean => {
      return handleMarkdownPaste(view, event, editor);
    }, attributes: {
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

  function handleImageFiles(view: Editor["view"], event: Event, files: FileList | undefined, drop: boolean): boolean {
    const images = Array.from(files ?? []).filter(file => file.type.startsWith("image/"));
    if (!images.length) {
      if (drop && files?.length) { event.preventDefault(); return true; }
      return false;
    }
    event.preventDefault();
    const handler = imageHandlerRef.current;
    if (!handler || !editor || !editor.isEditable) return true;
    const position = drop && event instanceof MouseEvent ? view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos : undefined;
    let from = position ?? view.state.selection.from;
    let to = position ?? view.state.selection.to;
    const generation = imageGeneration.current;
    const map = ({ transaction }: { transaction: import("@tiptap/pm/state").Transaction }) => {
      from = transaction.mapping.map(from, 1);
      to = transaction.mapping.map(to, 1);
    };
    editor.on("transaction", map);
    const cleanup = () => {
      editor.off("transaction", map);
      pendingImageCleanup.current.delete(cleanup);
    };
    pendingImageCleanup.current.add(cleanup);
    void Promise.allSettled(images.map(file => Promise.resolve().then(() => handler(file)))).then(results => {
      cleanup();
      if (editor.isDestroyed || !editor.isEditable || generation !== imageGeneration.current) return;
      const content = results.flatMap(result => result.status === "fulfilled" ? [{ type: "image", attrs: result.value }] : []);
      if (content.length) {
        // Spec requirement (handoff 346 decision 4): an asynchronously resolved image is its own undo step.
        editor.chain().command(({ tr }) => { closeHistory(tr); return true; }).insertContentAt({ from, to }, content).run();
        editor.view.dispatch(closeHistory(editor.state.tr));
      }
    });
    return true;
  }

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
    cancelPendingImages();
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
  }, [editor, replaceContent, cancelPendingImages]);

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
  useLayoutEffect(() => {
    if (!editor) return;
    if (readOnly || disabled) cancelPendingImages();
    if (disabled && document.activeElement instanceof HTMLElement && editor.view.dom.contains(document.activeElement)) document.activeElement.blur();
    editor.setEditable(!readOnly && !disabled, false);
  }, [editor, readOnly, disabled, cancelPendingImages]);

  useEffect(() => () => { cancelPendingImages(); }, [cancelPendingImages]);

  useLayoutEffect(() => {
    if (!editor || !disabled) return;
    const root = editor.view.dom;
    const disableCheckboxes = () => root.querySelectorAll<HTMLInputElement>('li[data-checked] input[type="checkbox"]').forEach(input => { input.disabled = true; });
    disableCheckboxes();
    const observer = new MutationObserver(disableCheckboxes);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      root.querySelectorAll<HTMLInputElement>('li[data-checked] input[type="checkbox"]').forEach(input => { input.disabled = false; });
    };
  }, [editor, disabled]);

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

function FormattingButtons({ editor, focused, setFocused, openLink }: { editor: Editor; focused: number; setFocused: (index: number) => void; openLink: () => void }) {
  const active = useEditorState({ editor, selector: ({ editor }) => ({
    bold: editor.isActive("bold"), italic: editor.isActive("italic"),
    strike: editor.isActive("strike"), code: editor.isActive("code"), link: editor.isActive("link"),
  }) });
  const items = [
    { name: "Bold", key: "bold" as const, shortcut: "B", Icon: TextB, run: () => editor.chain().toggleBold().run() },
    { name: "Italic", key: "italic" as const, shortcut: "I", Icon: TextItalic, run: () => editor.chain().toggleItalic().run() },
    { name: "Strikethrough", key: "strike" as const, shortcut: "Shift+S", Icon: TextStrikethrough, run: () => editor.chain().toggleStrike().run() },
    { name: "Inline code", key: "code" as const, shortcut: "E", Icon: Code, run: () => editor.chain().toggleCode().run() },
    { name: "Link", key: "link" as const, shortcut: "K", Icon: LinkIcon, run: openLink },
  ];
  return <TooltipGroup>{items.map(({ name, key, shortcut, Icon, run }, index) => <Tooltip key={key}>
    <TooltipTrigger render={<Button nativeButton type="button" variant="ghost" tone="neutral" size="sm" shape="square" iconOnly loading={false}
      className="aria-pressed:bg-[var(--anaphor-input-disabled)]" aria-label={name} aria-pressed={active[key]} tabIndex={focused === index ? 0 : -1} onFocus={() => setFocused(index)} onMouseDown={event => event.preventDefault()} onClick={() => { if (editor.isEditable) run(); }}><Icon aria-hidden="true" /></Button>} />
    <TooltipPopup side="top" align="center" sideOffset={8}>{name} <Kbd>Mod+{shortcut}</Kbd></TooltipPopup>
  </Tooltip>)}</TooltipGroup>;
}

function shouldShowFormatting({ editor, element, view, state, from, to }: Parameters<NonNullable<BubbleMenuProps["shouldShow"]>>[0]) {
  // Spec requirement: exclude node and cell selections and opaque/code content.
  if (!editor.isEditable || !(state.selection instanceof TextSelection) || state.selection.empty || !(view.hasFocus() || element.contains(document.activeElement))) return false;
  let excluded = false;
  state.doc.nodesBetween(from, to, node => {
    if (["codeBlock", "opaqueBlock", "opaqueInline"].includes(node.type.name)) excluded = true;
  });
  return !excluded && !!state.doc.textBetween(from, to);
}

function MarkdownEditor({ ref, presentation, ...options }: MarkdownEditorProps) {
  const { disabled = false, readOnly = false, invalid = false } = options;
  const { editor, getMarkdown, setMarkdown } = useMarkdownEditor(options);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleKey = useMemo(() => new PluginKey("formattingBubble"), []);
  const [focused, setFocused] = useState(0);
  const [coarsePointer, setCoarsePointer] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [editingLink, setEditingLink] = useState(false);
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState(false);
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => { if (disabled || readOnly) setEditingLink(false); }, [disabled, readOnly]);
  useLayoutEffect(() => { if (editingLink) inputRef.current?.focus(); }, [editingLink]);
  const openLink = useCallback(() => {
    if (!editor?.isEditable) return;
    setUrl(editor.getAttributes("link").href ?? "");
    setLinkError(false);
    setEditingLink(true);
  }, [editor]);
  const finishLink = (remove: boolean) => {
    if (!editor?.isEditable) return;
    const value = url.trim();
    const host = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?(?::\d+)?(?:[/?#][^\s@\\]*)?$/i.test(value);
    const explicit = /^[a-z][a-z\d+.-]*:/i.test(value) && !host;
    const relative = /^(?:\.\.?\/|\/|#)/.test(value) || /^[^\s@\\:]+\/[^\s@\\]*$/.test(value);
    const href = normalizeLinkHref(host ? `https://${value}` : value);
    if (!remove && (!value || !isSafePasteUri(href) || (!explicit && !host && !relative) || (!explicit && /[\s@\\]/.test(value)))) { setLinkError(true); return; }
    const chain = editor.chain().command(({ tr }) => { closeHistory(tr); return true; });
    if (remove) chain.unsetLink().run(); else chain.setLink({ href }).run();
    editor.view.dispatch(closeHistory(editor.state.tr));
    setEditingLink(false);
    editor.view.focus();
  };
  useImperativeHandle(ref, () => ({ getMarkdown, setMarkdown }), [getMarkdown, setMarkdown]);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const linkShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const toolbarShortcut = event.altKey && event.key === "F10";
      if (!linkShortcut && !toolbarShortcut) return;
      const selection = window.getSelection();
      if (!editor.isEditable || !selection || selection.isCollapsed || !editor.view.dom.contains(selection.anchorNode)) return;
      event.preventDefault();
      // The browser can dispatch the shortcut before ProseMirror reads selectionchange.
      document.dispatchEvent(new Event("selectionchange"));
      requestAnimationFrame(() => {
        if (editor.isDestroyed) return;
        const element = bubbleRef.current;
        const { state, view } = editor;
        if (!element || !shouldShowFormatting({ editor, element, view, state, from: state.selection.from, to: state.selection.to })) return;
        // The menu's default debounce must not delay keyboard access.
        view.dispatch(state.tr.setMeta(bubbleKey, "show"));
        view.dispatch(view.state.tr.setMeta(bubbleKey, "updatePosition"));
      // Spec requirement (AC-5): the link shortcut opens URL editing.
        if (linkShortcut) openLink();
        else element.querySelector<HTMLButtonElement>("button")?.focus();
      });
    };
    editor.view.dom.addEventListener("keydown", onKeyDown);
    return () => editor.view.dom.removeEventListener("keydown", onKeyDown);
  }, [editor, openLink, bubbleKey]);

  // A click on the frame's own surface (padding or the empty space below short
  // content) lands outside the editor content; place the caret at the end there.
  // Clicks inside the content are handled by ProseMirror itself, so opaque blocks
  // keep their own click and selection behaviour.
  const handleFrameClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !editor) return;
    const target = event.target;
    if (target instanceof globalThis.Node && bubbleRef.current?.contains(target)) return;
    if (target instanceof globalThis.Node && editor.view.dom.contains(target)) return;
    focusAtEnd(editor);
  };

  return <div
    data-slot="markdown-editor"
    data-presentation={presentation}
    data-invalid={invalid || undefined}
    data-disabled={disabled || undefined}
    onClick={presentation === "field" ? handleFrameClick : undefined}
    className={cn(
      presentation === "in-place" && "min-w-0 data-disabled:pointer-events-none",
      presentation === "field" && cn(
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
      ),
    )}>
    <EditorContent editor={editor} />
    {editor && !readOnly && !disabled && <BubbleMenu ref={bubbleRef} pluginKey={bubbleKey} editor={editor} options={{ strategy: "fixed", placement: coarsePointer ? "bottom" : "top", onShow: () => { if (bubbleRef.current) bubbleRef.current.tabIndex = -1; } }} shouldShow={shouldShowFormatting}><div role="toolbar" aria-label="Formatting" data-slot="markdown-formatting-bubble" className="flex items-center rounded-control border bg-muted text-foreground border-[color-mix(in_oklch,var(--anaphor-input-border)_72%,var(--anaphor-background))] shadow-[var(--anaphor-shadow-menu)]" onKeyDownCapture={event => {
      if (event.key === "Escape") { event.preventDefault(); setEditingLink(false); editor.view.focus(); return; }
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
      const index = buttons.findIndex(button => button === document.activeElement);
      if (index < 0) return;
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === "ArrowRight" ? (index + 1) % buttons.length : event.key === "ArrowLeft" ? (index + buttons.length - 1) % buttons.length : -1;
      if (next >= 0) { event.preventDefault(); buttons[next]?.focus(); }
    }}>{editingLink ? <form onSubmit={event => { event.preventDefault(); finishLink(false); }}>
      <label id={`${errorId}-label`} htmlFor={`${errorId}-input`}>URL</label>
      <Input ref={inputRef} id={`${errorId}-input`} size="sm" aria-labelledby={`${errorId}-label`} value={url} onChange={event => { setUrl(event.target.value); setLinkError(false); }} aria-invalid={linkError || undefined} aria-describedby={linkError ? errorId : undefined} />
      {linkError && <span id={errorId}>Enter a safe URL.</span>}
      <Button nativeButton type="button" variant="ghost" tone="neutral" size="sm" shape="square" iconOnly={false} loading={false} onClick={() => finishLink(true)}>Remove link</Button>
    </form> : <FormattingButtons editor={editor} focused={focused} setFocused={setFocused} openLink={openLink} />}</div></BubbleMenu>}
  </div>;
}

export { MarkdownEditor, useMarkdownEditor, type MarkdownEditorHandle, type MarkdownEditorImageHandler, type MarkdownEditorProps, type UseMarkdownEditorOptions, type UseMarkdownEditorResult };
