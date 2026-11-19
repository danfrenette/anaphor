import { Extension } from "@tiptap/core";
import type { JSONContent, MarkdownToken } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import { isSafePasteUri, normalizeLinkHref } from "#lib/markdown-editor-links";
import { splitFrontMatter } from "#lib/markdown-editor-tokenizers";

let pasteParseContext: { suppressedOrdinal: boolean; unsafeImage: boolean } | undefined;

const PasteOrdinal = Extension.create({
  name: "pasteOrdinal",
  markdownTokenName: "pasteOrdinal",
  parseMarkdown(token, helpers) {
    const content = helpers.parseChildren(token.tokens ?? []);
    const marker = helpers.createTextNode(token.marker);
    if (content[0]?.type === "paragraph") {
      content[0].content = [marker, ...(content[0].content ?? [])];
    } else {
      content.unshift(helpers.createNode("paragraph", undefined, [marker]));
    }
    return content;
  },
});

function suppressPastedOrdinal(source: string, token: MarkdownToken | undefined): MarkdownToken | undefined {
  const item = token?.items?.[0];
  const marker = item?.raw?.match(/^ {0,3}(\d{4,}[.)][ \t]+)/)?.[1];
  if (
    !pasteParseContext ||
    !marker ||
    !item?.raw ||
    !source.startsWith(item.raw)
  ) {
    return undefined;
  }

  pasteParseContext.suppressedOrdinal = true;
  return { type: "pasteOrdinal", raw: item.raw, tokens: item.tokens, marker };
}

function literalPastedImage(token: MarkdownToken): JSONContent | undefined {
  if (!pasteParseContext) return undefined;
  const src = token.href ?? "";
  if (/^https?:/i.test(src) && isSafePasteUri(src)) return undefined;
  pasteParseContext.unsafeImage = true;
  return { type: "text", text: token.raw };
}

