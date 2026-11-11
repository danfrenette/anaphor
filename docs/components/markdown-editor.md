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

<MarkdownEditor
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
ref exposes `getMarkdown()`. Before the first edit it returns `defaultValue`
byte for byte; afterwards it returns the serializer's current Markdown. After
any edit, including one undone back to the original content, it returns the
serializer's normal form rather than the original bytes. For example, a
trailing newline is dropped. A controlled `value` prop and external content
replacement are not part of this slice.

`useMarkdownEditor(options)` accepts the same value, callback, and labelling
options. Its returned `editor` is only for mounting and frame composition with
Tiptap's `EditorContent`. Read Markdown only through the returned
`getMarkdown()`: `editor.getMarkdown()` is serializer-normalised even before
the first edit and does not provide the pre-edit byte guarantee.
`MarkdownEditor` is the standard field frame around that hook. Consumers
exchange Markdown strings, not Tiptap JSON or HTML.

The editable root has role `textbox`, `aria-multiline="true"`, and the supplied
accessible name. Tab enters and leaves the editor outside lists; inside a list
item Tab nests and Shift+Tab un-nests. The field uses the existing input
border, radius, surface, and focus treatment; body text keeps Prose's size and
reading styles.

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

The active extensions are StarterKit minus underline, trailing node, drop
cursor and gap cursor, plus the Markdown extension. Document, paragraph, text,
headings, bold, italic, strike, inline code, code block, bullet and ordered
lists (with list item and list keymap), blockquote, horizontal rule, link,
hard break, and undo/redo are enabled because each corresponds to supported
Markdown. Underline has no CommonMark source, the trailing node appends an
extra empty paragraph after a document ending in a non-paragraph block, and the
drop cursor and gap cursor are drag/click-caret affordances this field does not
need, so all four stay disabled.

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

## Registry and boundaries

The standalone `markdown-editor` registry item installs the component, shared
styles, utilities, and exact Tiptap 3.33.0 dependencies. It is not yet part of
the complete `ui` aggregate.

This slice does not support tasks, tables, images, unsupported-source
preservation, paste handling, a selection bubble, in-place presentation,
placeholder text, read-only or disabled states, Field integration, or external
`setContent`. Unsupported Markdown must not be assumed to survive an edit.
