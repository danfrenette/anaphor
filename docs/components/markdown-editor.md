# Markdown editor

`MarkdownEditor` edits Markdown in a bounded field. It uses Tiptap 3 and the
official `@tiptap/markdown` extension, pinned at 3.33.0. Content uses the same
`anaphor-prose` styling as rendered Markdown; there is no toolbar or selection
bubble in this slice.

## Consumer contract

Import the component, hook, and their types from `@anaphor/system`. Supply a
required `defaultValue` string and either `aria-label` or `aria-labelledby`.

```tsx
const editorRef = useRef<MarkdownEditorHandle>(null);
const [markdown, setMarkdown] = useState(startingMarkdown);

<MarkdownEditor presentation="field"
  ref={editorRef}
  defaultValue={startingMarkdown}
  onChange={setMarkdown}
  aria-label="Research note"
/>;

const current = editorRef.current?.getMarkdown();
```

The editor is uncontrolled. `defaultValue` supplies its starting document;
changing that prop does not replace the document. `onChange(markdown)` is
optional and runs after document edits, not on mount or selection changes. The
ref exposes `getMarkdown()` and `setMarkdown(markdown)`. Before the first edit
`getMarkdown()` returns `defaultValue` byte for byte; afterwards it returns the
serializer's current Markdown. After any edit, including one undone back to the
original content, it returns the serializer's normal form rather than the
original bytes. For example, a trailing newline is dropped. A controlled
`value` prop is not part of this slice.

`setMarkdown(markdown)` replaces the whole document from outside, for example
to load another note or discard edits. It runs the new value through the same
front-matter split and Markdown parse as the starting value, does **not** fire
`onChange`, and resets undo history, so Undo cannot return to the previous
document. Until the next real edit, `getMarkdown()` returns the replaced string
byte for byte — the same contract as `defaultValue`. Called before the editor
mounts, the replaced value wins on mount.

The remaining optional props compose for use inside Anaphor's field:

- `placeholder` — text shown when the editor is empty; it disappears on the
  first input.
- `readOnly` — typing does nothing, but the editor stays focusable, keeps
  `tabindex="0"`, and is announced with `aria-readonly="true"`, so text can
  still be selected and copied.
- `disabled` — the editor is removed from the tab order (`aria-disabled="true"`
  and no `tabindex`), ignores pointer clicks, and uses the input disabled
  background.
- `autoFocus` — focuses the editor on mount with the caret at the end.
- `invalid` — announces `aria-invalid="true"` and applies the input's invalid
  border.
- `id` and `aria-describedby` — pass through to the textbox for field
  association.

Both state props take effect after mount without remounting, and toggling them
never fires `onChange`.

```tsx
<Field orientation="vertical" invalid={invalid}>
  <FieldLabel id="note-label">Notes</FieldLabel>
  <MarkdownEditor presentation="field"
    ref={editorRef}
    defaultValue=""
    onChange={setMarkdown}
    aria-labelledby="note-label"
    aria-describedby="note-feedback"
    placeholder="Write a note…"
    readOnly={readOnly}
    disabled={disabled}
    invalid={invalid}
  />
  <FieldFeedback id="note-feedback" hint="Markdown is fine here." error="This note needs your attention." invalid={invalid} />
</Field>
```

`useMarkdownEditor(options)` accepts the same value, callback, state, and
labelling options. Its returned `editor` is only for mounting and frame
composition with Tiptap's `EditorContent`; read Markdown only through the
returned `getMarkdown()` and replace it through `setMarkdown()`.
`editor.getMarkdown()` is serializer-normalised even before the first edit and
does not provide the pre-edit byte guarantee. `MarkdownEditor` is the standard
field frame around that hook. Consumers exchange Markdown strings, not Tiptap
JSON or HTML.

The editable root has role `textbox`, `aria-multiline="true"`, and the supplied
accessible name. Inside a field, the label names it via `aria-labelledby` and
the description and error are associated via `aria-describedby`; the invalid
state is reflected with `aria-invalid` on the textbox and the input's invalid
border on the frame. Tab enters and leaves the editor outside lists; inside a
list item Tab nests and Shift+Tab un-nests. The field uses the existing input
border, radius, surface, and focus treatment; body text keeps Prose's size and
reading styles.

## Field box

