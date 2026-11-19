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

function serializeLinkDestination(href: string): string {
  return normalizeLinkHref(href).replace(/[()&]/g, "\\$&");
}

function renderLinkedImages(node: JSONContent, helpers: MarkdownRendererHelpers): string | undefined {
  const content = node.content ?? [];
  const hasLinkedAtom = content.some(child =>
    (child.type === "image" || child.type === "opaqueInline") &&
    child.marks?.some(mark => mark.type === "link"),
  );
  if (!hasLinkedAtom) return undefined;

  let markdown = "";
  for (let start = 0; start < content.length;) {
    const link = content[start]?.marks?.find(mark => mark.type === "link");
    let end = start + 1;
    while (
      end < content.length &&
      JSON.stringify(content[end]?.marks?.find(mark => mark.type === "link")) === JSON.stringify(link)
    ) {
      end++;
    }

    const children = content.slice(start, end).map(child => ({
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

    start = end;
  }

  return markdown;
}

const MarkdownStarterKit = StarterKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map(extension =>
      extension.name === "heading" ? extension.extend({
        renderMarkdown(node, helpers, context) {
          const content = renderLinkedImages(node, helpers);
          return content === undefined
            ? this.parent?.(node, helpers, context) ?? ""
            : `${"#".repeat(Number(node.attrs?.level) || 1)} ${content}`;
        },
      })
      : extension.name !== "paragraph" ? extension
      : extension.extend({
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
          if (token.tokens?.length === 1 && token.tokens[0]?.type === "image") {
            return helpers.createNode("paragraph", undefined, helpers.parseInline(token.tokens));
          }

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
          if (
            node.content?.length === 1 &&
            node.content[0]?.type === "text" &&
            node.content[0].text === "\u00a0"
          ) {
            return "&nbsp;";
          }

          const markdown = renderLinkedImages(node, helpers) ?? this.parent?.(node, helpers, context) ?? "";

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

          return node.attrs?.pasteLiteral
            ? paragraph.replace(/^( {0,3})(?=-{3,}(?:\s|$))/gm, "$1\\")
            : paragraph;
        },
      }),
    );
  },
});

const MarkdownTable = Table.extend({
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

  renderMarkdown(node, helpers, context) {
    const markdown = this.parent?.(node, helpers, context) ?? "";
    return context.previousNode?.type === "table" ? markdown.replace(/^\n/, "") : markdown;
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: () => this.editor.commands.goToNextCell(),
    };
  },
});

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

function codeFenceLength(text: string): number {
  return Math.max(3, longestBacktickRun(text) + 1);
}

const MarkdownCodeBlock = CodeBlock.extend({
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

  renderMarkdown: (node, helpers) => {
    const language = node.attrs?.language || "";
    if (!node.content) return `\`\`\`${language}\n\n\`\`\``;

    const content = helpers.renderChildren(node.content);
    const fence = "`".repeat(codeFenceLength(content));
    return `${fence}${language}\n${content}\n${fence}`;
  },
});

const CodeBlockGapCursor = Extension.create({
  name: "codeBlockGapCursor",
  extendNodeSchema: extension => extension.name === "codeBlock" ? { createGapCursor: true } : {},
});

const MarkdownLink = Link.extend({
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

  renderMarkdown: (node, helpers) => {
    const href = node.attrs?.href ?? "";
    const title = node.attrs?.title ?? "";
    const text = helpers.renderChildren(node);
    const destination = serializeLinkDestination(href);

    const escapedTitle = escapeMarkdownTitle(title);
    return title ? `[${text}](${destination} "${escapedTitle}")` : `[${text}](${destination})`;
  },
}).configure({
  openOnClick: false,
  autolink: false,
  linkOnPaste: false,
});

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

