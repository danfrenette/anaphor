import { isAllowedUri } from "@tiptap/extension-link";

function isSafePasteUri(uri: unknown): boolean {
  if (typeof uri !== "string") return false;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = uri.replace(/</g, "&lt;");
  return !!isAllowedUri(textarea.value.replace(/[\u0000-\u0020\u007f]/g, ""));
}

function normalizeLinkHref(href: string): string {
  if (!/[\u0000-\u0020\u007f<>\\"]/g.test(href)) return href;

  try {
    const url = new URL(href);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return url.href.replace(/\\/g, "%5C");
  } catch {
  }

  return href.replace(/[\u0000-\u0020\u007f<>\\"]/g, character => encodeURIComponent(character));
}

function escapeMarkdownTitle(title: string): string {
  return title.replace(/[\\"]/g, "\\$&");
}

export { escapeMarkdownTitle, isSafePasteUri, normalizeLinkHref };
