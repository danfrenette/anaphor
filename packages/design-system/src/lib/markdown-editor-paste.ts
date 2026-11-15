import { isAllowedUri } from "@tiptap/extension-link";
import type { JSONContent } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import { splitFrontMatter } from "#lib/markdown-editor-tokenizers";

// Spec requirement: clipboard presentation is not document formatting.
function cleanPastedHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    if (element.matches("img")) {
      element.remove();
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
function containsMarkdown(node: JSONContent, source: string): boolean {
  if (node.type === "codeBlock") return /^ {0,3}(?:`{3,}|~{3,})/m.test(source);
  if (["heading", "bulletList", "orderedList", "blockquote", "table", "horizontalRule"].includes(node.type ?? "")) return true;
  if (node.marks?.some(mark => ["bold", "italic", "strike", "code"].includes(mark.type) || (mark.type === "link" && /\[[^\]\n]+\]/.test(source)))) return true;
  return node.content?.some(child => containsMarkdown(child, source)) ?? false;
}

// Spec requirement: opaque preservation is only for loaded documents, not paste.
function isSafePasteUri(uri: unknown): boolean {
  if (typeof uri !== "string") return false;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = uri.replace(/</g, "&lt;");
  return !!isAllowedUri(textarea.value.replace(/[\u0000-\u0020\u007f]/g, ""));
}

function unsafePasteLink(node: JSONContent): string | undefined {
  const href = node.marks?.find(mark => mark.type === "link" && !isSafePasteUri(mark.attrs?.href))?.attrs?.href;
  return typeof href === "string" ? href : undefined;
}

function literalPasteNodes(node: JSONContent): JSONContent {
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
  if (!view.state.selection.empty && /^[a-z][a-z\d+.-]*:/i.test(text) && URL.canParse(text) && isSafePasteUri(text)) {
    return editor.chain().command(({ tr }) => { tr.setMeta("uiEvent", "paste"); return true; }).setLink({ href: text }).run();
  }
  if (event.clipboardData?.getData("text/html")) return false;
  if (/^\d{4,}[.)] [^\n]+$/.test(text)) {
    view.dispatch(view.state.tr.insertText(text).setMeta("uiEvent", "paste").scrollIntoView());
    return true;
  }
  const { frontMatter, body } = splitFrontMatter(text);
  const document = editor.markdown.parse(body);
  if (!containsMarkdown(document, body)) return false;
  const parsed = literalPasteNodes(document);
  const prefix = frontMatter ? [literalPasteNodes({ type: "opaqueBlock", attrs: { source: frontMatter.replace(/\r?\n$/, "") } })] : [];
  const nodes = [...prefix, ...(parsed.content ?? [])];
  const only = nodes.length === 1 ? nodes[0] : undefined;
  const insertion = only?.type === "paragraph" && !only.attrs?.pasteLiteral ? only.content ?? [] : nodes;
  return editor.chain().command(({ tr }) => { tr.setMeta("paste", true).setMeta("uiEvent", "paste"); return true; }).insertContent(insertion).run();
}

export { cleanPastedHtml, handleMarkdownPaste };