function cleanPastedHtml(html: string): string {
  const pastedDocument = new DOMParser().parseFromString(html, "text/html");
  const keptAttributes = ["href", "data-type", "data-checked", "checked", "type", "start", "colspan", "rowspan"];

  for (const element of Array.from(pastedDocument.body.querySelectorAll("*"))) {
    if (element.matches("img")) {
      element.replaceWith(pastedDocument.createTextNode(element.getAttribute("alt") ?? ""));
      continue;
    }

    if (element.matches("form, button, input:not([type=checkbox]), textarea, select, iframe, script, style")) {
      element.replaceWith(pastedDocument.createTextNode(element.textContent ?? ""));
      continue;
    }

    if (element.matches('b[id^="docs-internal-guid-"]')) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    if (element.matches("a[href]") && !isSafePasteUri(element.getAttribute("href"))) {
      element.removeAttribute("href");
    }

    for (const attribute of Array.from(element.attributes)) {
      if (!keptAttributes.includes(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  return pastedDocument.body.innerHTML;
}

function containsMarkdown(node: JSONContent, source: string, hasBracketLink: boolean): boolean {
  if (node.type === "image") return true;
  if (node.type === "codeBlock") return /^ {0,3}(?:`{3,}|~{3,})/m.test(source);

  const markdownBlocks = ["heading", "bulletList", "orderedList", "blockquote", "table", "horizontalRule"];
  if (markdownBlocks.includes(node.type ?? "")) return true;

  const hasMarkdownMark = node.marks?.some(mark => (
    ["bold", "italic", "strike", "code"].includes(mark.type) ||
    (mark.type === "link" && hasBracketLink)
  ));
  if (hasMarkdownMark) return true;

  return node.content?.some(child => containsMarkdown(child, source, hasBracketLink)) ?? false;
}

function unsafePasteLink(node: JSONContent): string | undefined {
  const unsafeLink = node.marks?.find(mark => mark.type === "link" && !isSafePasteUri(mark.attrs?.href));
  const href = unsafeLink?.attrs?.href;
  return typeof href === "string" ? href : undefined;
}

function literalPasteNodes(node: JSONContent): JSONContent {
  if (node.type === "image") {
    const src = String(node.attrs?.src ?? "");
    if (!/^https?:/i.test(src) || !isSafePasteUri(src)) {
      return { type: "text", text: `![${node.attrs?.alt ?? ""}](${src})` };
    }
  }

  if (node.type === "opaqueInline") return { type: "text", text: node.attrs?.source ?? "" };

  if (node.type === "opaqueBlock") {
    const lines = String(node.attrs?.source ?? "").split("\n");
    return {
      type: "paragraph",
      attrs: { pasteLiteral: true },
      content: lines.flatMap((line, index) => [
        ...(index ? [{ type: "hardBreak" }] : []),
        ...(line ? [{ type: "text", text: line }] : []),
      ]),
    };
  }

  const content: JSONContent[] = [];
  let pendingHref: string | undefined;
  let pendingText = "";
  const flushPendingLink = () => {
    if (pendingHref) content.push({ type: "text", text: `[${pendingText}](${pendingHref})` });
    pendingHref = undefined;
    pendingText = "";
  };

  for (const child of node.content ?? []) {
    const href = unsafePasteLink(child);
    if (href && child.type === "text") {
      if (pendingHref !== href) flushPendingLink();
      pendingHref = href;
      pendingText += child.text ?? "";
    } else {
      flushPendingLink();
      content.push(literalPasteNodes(child));
    }
  }
  flushPendingLink();

  const unsafeLink = node.marks?.find(mark => mark.type === "link" && !isSafePasteUri(mark.attrs?.href));
  return {
    ...node,
    ...(unsafeLink && node.text ? { text: `[${node.text}](${unsafeLink.attrs?.href ?? ""})` } : {}),
    ...(node.marks ? { marks: node.marks.filter(mark => mark !== unsafeLink) } : {}),
    ...(node.content ? { content } : {}),
  };
}

function handleMarkdownPaste(view: EditorView, event: ClipboardEvent, editor: Editor | null): boolean {
  const text = event.clipboardData?.getData("text/plain");
  if (
    !text ||
    view.state.selection.$from.parent.type.spec.code ||
    !editor?.markdown
  ) {
    return false;
  }

  if (
    !view.state.selection.empty &&
    /^[a-z][a-z\d+.-]*:/i.test(text) &&
    URL.canParse(text) &&
    isSafePasteUri(text)
  ) {
    return editor
      .chain()
      .command(({ tr }) => {
        tr.setMeta("uiEvent", "paste");
        return true;
      })
      .setLink({ href: normalizeLinkHref(text) })
      .run();
  }

  if (event.clipboardData?.getData("text/html")) return false;

  const { frontMatter, body } = splitFrontMatter(text);

  const previous = pasteParseContext;
  const context = { suppressedOrdinal: false, unsafeImage: false };
  pasteParseContext = context;
  let parsedDocument: JSONContent;
  try {
    parsedDocument = editor.markdown.parse(body);
  } finally {
    pasteParseContext = previous;
  }

  if (
    !frontMatter &&
    !context.suppressedOrdinal &&
    !context.unsafeImage &&
    !containsMarkdown(parsedDocument, body, /\[[^\]\n]+\]/.test(body))
  ) {
    return false;
  }

  const literalDocument = literalPasteNodes(parsedDocument);
  const frontMatterNodes = frontMatter
    ? [literalPasteNodes({ type: "opaqueBlock", attrs: { source: frontMatter.replace(/\r?\n$/, "") } })]
    : [];
  const nodes = [...frontMatterNodes, ...(literalDocument.content ?? [])];
  const onlyNode = nodes.length === 1 ? nodes[0] : undefined;
  const insertion = onlyNode?.type === "paragraph" && !onlyNode.attrs?.pasteLiteral
    ? onlyNode.content ?? []
    : nodes;

  return editor
    .chain()
    .command(({ tr }) => {
      tr.setMeta("paste", true).setMeta("uiEvent", "paste");
      return true;
    })
    .insertContent(insertion)
    .run();
}

export { cleanPastedHtml, handleMarkdownPaste, literalPastedImage, PasteOrdinal, suppressPastedOrdinal };
