import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import { getListMarker, ListItem, OrderedList } from "@tiptap/extension-list";
import { Table } from "@tiptap/extension-table";
import { Extension, Node } from "@tiptap/core";
import type { JSONContent, MarkdownRendererHelpers, MarkdownToken, RenderContext } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import { escapeMarkdownTitle, isSafePasteUri, normalizeLinkHref } from "#lib/markdown-editor-links";
import { literalPastedImage, suppressPastedOrdinal } from "#lib/markdown-editor-paste";
import { matchOpaqueBlock, matchOpaqueInline } from "#lib/markdown-editor-tokenizers";
import { cn } from "#lib/utils";

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
  const hasLinkedAtom = content.some(child =>
    (child.type === "image" || child.type === "opaqueInline") &&
    child.marks?.some(mark => mark.type === "link"),
  );
  if (!hasLinkedAtom) return undefined;

  let markdown = "";
  for (let i = 0; i < content.length;) {
    const link = content[i]?.marks?.find(mark => mark.type === "link");
    let end = i + 1;
    while (
      end < content.length &&
      JSON.stringify(content[end]?.marks?.find(mark => mark.type === "link")) === JSON.stringify(link)
    ) {
      end++;
    }

    const children = content.slice(i, end).map(child => ({
      ...child,
      marks: child.marks?.filter(mark => mark.type !== "link"),
    }));
    const text = helpers.renderChildren(children);
    if (link) {
      const href = link.attrs?.href ?? "";
      const destination = serializeLinkDestination(href);
      const title = escapeMarkdownTitle(link.attrs?.title ?? "");
      markdown += title ? `[${text}](${destination} "${title}")` : `[${text}](${destination})`;
    } else {
      markdown += text;
    }

    i = end;
  }

  return markdown;
}

const MarkdownStarterKit = StarterKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map(extension =>
      extension.name === "heading" ? extension.extend({
        // Tiptap 3.33.0 workaround: group links across inline images in headings.
        renderMarkdown(node, helpers, context) {
          const content = renderLinkedImages(node, helpers);
          return content === undefined
            ? this.parent?.(node, helpers, context) ?? ""
            : `${"#".repeat(Number(node.attrs?.level) || 1)} ${content}`;
        },
      })
      : extension.name !== "paragraph" ? extension
      : extension.extend({
        // Spec requirement (AC-7): serialize pasted unsupported blocks as literal text.
        addAttributes() {
          return {
            pasteLiteral: {
              default: false,
              parseHTML: () => false,
              renderHTML: () => ({}),
            },
          };
        },

        parseMarkdown(token, helpers) {
          // Spec requirement (AC-1, AC-2): an image-only paragraph stays a paragraph.
          if (token.tokens?.length === 1 && token.tokens[0]?.type === "image") {
            return helpers.createNode("paragraph", undefined, helpers.parseInline(token.tokens));
          }

          // Tiptap 3.33.0 workaround: preserve authored NBSP-only paragraphs anywhere;
          // stock serialization loses their visible gap on reparse, including #8719's
          // authored separator.
          if (
            token.tokens?.length === 1 &&
            token.tokens[0]?.type === "text" &&
            ["&nbsp;", "\u00a0"].includes(token.tokens[0].raw ?? "")
          ) {
            return helpers.createNode("paragraph", undefined, [{ type: "text", text: "\u00a0" }]);
          }

          return this.parent?.(token, helpers) ?? [];
        },

        renderMarkdown(node, helpers, context) {
          // Write an NBSP-only paragraph back as `&nbsp;` (see the workaround in parseMarkdown).
          if (
            node.content?.length === 1 &&
            node.content[0]?.type === "text" &&
            node.content[0].text === "\u00a0"
          ) {
            return "&nbsp;";
          }

          const markdown = renderLinkedImages(node, helpers) ?? this.parent?.(node, helpers, context) ?? "";

          // Tiptap 3.33.0 workaround: paragraph lines must not reparse as blocks.
          const paragraph = markdown
            .replace(/^(?: {4,}| {0,3}\t)[ \t]*/gm, indent => (
              [...indent].map(character => character === "\t" ? "&#9;" : "&#32;").join("")
            ))
            .replace(/^( {0,3})(\d+)([.)])(?=[ \t])/gm, "$1$2\\$3")
            .replace(/^( {0,3})([-+>])(?=[ \t])/gm, "$1\\$2")
            .replace(
              /^( {0,3})((?:#{1,6}(?=[ \t])|`{3,}|~{3,}|(?:[-*_][ \t]*){3,}$|={3,}[ \t]*$)[^\n]*)/gm,
              (line, indent: string, content: string) => {
                const fence = /^`{3,}/.exec(content)?.[0];
                if (
                  fence &&
                  [...content.slice(fence.length).matchAll(/`+/g)].some(run => run[0] === fence)
                ) {
                  return line;
                }
                return `${indent}\\${content}`;
              },
            );

          // Spec requirement (AC-7): keep pasted literal rules from becoming Markdown rules.
          return node.attrs?.pasteLiteral
            ? paragraph.replace(/^( {0,3})(?=-{3,}(?:\s|$))/gm, "$1\\")
            : paragraph;
        },
      }),
    );
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

