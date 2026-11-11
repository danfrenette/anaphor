"use client";

import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import { getListMarker, ListItem, OrderedList } from "@tiptap/extension-list";
import { Extension, Node } from "@tiptap/core";
import type { MarkdownRendererHelpers, MarkdownToken, RenderContext } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
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

/** Quiet mono chrome for opaque content; the attribute set in renderHTML opts out of Prose's article rules. */
const OPAQUE_BLOCK_CLASS = "my-4 whitespace-pre-wrap break-words rounded-control border border-border bg-muted px-2.5 py-1.5 font-mono text-small text-muted-foreground";
const OPAQUE_INLINE_CLASS = "font-mono text-[0.875em] text-muted-foreground";

/** A leading `--- … ---` block at the very start of the file, held out of sight and returned byte-for-byte. */
const FRONT_MATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n)?/;

function splitFrontMatter(markdown: string): { frontMatter: string; body: string } {
  const match = FRONT_MATTER_RE.exec(markdown);
  return match ? { frontMatter: match[0], body: markdown.slice(match[0].length) } : { frontMatter: "", body: markdown };
}

// Inline HTML is matched with the grammar marked's inline `tag` tokenizer uses,
// so an opaque span captures exactly what stock would otherwise fold into marks
// (e.g. `<b>`) or drop (e.g. `<img>`).
const INLINE_HTML_RE = /^(?:<!--(?:-?>|[\s\S]*?(?:-->))|<\/[a-zA-Z][\w:-]*\s*>|<[a-zA-Z][\w-]*(?:\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?)*?\s*\/?>|<\?[\s\S]*?\?>|<![a-zA-Z]+\s[\s\S]*?>|<!\[CDATA\[[\s\S]*?\]\]>)/;
const FOOTNOTE_REF_RE = /^\[\^([^\]]+)\]/;
// Footnote definitions can have indented continuation lines; keep the whole definition.
const FOOTNOTE_DEF_RE = /^\[\^[^\]]+\]:[ \t]*[^\n]*(?:\n[ \t]+[^\n]*)*/;
// Recognise ESM only when it is syntactically ESM so prose like "import the
// data from the CSV" or "export everything" stays a paragraph.
const ESM_IMPORT_RE = /^import\s+(?:type\s+)?[^"'\n]+\s+from\s+["']|^import\s*["']/;
const ESM_EXPORT_RE = /^export\s+(?:const|let|var|function|class|default|async|type|interface)\b|^export\s*[*{]/;

/** Skip a JSX `{…}` expression, honouring nested braces and quoted strings. Returns the index after the closing brace. */
function skipJsxExpression(source: string, start: number): number {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const character = source[i];
    if (character === '"' || character === "'") {
      const quote = character;
      i += 1;
      while (i < source.length && source[i] !== quote) i += 1;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return source.length;
}

/** Index just past a tag's `>` (or `/>`), skipping quoted values and `{…}`. Returns -1 when unclosed. */
function skipTagEnd(source: string, start: number): number {
  for (let i = start; i < source.length; i += 1) {
    const character = source[i];
    if (character === '"' || character === "'") {
      const quote = character;
      i += 1;
      while (i < source.length && source[i] !== quote) i += 1;
    } else if (character === "{") {
      i = skipJsxExpression(source, i) - 1;
    } else if (character === ">") {
      return i + 1;
    }
  }
  return -1;
}

/** Index just past the balanced `</tagName>` for the tag opened at `start`, or -1 when unclosed. */
function findMatchingClose(source: string, start: number, tagName: string): number {
  let depth = 1;
  let i = start;
  while (i < source.length) {
    if (source[i] !== "<") {
      i += 1;
      continue;
    }
    const tag = /^<\/?([A-Za-z][\w.-]*)/.exec(source.slice(i));
    if (!tag) {
      i += 1;
      continue;
    }
    const end = skipTagEnd(source, i + tag[0].length);
    if (end === -1) return -1;
    const selfClosing = source[end - 2] === "/" && source[end - 1] === ">";
    if (tag[1] === tagName) {
      if (source[i + 1] === "/") depth -= 1;
      else if (!selfClosing) depth += 1;
    }
    if (depth === 0) return end;
    i = end;
  }
  return -1;
}

/** A capitalised MDX component at the block start: self-closing, or opening tag through its balanced closing tag. */
function matchMdxComponent(source: string): MarkdownToken | undefined {
  const open = /^<([A-Z][\w.-]*)/.exec(source);
  if (!open) return undefined;
  const tagName = open[1];
  if (!tagName) return undefined;
  const openEnd = skipTagEnd(source, open[0].length);
  if (openEnd === -1) return undefined;
  const selfClosing = source[openEnd - 2] === "/" && source[openEnd - 1] === ">";
  if (selfClosing) return { type: "opaqueBlock", raw: source.slice(0, openEnd) };
  const closeEnd = findMatchingClose(source, openEnd, tagName);
  if (closeEnd === -1) return undefined;
  return { type: "opaqueBlock", raw: source.slice(0, closeEnd) };
}

/** Match an unsupported top-level construct: an MDX component, an ESM line, or a footnote definition. */
function matchOpaqueBlock(source: string): MarkdownToken | undefined {
  const component = matchMdxComponent(source);
  if (component) return component;
  const line = /^[^\n]*/.exec(source)?.[0] ?? "";
  if (/^import\b/.test(line) && ESM_IMPORT_RE.test(line)) return { type: "opaqueBlock", raw: line };
  if (/^export\b/.test(line) && ESM_EXPORT_RE.test(line)) return { type: "opaqueBlock", raw: line };
  const footnote = FOOTNOTE_DEF_RE.exec(source);
  if (footnote) return { type: "opaqueBlock", raw: footnote[0] };
  return undefined;
}

/** Match unsupported inline syntax at the cursor: inline HTML, or a footnote reference. */
function matchOpaqueInline(source: string): MarkdownToken | undefined {
  const html = INLINE_HTML_RE.exec(source);
  if (html) return { type: "opaqueInline", raw: html[0] };
  const footnote = FOOTNOTE_REF_RE.exec(source);
  if (footnote) return { type: "opaqueInline", raw: footnote[0] };
  return undefined;
}

/** Block content the editor does not interpret: raw HTML, comments, footnotes, ESM lines, MDX components. */
const OpaqueBlock = Node.create({
  name: "opaqueBlock",
  group: "block",
  atom: true,
  addAttributes: () => ({ source: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-opaque-block]", getAttrs: element => ({ source: element.textContent ?? "" }) }],
  renderHTML: ({ node }) => ["div", { "data-opaque-block": "", "data-prose-exclude": "", class: OPAQUE_BLOCK_CLASS }, node.attrs.source ?? ""],
  renderMarkdown: node => node.attrs?.source ?? "",
  markdownTokenName: "opaqueBlock",
  parseMarkdown: (token, helpers) => helpers.createNode("opaqueBlock", { source: (token.raw ?? "").replace(/\n+$/, "") }),
  markdownTokenizer: {
    name: "opaqueBlock",
    level: "block",
    start: () => -1,
    tokenize: source => matchOpaqueBlock(source),
  },
});

// Raw HTML blocks and comments already lex as marked `html` tokens; this
// handler turns them into opaque blocks instead of letting the stock HTML
// parser fold recognised tags and drop the rest. Inline HTML never reaches
// block parsing, so only block-level tokens arrive here.
const OpaqueHtmlBlock = Extension.create({
  name: "opaqueHtmlBlock",
  markdownTokenName: "html",
  parseMarkdown: (token, helpers) => helpers.createNode("opaqueBlock", { source: (token.raw ?? "").replace(/\n+$/, "") }),
});

/** Inline syntax the editor does not interpret: inline HTML and footnote references. */
const OpaqueInline = Node.create({
  name: "opaqueInline",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: () => ({ source: { default: "" } }),
  parseHTML: () => [{ tag: "span[data-opaque-inline]", getAttrs: element => ({ source: element.textContent ?? "" }) }],
  renderHTML: ({ node }) => ["span", { "data-opaque-inline": "", "data-prose-exclude": "", class: OPAQUE_INLINE_CLASS }, node.attrs.source ?? ""],
  renderMarkdown: node => node.attrs?.source ?? "",
  markdownTokenName: "opaqueInline",
  parseMarkdown: (token, helpers) => helpers.createNode("opaqueInline", { source: token.raw ?? "" }),
  markdownTokenizer: {
    name: "opaqueInline",
    level: "inline",
    // No start anchor: inlineText already stops before `<` and `[`, and deriving
    // a start by calling tokenize once corrupts marked's lexer state.
    start: () => -1,
    tokenize: source => matchOpaqueInline(source),
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
  const { frontMatter, body } = useMemo(() => splitFrontMatter(defaultValue), [defaultValue]);
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
      // Replaced below by an .extend()ed copy whose tokenizer reads a code fence
      // that opens an ordered item as a code block (workaround 13).
      orderedList: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }), MarkdownCodeBlock, MarkdownLink, MarkdownListItem, MarkdownOrderedList, OpaqueBlock, OpaqueHtmlBlock, OpaqueInline, Markdown],
    content: body,
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
      currentValue.current = frontMatter + editor.getMarkdown();
      onChangeRef.current?.(currentValue.current);
    };
    editor.on("update", onUpdate);
    return () => { editor.off("update", onUpdate); };
  }, [editor, frontMatter]);
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
