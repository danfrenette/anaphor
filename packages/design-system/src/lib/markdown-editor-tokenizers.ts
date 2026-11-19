import type { MarkdownToken } from "@tiptap/core";

const FRONT_MATTER_RE = /^---[ \t]*\r?\n(?:(?:---|\.\.\.)[ \t]*(?:\r?\n|$)|(?:[A-Za-z0-9_"'-][^:\r\n]*:|#)[^\r\n]*\r?\n(?:[^\r\n]*\r?\n)*?(?:---|\.\.\.)[ \t]*(?:\r?\n|$))/;

function splitFrontMatter(markdown: string): { frontMatter: string; body: string } {
  const match = FRONT_MATTER_RE.exec(markdown);
  return match
    ? { frontMatter: match[0], body: markdown.slice(match[0].length) }
    : { frontMatter: "", body: markdown };
}

const INLINE_HTML_RE = /^(?:<!--(?:-?>|[\s\S]*?(?:-->))|<\/[a-zA-Z][\w:-]*\s*>|<[a-zA-Z][\w-]*(?:\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?)*?\s*\/?>|<\?[\s\S]*?\?>|<![a-zA-Z]+\s[\s\S]*?>|<!\[CDATA\[[\s\S]*?\]\]>)/;

const FOOTNOTE_REF_RE = /^\[\^([^\]]+)\]/;

const FOOTNOTE_DEF_RE = /^\[\^[^\]]+\]:[ \t]*[^\n]*(?:\n[ \t]+[^\n]*)*/;

const ESM_IMPORT_RE = /^import\s+(?:type\s+)?[^"'\n]+\s+from\s+["']|^import\s*["']/;
const ESM_EXPORT_RE = /^export\s+(?:const|let|var|function|class|default|async|type|interface)\b|^export\s*[*{]/;

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

    const isSelfClosing = source[end - 2] === "/" && source[end - 1] === ">";
    if (tag[1] === tagName) {
      if (source[i + 1] === "/") depth -= 1;
      else if (!isSelfClosing) depth += 1;
    }
    if (depth === 0) return end;
    i = end;
  }
  return -1;
}

function matchMdxComponent(source: string): MarkdownToken | undefined {
  const open = /^<([A-Z][\w.-]*)/.exec(source);
  if (!open) return undefined;
  const tagName = open[1];
  if (!tagName) return undefined;

  const openEnd = skipTagEnd(source, open[0].length);
  if (openEnd === -1) return undefined;
  const isSelfClosing = source[openEnd - 2] === "/" && source[openEnd - 1] === ">";
  if (isSelfClosing) return { type: "opaqueBlock", raw: source.slice(0, openEnd) };

  const closeEnd = findMatchingClose(source, openEnd, tagName);
  if (closeEnd === -1) return undefined;
  return { type: "opaqueBlock", raw: source.slice(0, closeEnd) };
}

function matchOpaqueBlock(source: string): MarkdownToken | undefined {
  const component = matchMdxComponent(source);
  if (component) return component;

  const firstLine = /^[^\n]*/.exec(source)?.[0] ?? "";
  if (/^import\b/.test(firstLine) && ESM_IMPORT_RE.test(firstLine)) return { type: "opaqueBlock", raw: firstLine };
  if (/^export\b/.test(firstLine) && ESM_EXPORT_RE.test(firstLine)) return { type: "opaqueBlock", raw: firstLine };

  const footnote = FOOTNOTE_DEF_RE.exec(source);
  if (footnote) return { type: "opaqueBlock", raw: footnote[0] };
  return undefined;
}

function matchOpaqueInline(source: string): MarkdownToken | undefined {
  const html = INLINE_HTML_RE.exec(source);
  if (html) return { type: "opaqueInline", raw: html[0] };
  const footnote = FOOTNOTE_REF_RE.exec(source);
  if (footnote) return { type: "opaqueInline", raw: footnote[0] };
  return undefined;
}

export {
  ESM_EXPORT_RE,
  ESM_IMPORT_RE,
  FOOTNOTE_DEF_RE,
  FOOTNOTE_REF_RE,
  FRONT_MATTER_RE,
  INLINE_HTML_RE,
  findMatchingClose,
  matchMdxComponent,
  matchOpaqueBlock,
  matchOpaqueInline,
  skipJsxExpression,
  skipTagEnd,
  splitFrontMatter,
};
