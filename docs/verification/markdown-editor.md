# Markdown editor

## Scope and entry

The public `MarkdownEditor` and `useMarkdownEditor` support basic Markdown in a
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
byte-stable pre-edit reads, mount versus real-edit callbacks, paragraphs, typed
and shortcut headings 1–6, bold and italic input, accessible labelling, and Tab
focus. Type fixtures in `packages/design-system/test/markdown-editor.types.tsx`
cover both exports and rejected consumer configurations. jsdom lacks pointer
hit testing and range layout, so the component file stubs only those geometry
APIs; real layout and editing remain browser-owned checks.

Playwright builds and serves the manual on port 3105 in desktop Chromium and
320px WebKit. Registry verification independently installs `markdown-editor`,
compiles it, and edits its rendered content. The editor is intentionally absent
from the complete-UI aggregate in this slice.

## Browser recipe

1. Open `/markdown-editor`. Confirm the starting heading, bold, italic, and
   soft-wrapped paragraph are formatted, and Current Markdown shows the supplied
   source. Check the Controls index and breadcrumb.
2. Type paragraphs and every heading trigger from `# ` through `###### `. Use
   Mod-Alt-1…6 as well. Type `**bold**`, `*italic*`, and `_italic_`; select text
   and use Mod-B/Mod-I. Confirm visible formatting and the emitted Markdown.
3. Replace the document with `Alpha  beta   gamma`. Confirm both whitespace
   groups remain visible and the output retains them. At Tiptap 3.33.0 the
   expected serializer output is `Alpha\u00a0 beta\u00a0 \u00a0gamma` in
   Chromium and `Alpha \u00a0beta \u00a0 gamma` in WebKit. The automated test
   also measures the rendered groups against one-space width and saves
   `consecutive-spaces.png` in each project's test-output directory.
4. Type `Alpha`, Shift+Enter, then `Beta`. Expect one visual line break and
   `Alpha  \nBeta` in Current Markdown. ProseMirror's iOS fallback drops Shift
   when it redispatches Enter, so mobile WebKit uses the equivalent Mod-Enter
   HardBreak shortcut; desktop Chromium verifies Shift+Enter.
5. At a wide viewport, compare the starting paragraph containing `This soft
   line` with its computed single-line height. Its source newline must not force
   another visual line. The editable `pre` rule remains `white-space: pre`; code
   editing itself belongs to a later slice.
6. Tab into and out of the named multiline textbox, check visible focus, and run
   the keyboard/axe browser case. Repeat in light/dark and at 320px. Confirm the
   browser console and `pageerror` capture contain no hydration warning or
   other error.

Keep Playwright output and screenshots under `test-results/` with the run
receipt. Stop only a server started for the verification run.

## Boundaries

The callback and pre-edit byte guarantee are component-test criteria. The hook
is exercised through the component rather than through internal editor calls.
Tests assert visible results and Markdown output, never Tiptap document JSON,
extension arrays, or private methods. Unsupported Markdown, additional blocks
and marks, paste, bubble/in-place presentations, form states, and external
content replacement are outside this recipe.
