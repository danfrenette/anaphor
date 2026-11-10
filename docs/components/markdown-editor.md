# Markdown editor

`MarkdownEditor` edits basic Markdown in a bounded field. It uses Tiptap 3 and the
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
accessible name. Tab enters and leaves the editor. The field uses the existing
input border, radius, surface, and focus treatment; body text keeps Prose's
size and reading styles.

## Supported Markdown and keyboard input

- Paragraphs, including Enter between blocks.
- Headings 1–6 through `# `…`###### ` and Mod-Alt-1…Mod-Alt-6.
- Bold through `**text**` and Mod-B.
- Italic through `*text*` or `_text_`, and Mod-I. Serialization uses `*text*`.
- Hard line breaks through Shift+Enter or Mod-Enter, serialized as two trailing
  spaces and a newline.
- Undo/redo history inherited from StarterKit; conversion-undo verification
  arrives with ANAPHOR-340.

The active extensions provide only document, paragraph, text, headings, bold,
italic, and hard breaks, plus undo/redo and Markdown conversion. HardBreak is
enabled specifically for in-paragraph line breaks; UndoRedo owns the required
editing history. Underline, lists, links, code, strike, blockquotes, horizontal
rules, and Tiptap's trailing node are disabled.

Tiptap runs with `immediatelyRender: false` and `injectCSS: false`. The
`anaphor-prose` class is applied directly to the ProseMirror root. The shared
stylesheet explicitly keeps source soft newlines in normal collapsed
whitespace and keeps `pre` content preformatted. Browsers preserve repeated
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

This slice does not support lists, quotations, code, links, strike, inline
code, unsupported-source preservation, paste handling, images, tasks, tables,
a selection bubble, in-place presentation, placeholder text, read-only or
disabled states, Field integration, or external `setContent`. Unsupported
Markdown must not be assumed to survive an edit.