The field starts small and grows with its content to a maximum, then scrolls.
The heights are exposed as CSS custom properties, tuned on the reference-manual
page:

- `--anaphor-markdown-editor-min-height: 6rem`
- `--anaphor-markdown-editor-max-height: 18rem`

A click anywhere inside the box places the caret; clicks in the padding or the
empty space below short content place it at the end. The placeholder is
rendered by Tiptap's Placeholder extension as a `::before` pseudo-element on
the empty paragraph, so Prose's article rules never match it; it inherits only
the paragraph's body metrics, keeping the empty editor exactly one Prose line
tall, and uses the muted foreground token.

## Supported Markdown and keyboard input

**Typed triggers**

| Construct | Type | Serialised as |
| --- | --- | --- |
| Heading 1–6 | `# `…`###### ` | `# `…`###### ` |
| Bullet list | `- ` or `* ` | `- ` (any marker normalises to `-`) |
| Numbered list | `1. ` | `1. ` |
| Blockquote | `> ` | `> ` |
| Fenced code block | `` ``` `` then a space (`` ```ts `` to set the language) | ```` ``` ```` fences with the info string |
| Horizontal rule | `---` | `---` |
| Strikethrough | `~~text~~` | `~~text~~` |
| Inline code | `` `text` `` | `` `text` `` |
| Bold | `**text**` | `**text**` |
| Italic | `*text*` or `_text_` | `*text*` |
| Hard line break | Shift+Enter or Mod-Enter | two trailing spaces and a newline |

**Keyboard shortcuts**

| Action | Shortcut |
| --- | --- |
| Bold | Mod-B |
| Italic | Mod-I |
| Strikethrough | Mod-Shift-S |
| Inline code | Mod-E |
| Heading 1–6 | Mod-Alt-1…Mod-Alt-6 |
| Undo / redo | Mod-Z / Mod-Shift-Z (or Mod-Y) |

**Blocks and history**

- Paragraphs, including Enter between blocks.
- Bullet and numbered lists, with nesting via Tab and un-nesting via Shift+Tab.
  Retyping a list marker (`1. ` or `- `) at the start of a new list item that
  Enter created leaves the marker as literal text (`1. a\n2. 1. b`). This is
  Tiptap's default; a test pins it so an upgrade that changes it is noticed.
  An ordered list item that has text before a fenced code block gains a leading
  space on the code content line on each save. This is a stock Tiptap 3.33.0
  tokenizer bug; a test pins it so an upgrade that changes it is noticed.
  An ordered list nested in an ordered list whose inner item opens with a fenced
  code block loses the code on save, exactly as stock Tiptap 3.33.0 does, because
  the code-first repair is top-level only; a test pins the output so an upgrade
  that changes it is noticed.
- Enter on an empty list item or empty quotation line leaves the block; at the
  end of a code block, Enter inserts a newline and a triple Enter (or ArrowDown
  at the end) leaves the block. Backspace at the start of a list item or
  quotation lifts it to a paragraph.
- One undo reverts a typed conversion to the literal characters; undo and redo
  span typing and formatting. After undoing a `> ` conversion the literal
  characters read back as `&gt; ` in the output: that is the serializer's
  existing entity normalisation, not a regression.
- Links render as links and are written back as links. They do not auto-link
  while typing or on paste, and clicking places the caret rather than opening
  the link. Rendered links carry Tiptap's default `target="_blank"`
  `rel="noopener noreferrer nofollow"`, but those attributes never appear in the
  written Markdown.

The active extensions are StarterKit minus underline, trailing node and drop
cursor, plus the Markdown extension and two opaque nodes. Gapcursor is enabled.
Document, paragraph, text, headings, bold, italic, strike, inline code, code
block, bullet and ordered lists (with list item and list keymap), blockquote,
horizontal rule, link, hard break, and undo/redo are enabled because each
corresponds to supported Markdown. Underline has no CommonMark source, the
trailing node appends an extra empty paragraph after a document ending in a
non-paragraph block, and the drop cursor is a drag affordance this field does
not need, so all three stay disabled.

Tiptap runs with `immediatelyRender: false` and `injectCSS: false`. The
`anaphor-prose` class is applied directly to the ProseMirror root. The shared
stylesheet explicitly keeps source soft newlines in normal collapsed
whitespace and keeps `pre` content preformatted (`white-space: pre`), so fenced
code never wraps and scrolls horizontally instead. Browsers preserve repeated
typed spaces with non-breaking spaces, so they remain visible without turning
a source soft newline into a forced visual break.

At 3.33.0, typing `Alpha  beta   gamma` serializes in Chromium as
`Alpha\u00a0 beta\u00a0 \u00a0gamma` and in WebKit as
`Alpha \u00a0beta \u00a0 gamma`. Both retain the two and three whitespace
positions. These exact outputs are pinned in browser verification so a Tiptap
upgrade makes whitespace changes visible.

## Preserving unsupported Markdown

Markdown the editor does not understand is kept exactly as written and never
dropped.

**Front matter.** A leading `---` … `---` (or `...`) block is split out before
parsing and prepended byte for byte on output. It is never shown and cannot be
edited. The first line must be `---`, and the block either closes right away
(empty front matter) or its first interior line is a YAML mapping key or a `#`
comment; from there it runs, blank lines included, to the first `---` (or
`...`) line. The blank line separating it from the body is the serializer's
normal form, so after an edit that separator may be normalised while the front
matter itself is untouched. A front-matter-only document with no trailing
newline gains one before the body on output so the closing delimiter is not
glued to typed text.