const MarkdownImage = Image.extend({
  parseMarkdown: (token, helpers) => {
    const literal = literalPastedImage(token);
    if (literal) return literal;

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
    const alt = (node.attrs?.alt ?? "")
      .replace(/\s*[\r\n]\s*/g, " ")
      .replace(/&/g, "&amp;")
      .replace(/[\\`*_[\]<>~]/g, "\\$&");
    const title = escapeMarkdownTitle(node.attrs?.title ?? "");
    const destination = linkDestinationNeedsAngleBrackets(src) ? `<${src}>` : src;
    const image = title ? `![${alt}](${destination} "${title}")` : `![${alt}](${destination})`;

    const link = node.marks?.find(mark => mark.type === "link");
    if (!link) return image;

    const href = link.attrs?.href ?? "";
    const linkDestination = serializeLinkDestination(href);
    const linkTitle = escapeMarkdownTitle(link.attrs?.title ?? "");
    return linkTitle ? `[${image}](${linkDestination} "${linkTitle}")` : `[${image}](${linkDestination})`;
  },
}).configure({ inline: true });

function columnWidth(text: string): number {
  let width = 0;
  for (const character of text) width = character === "\t" ? width + 4 - (width % 4) : width + 1;
  return width;
}

function listItemPrefix(context: RenderContext): string {
  if (context.parentType === "bulletList") return "- ";
  if (context.parentType === "orderedList") {
    const start = context.meta?.parentAttrs?.start || 1;
    return getListMarker(context.meta?.parentAttrs?.type, start - 1 + (context.index || 0), ". ");
  }
  return "- ";
}

function indentContinuationLine(
  line: string,
  prefix: string,
  helpers: MarkdownRendererHelpers,
  alignNestedToPrefix: boolean,
): string {
  if (!alignNestedToPrefix) return helpers.indent(line);

  const configured = helpers.indent("");
  const prefixWidth = columnWidth(prefix);
  return (columnWidth(configured) >= prefixWidth ? configured : " ".repeat(prefixWidth)) + line;
}

const MarkdownListItem = ListItem.extend({
  renderMarkdown(node, helpers, context) {
    const [first, second, ...rest] = node.content ?? [];
    if (
      first?.type !== "paragraph" ||
      first.content?.length ||
      second?.type !== "codeBlock"
    ) {
      return this.parent?.(node, helpers, context) ?? "";
    }

    const prefix = listItemPrefix(context);
    const alignNestedToPrefix = context.parentType === "orderedList";
    const indentLine = (line: string) => indentContinuationLine(line, prefix, helpers, alignNestedToPrefix);

    const codeContent = helpers.renderChild?.(second, 1) ?? helpers.renderChildren([second]);
    const codeLines = codeContent.split("\n");
    let output = prefix + codeLines[0];
    for (const line of codeLines.slice(1)) output += `\n${indentLine(line)}`;

    rest.forEach((child, index) => {
      const childContent = helpers.renderChild?.(child, index + 2) ?? helpers.renderChildren([child]);
      const indented = childContent
        .split("\n")
        .map(line => (line ? indentLine(line) : indentLine("")))
        .join("\n");
      output += child.type === "paragraph" ? `\n\n${indented}` : `\n${indented}`;
    });

    return output;
  },
});

function isFenceOpener(line: string): boolean {
  return /^( {0,3})(`{3,})([^`]*)$/.test(line) || /^( {0,3})(~{3,})([^~]*)$/.test(line);
}

const stockOrderedListTokenizer = OrderedList.config.markdownTokenizer!;

const MarkdownOrderedList = OrderedList.extend({
  markdownTokenizer: {
    name: "orderedList",
    level: "block",
    start: stockOrderedListTokenizer.start,
    tokenize: (source, tokens, lexer) => {
      const result = stockOrderedListTokenizer.tokenize(source, tokens, lexer);
      const pasteOrdinal = suppressPastedOrdinal(source, result || undefined);
      if (pasteOrdinal) return pasteOrdinal;

      const items = result?.items;
      if (!items) return result;

      for (const item of items) {
        const [firstToken, secondToken, ...trailingTokens] = item.tokens ?? [];

        if (firstToken?.type !== "paragraph") continue;
        const firstParagraphRaw = firstToken.raw ?? "";
        const firstParagraphNewline = firstParagraphRaw.indexOf("\n");
        const firstParagraphLine = firstParagraphNewline === -1
          ? firstParagraphRaw
          : firstParagraphRaw.slice(0, firstParagraphNewline);
        if (!isFenceOpener(firstParagraphLine)) continue;
        if (secondToken?.type !== "code") continue;

        const raw = item.raw ?? "";
        const newline = raw.indexOf("\n");
        const firstLine = newline === -1 ? raw : raw.slice(0, newline);
        const remainingLines = newline === -1 ? "" : raw.slice(newline + 1);
        const content = firstLine.match(/^(\s*)(\S+?)([.)])\s+(.*)$/)?.[4];
        if (content === undefined) continue;

        const contentIndent = firstLine.length - content.length;
        const dedent = (line: string) => {
          const lineIndent = line.length - line.trimStart().length;
          return line.slice(Math.min(lineIndent, contentIndent));
        };
        const codeSource = [content, ...remainingLines.split("\n").map(dedent)].join("\n");
        item.tokens = [
          { type: "paragraph", raw: "", text: "", tokens: [] },
          ...lexer.blockTokens(codeSource),
          ...trailingTokens.filter(token => token.type === "list"),
        ];
      }

      return result;
    },
  },
});

const OPAQUE_BLOCK_CLASS = cn(
  "my-4 whitespace-pre-wrap break-words",
  "rounded-control border border-border bg-muted px-2.5 py-1.5",
  "font-mono text-small text-muted-foreground",
);

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
  trimTrailingNewlines: boolean;
  match: (source: string) => MarkdownToken | undefined;
};

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
      start: () => -1,
      tokenize: source => match(source),
    },
  });
}

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

const OpaqueHtmlTokens = Extension.create({
  name: "opaqueHtmlTokens",
  markdownTokenName: "html",
  parseMarkdown: (token, helpers) => helpers.createNode("opaqueBlock", {
    source: (token.raw ?? "").replace(/\n+$/, ""),
  }),
});

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