// --- Tiptap 3.33.0 serializer workarounds ---
// Each override marked as a workaround corrects serialized-Markdown data loss
// without changing interaction behaviour. Each is minimal and pins a regression
// test in packages/design-system/test/markdown-editor.test.tsx. Overrides marked
// "Spec requirement" add the interaction the editor spec asks for.

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

const MarkdownCodeBlock = CodeBlock.extend({
  // Spec requirement: read-only code blocks must be keyboard-scrollable.
  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        props: {
          decorations(state) {
            const attributes = editor.options.editorProps.attributes;
            if (
              typeof attributes === "function" ||
              attributes?.["aria-readonly"] !== "true" ||
              attributes?.["aria-disabled"] === "true"
            ) {
              return null;
            }

            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name === "codeBlock") {
                decorations.push(Decoration.node(pos, pos + node.nodeSize, { tabindex: "0" }));
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },

  // Workaround F1: write a fence longer than the longest backtick run in the
  // content so a line of backticks inside the block cannot close the fence on
  // reload. The stock renderer writes a fixed ``` fence.
  renderMarkdown: (node, h) => {
    const language = node.attrs?.language || "";
    if (!node.content) return `\`\`\`${language}\n\n\`\`\``;

    const content = h.renderChildren(node.content);
    const fence = "`".repeat(codeFenceLength(content));
    return `${fence}${language}\n${content}\n${fence}`;
  },
});

// Spec requirement: ProseMirror's gap cursor treats textblocks as open unless
// their schema asks for a gap, so allow the default gap-cursor plugin to move
// past a code block.
const CodeBlockGapCursor = Extension.create({
  name: "codeBlockGapCursor",
  extendNodeSchema: extension => extension.name === "codeBlock" ? { createGapCursor: true } : {},
});

const MarkdownLink = Link.extend({
  // Tiptap 3.33.0 workaround: paste rules can create a non-normalized link mark.
  renderHTML(props) {
    const href = props.HTMLAttributes.href;
    return this.parent!({
      ...props,
      HTMLAttributes: {
        ...props.HTMLAttributes,
        href: isSafePasteUri(href) ? normalizeLinkHref(href) : href,
      },
    });
  },

  // Tiptap 3.33.0 workaround: normalize safe destinations parsed from HTML.
  addAttributes() {
    return {
      ...this.parent?.(),
      href: {
        default: null,
        parseHTML: element => {
          const href = element.getAttribute("href");
          return href && isSafePasteUri(href) ? normalizeLinkHref(href) : href;
        },
      },
    };
  },

  // Tiptap 3.33.0 workaround: applyMark skips inline image nodes.
  parseMarkdown: (token, helpers) => helpers.parseInline(token.tokens ?? []).map(node => ({
    ...node,
    marks: [
      ...(node.marks ?? []),
      {
        type: "link",
        attrs: {
          href: isSafePasteUri(token.href) ? normalizeLinkHref(token.href ?? "") : token.href,
          title: token.title || null,
        },
      },
    ],
  })),

  // Tiptap 3.33.0 workaround: serialize link destinations without syntax breakout.
  renderMarkdown: (node, h) => {
    const href = node.attrs?.href ?? "";
    const title = node.attrs?.title ?? "";
    const text = h.renderChildren(node);
    const destination = serializeLinkDestination(href);

    // Tiptap 3.33.0 workaround: escape title delimiters and backslashes.
    const escapedTitle = escapeMarkdownTitle(title);
    return title ? `[${text}](${destination} "${escapedTitle}")` : `[${text}](${destination})`;
  },
}).configure({
  openOnClick: false,
  autolink: false,
  // Spec requirement (AC-4): paste linking is handled by the safety-checked adapter.
  linkOnPaste: false,
});

// Tiptap 3.33.0 workaround: preserve delimiters in image alt text and destinations.
const MarkdownImage = Image.extend({
  parseMarkdown: (token, helpers) => {
    const literal = literalPastedImage(token);
    if (literal) return literal;

    // Tiptap 3.33.0 workaround: decode CommonMark escapes and entities in image alt text.
    const element = document.createElement("span");
    const alt = (token.text ?? "").replace(
      /\\([!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~])|&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#[0-9]{1,7}|#[xX][a-fA-F0-9]{1,6});/g,
      (match, escaped: string | undefined) => {
        if (escaped) return escaped;
        element.innerHTML = `<span data-entity="${match}"></span>`;
        return element.firstElementChild!.getAttribute("data-entity")!;
      },
    );
    return helpers.createNode("image", { src: token.href, title: token.title, alt });
  },

  renderMarkdown: node => {
    const src = node.attrs?.src ?? "";
    // Tiptap 3.33.0 workaround: preserve literal Markdown syntax in alt text.
    const alt = (node.attrs?.alt ?? "")
      .replace(/\s*[\r\n]\s*/g, " ")
      .replace(/&/g, "&amp;")
      .replace(/[\\`*_[\]<>~]/g, "\\$&");
    const title = escapeMarkdownTitle(node.attrs?.title ?? "");
    const destination = linkDestinationNeedsAngleBrackets(src) ? `<${src}>` : src;
    const image = title ? `![${alt}](${destination} "${title}")` : `![${alt}](${destination})`;

    // Tiptap 3.33.0 workaround: inline atom marks are not rendered by the serializer.
    const link = node.marks?.find(mark => mark.type === "link");
    if (!link) return image;

    const href = link.attrs?.href ?? "";
    const linkDestination = serializeLinkDestination(href);
    const linkTitle = escapeMarkdownTitle(link.attrs?.title ?? "");
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
function indentContinuationLine(
  line: string,
  prefix: string,
  h: MarkdownRendererHelpers,
  alignNestedToPrefix: boolean,
): string {
  if (!alignNestedToPrefix) return h.indent(line);

  const configured = h.indent("");
  const prefixWidth = columnWidth(prefix);
  return (columnWidth(configured) >= prefixWidth ? configured : " ".repeat(prefixWidth)) + line;
}

// Workaround F4: a code block that opens a list item must share the marker line.
// The stock renderer emits an empty "- " marker line before an indented fence,
// which re-parses outside the list item and drops the code. Every other shape
// goes to the stock renderer.
const MarkdownListItem = ListItem.extend({
  renderMarkdown(node, h, ctx) {
    const [first, second, ...rest] = node.content ?? [];
    if (
      first?.type !== "paragraph" ||
      first.content?.length ||
      second?.type !== "codeBlock"
    ) {
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
      const indented = childContent
        .split("\n")
        .map(line => (line ? indentLine(line) : indentLine("")))
        .join("\n");
      output += child.type === "paragraph" ? `\n\n${indented}` : `\n${indented}`;
    });

    return output;
  },
});

// Workaround 13: @tiptap/extension-list@3.33.0's ordered-list tokenizer reads a
// list item whose first content line is a code fence (e.g. `1. ```js`) as a
// paragraph holding the fence plus a closing-fence code block, so the code is
// lost on reload. Re-tokenise those items from their raw text so they parse to
// an empty leading paragraph plus the recovered blocks, matching the bullet path.
// After the recovered blocks only a nested list token is kept; every other item
// shape is left to the stock tokenizer.
const stockOrderedListTokenizer = OrderedList.config.markdownTokenizer!;

/**
 * True when `line` is a CommonMark fence opener: 0–3 spaces, then a run of 3+
 * backticks (or tildes) whose info string holds no fence character.
 */
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
        const firstParagraphLine = firstParagraphNewline === -1
          ? firstParagraphRaw
          : firstParagraphRaw.slice(0, firstParagraphNewline);
        if (!isFenceOpener(firstParagraphLine)) continue;
        if (second?.type !== "code") continue;

        const raw = item.raw ?? "";
        const newline = raw.indexOf("\n");
        const firstLine = newline === -1 ? raw : raw.slice(0, newline);
        const rest = newline === -1 ? "" : raw.slice(newline + 1);
        const content = firstLine.match(/^(\s*)(\S+?)([.)])\s+(.*)$/)?.[4];
        if (content === undefined) continue;

        const contentIndent = firstLine.length - content.length;
        const dedent = (line: string) => {
          const lineIndent = line.length - line.trimStart().length;
          return line.slice(Math.min(lineIndent, contentIndent));
        };
        const codeSource = [content, ...rest.split("\n").map(dedent)].join("\n");
        item.tokens = [
          { type: "paragraph", raw: "", text: "", tokens: [] },
          ...lexer.blockTokens(codeSource),
          ...trailing.filter(t => t.type === "list"),
        ];
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

// The inline span shares Prose code's size so it follows the same token.
const OPAQUE_INLINE_CLASS = cn(
  "font-mono text-muted-foreground",
  "text-[length:var(--text-prose-code)]",
);

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
function createOpaqueNode({
  name,
  group,
  inline,
  tag,
  dataAttribute,
  className,
  trimTrailingNewlines,
  match,
}: OpaqueNodeOptions): Node {
  return Node.create({
    name,
    group,
    inline,
    atom: true,
    addAttributes: () => ({ source: { default: "" } }),
    parseHTML: () => [
      {
        tag: `${tag}[${dataAttribute}]`,
        getAttrs: element => ({ source: element.textContent ?? "" }),
      },
    ],
    renderHTML: ({ node }) => [
      tag,
      { [dataAttribute]: "", "data-prose-exclude": "", class: className },
      node.attrs.source ?? "",
    ],
    renderMarkdown: node => node.attrs?.source ?? "",
    markdownTokenName: name,
    parseMarkdown: (token, helpers) => helpers.createNode(name, {
      source: trimTrailingNewlines ? (token.raw ?? "").replace(/\n+$/, "") : (token.raw ?? ""),
    }),
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
  parseMarkdown: (token, helpers) => helpers.createNode("opaqueBlock", {
    source: (token.raw ?? "").replace(/\n+$/, ""),
  }),
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

export {
  CodeBlockGapCursor,
  MarkdownCodeBlock,
  MarkdownImage,
  MarkdownLink,
  MarkdownListItem,
  MarkdownOrderedList,
  MarkdownStarterKit,
  MarkdownTable,
  OpaqueBlock,
  OpaqueHtmlTokens,
  OpaqueInline,
  PlaceholderText,
};