**Opaque blocks.** Raw HTML blocks, HTML comments, footnote definitions (with
indented continuation lines), MDX `import` and `export` lines, and capitalised
MDX components (self-closing, multi-line, and nested) are held in an atomic
opaque block that stores the original source and writes it back unchanged.
Each is shown as a quiet read-only block of its source in the mono face, with a
muted foreground and a subtle surface and border. It can be selected and
deleted as a whole; its text cannot be edited. A capitalised component is
matched through its balanced closing tag, so blank lines and nesting inside it
are preserved; an unclosed component falls back to stock behaviour, which
escapes the tag and drops a `>` that starts a line. Lowercase HTML blocks
follow CommonMark, so a blank line inside one splits it into separate opaque
blocks and paragraphs.

**Inline opaque spans.** Footnote references (`[^1]`) and inline HTML
(`<b>`, `<span>`, …) are preserved as inline atomic spans in the mono face with
a muted foreground. Footnote references are spans, not blocks, because they sit
inside a paragraph's text and must keep their position there; turning the whole
paragraph opaque would hide the surrounding editable prose. Inline HTML is
matched with the same grammar marked uses for its `html` tokens, so it is
preserved instead of being folded into marks (`<b>x</b>` stays `<b>x</b>`, not
`**x**`) or dropped (`<img>`).

**Inert rendering.** Opaque source is emitted as a text child only — never as
`innerHTML` and never parsed into live nodes — so `<script>`, `<img onerror>`,
and `javascript:` links inside preserved HTML create no elements and run
nothing. Parsing opaque nodes from HTML matches only the editor's own
`data-opaque-block` / `data-opaque-inline` markup, so arbitrary pasted HTML
cannot become an opaque node.

Blank-line separators between top-level blocks use the serializer's normal form
from slice 339, so two adjacent `import` lines gain a blank line between them
after an edit while each line's source stays byte-identical.

**Limitations.** These are known, mostly stock Tiptap 3.33.0 behaviours, each
pinned by a test so an upgrade that changes one is noticed:

- Entities in preserved content are re-encoded, for example `&nbsp;` becomes
  `&amp;nbsp;`.
- MDX fragments `<>…</>` are not preserved.
- TOML `+++` front matter is not recognised; only `---` and `...` delimiters
  are.
- Front matter is recognised only when its first interior line is a YAML
  mapping key or a `#` comment; a document that opens with a rule, a blank
  line, or prose is left in the body.
- Multi-line ESM is preserved line by line only, so a multi-line
  `export default function` gains a blank line between its lines.
- Text between inline tags is parsed as Markdown, per CommonMark, so it is not
  byte-identical.
- A component on an ordered-list continuation line drifts its indent on each
  save and eventually leaves the item; the same drift affects plain
  continuation text in stock 3.33.0.
- An unclosed multi-line component whose `>` starts a line loses that `>`.

## Registry and boundaries

The standalone `markdown-editor` registry item installs the component, shared
styles, utilities, and exact Tiptap 3.33.0 dependencies. It is also part of the
complete `ui` aggregate.

This slice does not support tasks, tables, images, paste handling, a selection
bubble, or the in-place presentation.
