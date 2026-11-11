import type { MarkdownToken } from "@tiptap/core";

// Pure, framework-free tokenizers for the Markdown the editor does not
// interpret. They run outside React and Tiptap so they are cheap to reason
// about and test in isolation; the node and extension definitions that consume
// them stay in the component file.

/** A leading `--- … ---` block at the very start of the file, held out of sight and returned byte-for-byte. */
const FRONT_MATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n)?/;

function splitFrontMatter(markdown: string): { frontMatter: string; body: string } {
  const match = FRONT_MATTER_RE.exec(markdown);
  return match ? { frontMatter: match[0], body: markdown.slice(match[0].length) } : { frontMatter: "", body: markdown };
}

// Mirrors marked@17.0.6's `rules.inline.tag`, reached through
// @tiptap/markdown@3.33.0, so an opaque span captures exactly what stock would
// otherwise fold into marks (e.g. `<b>`) or drop (e.g. `<img>`). Re-verify on
// a Tiptap or marked upgrade.
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
