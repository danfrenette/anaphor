import { isAllowedUri } from "@tiptap/extension-link";
import { Extension } from "@tiptap/core";
import type { JSONContent, MarkdownToken } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import { splitFrontMatter } from "#lib/markdown-editor-tokenizers";

// Markdown parsing is synchronous; restore the context even if parsing fails or re-enters.
let pasteOrdinalContext: { suppressed: boolean; unsafeImage: boolean } | undefined;

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

// Spec requirement (AC-3): retain the first item's tokens while suppressing its list marker.
function suppressPastedOrdinal(source: string, token: MarkdownToken | undefined): MarkdownToken | undefined {
  const item = token?.items?.[0];
  const marker = item?.raw?.match(/^ {0,3}(\d{4,}[.)][ \t]+)/)?.[1];
  if (!pasteOrdinalContext || !marker || !item?.raw || !source.startsWith(item.raw)) return undefined;
  pasteOrdinalContext.suppressed = true;
  return { type: "pasteOrdinal", raw: item.raw, tokens: item.tokens, marker };
}

// Spec requirement (AC-1, AC-2): clipboard presentation is not document formatting.
function cleanPastedHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    if (element.matches("img")) {
      element.replaceWith(document.createTextNode(element.getAttribute("alt") ?? ""));
      continue;
    }
    if (element.matches("form, button, input:not([type=checkbox]), textarea, select, iframe, script, style")) {
      element.replaceWith(document.createTextNode(element.textContent ?? ""));
      continue;
    }
    if (element.matches('b[id^="docs-internal-guid-"]')) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    if (element.matches("a[href]") && !isSafePasteUri(element.getAttribute("href"))) element.removeAttribute("href");
    for (const attribute of Array.from(element.attributes)) {
      if (!["href", "data-type", "data-checked", "checked", "type", "start", "colspan", "rowspan"].includes(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return document.body.innerHTML;
}

// Spec requirement (AC-3, AC-5): detect syntax from the parsed paste, not a second lex.
function containsMarkdown(node: JSONContent, source: string, hasBracketLink: boolean): boolean {
  if (node.type === "image") return true;
  if (node.type === "codeBlock") return /^ {0,3}(?:`{3,}|~{3,})/m.test(source);
  if (["heading", "bulletList", "orderedList", "blockquote", "table", "horizontalRule"].includes(node.type ?? "")) return true;
  if (node.marks?.some(mark => ["bold", "italic", "strike", "code"].includes(mark.type) || (mark.type === "link" && hasBracketLink))) return true;
  return node.content?.some(child => containsMarkdown(child, source, hasBracketLink)) ?? false;
}

// Spec requirement (AC-4): validate destinations after HTML entity decoding.
function isSafePasteUri(uri: unknown): boolean {
  if (typeof uri !== "string") return false;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = uri.replace(/</g, "&lt;");
  return !!isAllowedUri(textarea.value.replace(/[\u0000-\u0020\u007f]/g, ""));
}

function literalPastedImage(token: MarkdownToken): JSONContent | undefined {
  if (!pasteOrdinalContext) return undefined;
  const src = token.href ?? "";
  if (/^https?:/i.test(src) && isSafePasteUri(src)) return undefined;
  pasteOrdinalContext.unsafeImage = true;
  return { type: "text", text: token.raw };
}

function unsafePasteLink(node: JSONContent): string | undefined {
  const href = node.marks?.find(mark => mark.type === "link" && !isSafePasteUri(mark.attrs?.href))?.attrs?.href;
  return typeof href === "string" ? href : undefined;
}

// Spec requirement (AC-4, AC-7): unsafe links and unsupported pasted syntax stay literal.
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
    return { type: "paragraph", attrs: { pasteLiteral: true }, content: lines.flatMap((line, index) => [
      ...(index ? [{ type: "hardBreak" }] : []),
      ...(line ? [{ type: "text", text: line }] : []),
    ]) };
  }
  const content: JSONContent[] = [];
  let pendingHref: string | undefined;
  let pendingText = "";
  const flush = () => {
    if (pendingHref) content.push({ type: "text", text: `[${pendingText}](${pendingHref})` });
    pendingHref = undefined;
    pendingText = "";
  };
  for (const child of node.content ?? []) {
    const href = unsafePasteLink(child);
    if (href && child.type === "text") {
      if (pendingHref !== href) flush();
      pendingHref = href;
      pendingText += child.text ?? "";
    } else {
      flush();
      content.push(literalPasteNodes(child));
    }
  }
  flush();
  const unsafeLink = node.marks?.find(mark => mark.type === "link" && !isSafePasteUri(mark.attrs?.href));
  return {
    ...node,
    ...(unsafeLink && node.text ? { text: `[${node.text}](${unsafeLink.attrs?.href ?? ""})` } : {}),
    ...(node.marks ? { marks: node.marks.filter(mark => mark !== unsafeLink) } : {}),
    ...(node.content ? { content } : {}),
  };
}

// Spec requirement (AC-1–5, AC-7): apply paste-only conversion and safety.
function handleMarkdownPaste(view: EditorView, event: ClipboardEvent, editor: Editor | null): boolean {
  const text = event.clipboardData?.getData("text/plain");
  if (!text || view.state.selection.$from.parent.type.spec.code || !editor?.markdown) return false;
  // Spec requirement (AC-4): a pasted URL links the selection, even with rich HTML.
  if (!view.state.selection.empty && /^[a-z][a-z\d+.-]*:/i.test(text) && URL.canParse(text) && isSafePasteUri(text)) {
    return editor.chain().command(({ tr }) => { tr.setMeta("uiEvent", "paste"); return true; }).setLink({ href: text }).run();
  }
  if (event.clipboardData?.getData("text/html")) return false;
  // Spec requirement (AC-3): a four-digit sentence is not an ordered list.
  const { frontMatter, body } = splitFrontMatter(text);
  const previous = pasteOrdinalContext;
  const context = { suppressed: false, unsafeImage: false };
  pasteOrdinalContext = context;
  let document: JSONContent;
  try {
    document = editor.markdown.parse(body);
  } finally {
    pasteOrdinalContext = previous;
  }
  if (!frontMatter && !context.suppressed && !context.unsafeImage && !containsMarkdown(document, body, /\[[^\]\n]+\]/.test(body))) return false;
  // Spec requirement (AC-7): pasted front matter and unsupported nodes are literal text.
  const parsed = literalPasteNodes(document);
  const prefix = frontMatter ? [literalPasteNodes({ type: "opaqueBlock", attrs: { source: frontMatter.replace(/\r?\n$/, "") } })] : [];
  const nodes = [...prefix, ...(parsed.content ?? [])];
  const only = nodes.length === 1 ? nodes[0] : undefined;
  const insertion = only?.type === "paragraph" && !only.attrs?.pasteLiteral ? only.content ?? [] : nodes;
  return editor.chain().command(({ tr }) => { tr.setMeta("paste", true).setMeta("uiEvent", "paste"); return true; }).insertContent(insertion).run();
}

export { cleanPastedHtml, handleMarkdownPaste, isSafePasteUri, literalPastedImage, PasteOrdinal, suppressPastedOrdinal };
