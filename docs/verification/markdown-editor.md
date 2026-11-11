# Markdown editor

## Scope and entry

The public `MarkdownEditor` and `useMarkdownEditor` support Markdown in a
field. The manual route is `/markdown-editor`, alphabetized under Controls.
`docs/components/markdown-editor.md` owns the public contract and this slice's
boundaries.

## Automated checks

Run:

```sh
pnpm exec vitest run packages/design-system/test/markdown-editor.test.tsx
pnpm typecheck
pnpm test:browser e2e/markdown-editor.spec.ts e2e/manual-index-review.spec.ts e2e/sections.spec.ts e2e/manual.spec.ts
pnpm test:registry
pnpm build
```

Component tests supply Markdown and use Testing Library/user-event. They cover
byte-stable pre-edit reads, mount versus real-edit callbacks, typed and
shortcut headings 1–6, bold and italic input, the typed triggers and shortcuts
for bullet and numbered lists, blockquote, fenced code blocks, horizontal
rules, strikethrough and inline code, a starting link round-trip, undo reverting
a conversion, Enter leaving lists/quotes/code, Backspace lifting, Tab nesting
and Shift+Tab un-nesting, undo/redo across typing and formatting, the absence
of underline and a trailing node, and a full-construct fixture. Type fixtures
in `packages/design-system/test/markdown-editor.types.tsx` cover both exports
and rejected consumer configurations. jsdom lacks pointer hit testing and
range layout, so the component file stubs only those geometry APIs; real
layout and editing remain browser-owned checks.

Playwright builds and serves the manual on port 3105 in desktop Chromium and
320px WebKit. Registry verification independently installs `markdown-editor`,
compiles it, and edits its rendered content. The editor is intentionally absent
from the complete-UI aggregate in this slice.

## Browser recipe

1. Open `/markdown-editor`. Confirm the starting heading, bold, italic,
   soft-wrapped paragraph, bullet and ordered lists with a nested item,
   blockquote, fenced `ts` code block, horizontal rule, strikethrough, inline
   code, and link are all formatted, and Current Markdown shows the supplied
   source. Check the Controls index and breadcrumb.
2. Type every trigger: `# ` through `###### `, `- ` and `* `, `1. `, `> `,
   `` ``` `` plus a space (and `` ```ts `` for a language), `---`, `~~x~~`,
   `` `x` ``, `**bold**`, and `*italic*`/`_italic_`. Use the Mod shortcuts for
   bold, italic, strikethrough, inline code, and headings 1–6. Confirm visible
   formatting and the emitted Markdown.
3. Type `- One`, Enter, `Two`, then Tab to nest and Shift+Tab to un-nest.
   Confirm the nested and flattened Markdown. On an empty list item or an empty
   quotation line, Enter leaves the block; Backspace at the start lifts it. In
   a code block, a single Enter inserts a newline and a triple Enter (or
   ArrowDown at the end) leaves it.
4. Type a trigger such as `- ` and undo once: the literal characters return,
   not the conversion. Undo and redo across typing and a bold formatting step.
5. Replace the document with `Alpha  beta   gamma`. Confirm both whitespace
   groups remain visible and the output retains them. At Tiptap 3.33.0 the
   expected serializer output is `Alpha\u00a0 beta\u00a0 \u00a0gamma` in
   Chromium and `Alpha \u00a0beta \u00a0 gamma` in WebKit. The automated test
   also measures the rendered groups against one-space width and saves
   `consecutive-spaces.png` in each project's test-output directory.
6. Type `Alpha`, Shift+Enter, then `Beta`. Expect one visual line break and
   `Alpha  \nBeta` in Current Markdown. ProseMirror's iOS fallback drops Shift
   when it redispatches Enter, so mobile WebKit uses the equivalent Mod-Enter
   HardBreak shortcut; desktop Chromium verifies Shift+Enter.
7. Replace the document with a fenced code block holding a long line. Confirm
   the editable `pre` keeps `white-space: pre` and scrolls horizontally instead
   of wrapping.
8. Tab into and out of the named multiline textbox, check visible focus, and
   run the keyboard/axe browser case. Repeat in light/dark and at 320px.
   Confirm the browser console and `pageerror` capture contain no hydration
   warning or other error.

Keep Playwright output and screenshots under `test-results/` with the run
receipt. Stop only a server started for the verification run.

## Boundaries

The callback and pre-edit byte guarantee are component-test criteria. The hook
is exercised through the component rather than through internal editor calls.
Tests assert visible results and Markdown output, never Tiptap document JSON,
extension arrays, or private methods. Tasks, tables, images, unsupported
Markdown, paste, bubble/in-place presentations, form states, and external
content replacement are outside this recipe.
