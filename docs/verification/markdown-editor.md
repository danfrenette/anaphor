# Markdown editor

## Scope and entry

The public `MarkdownEditor` and `useMarkdownEditor` support Markdown in a
field and in place. The manual route is `/markdown-editor`, alphabetized under Controls.
`docs/components/markdown-editor.md` owns the public contract and this slice's
boundaries.

## Automated checks

Run:

```sh
pnpm exec vitest run packages/design-system/test/markdown-editor.test.tsx
pnpm exec vitest run packages/design-system/test/markdown-editor-paste*.test.tsx
npx tsc --noEmit -p tsconfig.json --typeRoots ./node_modules/@types
pnpm --recursive typecheck
pnpm test:browser e2e/markdown-editor.spec.ts e2e/manual-index-review.spec.ts e2e/sections.spec.ts e2e/manual.spec.ts
pnpm test:registry
pnpm build
```

Component tests supply Markdown and use Testing Library/user-event. They cover
byte-stable pre-edit reads, mount versus real-edit callbacks, typed and
shortcut headings 1–6, bold and italic input, the typed triggers and shortcuts
for bullet and numbered lists, blockquote, fenced code blocks, horizontal
rules, strikethrough and inline code, a starting link round-trip, undo reverting
a conversion, Enter and ArrowDown leaving lists/quotes/code, Backspace lifting,
Tab nesting and Shift+Tab un-nesting, undo/redo across typing and formatting,
the absence of underline and a trailing node, a full-construct fixture, and
serializer round-trips for code fences holding backticks, link destinations
needing angle brackets, and code blocks opening a list item. Preserved-content
tests cover front matter held byte for byte, opaque blocks for raw HTML,
comments, footnote definitions, MDX import and export, and self-closing,
multi-line and nested components, inline opaque spans for footnote references
and inline HTML, inert rendering of `<script>`, `<img onerror>` and
`javascript:` links, and a mixed fixture file. Field-presentation tests cover
the placeholder appearing, updating and disappearing, read-only and disabled states and
their accessible attributes, toggling state without firing `onChange`, autofocus
placing the caret at the end, field label/description association, invalid
reflection, focus removal on disable, retained handles after unmount, and `setMarkdown` replacing the document byte for byte, preserving
front matter, resetting undo history, and winning when called before mount. Type
fixtures in `packages/design-system/test/markdown-editor.types.tsx` cover both
exports, the new props, and rejected consumer configurations. jsdom lacks
pointer hit testing and range layout, so the component file stubs only those
geometry APIs; real layout, click-to-focus, and editing remain browser-owned
checks.

Playwright builds and serves the manual on port 3105 in desktop Chromium and
320px WebKit. Browser checks also exercise read-only autofocus, padding focus,
selection and copy, padding taps at three positions, gap-cursor typing after
final opaque and code blocks by pointer and keyboard, and computed Input/frame
state and surface parity in both themes. Chromium checks the native clipboard;
WebKit does not expose it to the test, which checks selection and an unprevented
copy event instead. Registry verification independently installs `markdown-editor`
and also includes it in the complete-UI aggregate; both compile and edit its
rendered content.

The in-place parity tests compare each block's relative top and height against
the same Markdown rendered by `marked` inside `Prose`, within 1px in both
themes, including individual task items and table rows. They also check the first and last margins, total height, soft breaks,
unwrapped code, and absence of field chrome. Screenshots cover both themes in
desktop Chromium and 320px WebKit; Linux baselines use the pinned image in
`TESTING.md`.

## In-place browser recipe

On `/markdown-editor`, compare the In-place comparison's editable and rendered
columns in light and dark themes, then at 320px. They should align block by
block, with no extra final line. In mixed task and ordinary lists, markers and
indentation should match, but vertical gaps at transitions are expected: Tiptap
splits the kinds into separate lists while Markdown keeps one list. Focus and edit the left column: only the caret
and selection should appear, without a field frame. Confirm the soft break stays
on one line. In the editable code block, type a long line and confirm it scrolls
rather than wrapping.

In both themes, Tab to the read-only in-place editor: its keyboard focus must
show the standard outline. Mouse focus on it must not show an outline, and
editable in-place focus must not show one. With the long code block present,
confirm editable code has no authored `tabindex`. Chromium may focus the
overflowing block on Tab as a browser default; WebKit skips it. Read-only code
blocks have `tabindex="0"` and Tab reaches them in both browsers. Rendered demo
code remains separately keyboard-focusable.

## Browser recipe

1. Open `/markdown-editor`. Confirm the starting heading, bold, italic,
   soft-wrapped paragraph, bullet and ordered lists with a nested item,
   blockquote, fenced `ts` code block, horizontal rule, strikethrough, inline
   code, and link are all formatted, and Current Markdown shows the supplied
   source. Check the Controls index and breadcrumb.
2. In Research note, select all and clear the content before each example. Type
   every trigger: `# ` through `###### `, `- ` and `* `, `1. `, `> `,
   `` ``` `` plus a space (and `` ```ts `` for a language), `---`, `~~x~~`,
   `` `x` ``, `**bold**`, and `*italic*`/`_italic_`. Use the Mod shortcuts for
   bold, italic, strikethrough, inline code, and headings 1–6. Confirm visible
   formatting and the emitted Markdown.
3. Type `- One`, Enter, `Two`, then Tab to nest and Shift+Tab to un-nest.
   Confirm the nested and flattened Markdown. On an empty list item or an empty
   quotation line, Enter leaves the block. For Backspace, type `- One` or
   `> One`, move the caret to the start of `One`, pause for the selection to
   settle, then press Backspace once: the block lifts to a paragraph. Browser
   automation must wait for ProseMirror's selection `$from.parentOffset` to be
   zero before pressing Backspace; DOM selection alone can update first. In a
   code block, a single Enter inserts a newline and a triple Enter (or
   ArrowDown at the end) leaves it.
4. Type a trigger such as `- ` and undo once: the literal characters return,
   not the conversion. Undo and redo across typing and a bold formatting step.
5. Select all text in the Research note textbox and type `Alpha  beta   gamma`. Confirm both whitespace
   groups remain visible and the output retains them. At Tiptap 3.33.0 the
   expected serializer output is `Alpha\u00a0 beta\u00a0 \u00a0gamma` in
   Chromium and `Alpha \u00a0beta \u00a0 gamma` in WebKit. The automated test
   also measures the rendered groups against one-space width and saves
   `consecutive-spaces.png` in each project's test-output directory.
6. Select all and clear Research note, then type `Alpha`, Shift+Enter, then
   `Beta`. Expect one visual line break and
   `Alpha  \nBeta` in Current Markdown. ProseMirror's iOS fallback drops Shift
   when it redispatches Enter, so mobile WebKit uses the equivalent Mod-Enter
   HardBreak shortcut; desktop Chromium verifies Shift+Enter.
7. Select all text in Research note and type a fenced code block holding a long line. Confirm
   the editable `pre` keeps `white-space: pre` and scrolls horizontally instead
   of wrapping.
8. Tab into and out of the named multiline textbox and check visible focus.
   Repeat in light/dark and at 320px. Open browser developer tools, reload, and
   check the console for hydration warnings or errors. The automated browser
   test separately runs axe and captures console and `pageerror` events.
9. On the "Existing post" example, confirm the front matter is hidden and the
   raw HTML, comment, footnote, MDX import and export, and components each
   appear as a quiet mono block. Click one and press Delete to remove the whole
   block. Check the emitted Markdown still opens with the original front
   matter.
10. On "Inside a field", confirm the empty editor shows the placeholder and that
    it disappears after typing. Confirm the label names the textbox and the
    description and error are associated by inspecting the textbox's accessible
    description in developer tools. Toggle the
    error and confirm `aria-invalid` and the danger border; toggle read-only
    and confirm typing stops while selection and copy still work; toggle
    disabled and confirm focus, interaction, and tab order are removed. Click
    the "Load another note" and "Discard edits" controls and confirm the
    document and displayed Markdown change; undo after a load does not restore
    the previous note. Component test `setMarkdown replaces the document and
    reads back byte for byte without firing onChange` checks the callback.
11. Compare the field's boundary, focus and invalid states with the input in
    both themes. With developer tools inspect the empty editor's line height and
    field height. Type multiple lines until the field stops growing, then confirm
    it scrolls. Inspect the initial and maximum heights (`6rem` and `18rem`).
    Click the padding or empty space below short content and type to confirm the
    caret is at the end. Load another note, drag across its heading to select
    text, then click the comment block and press Delete to remove it as a whole.
12. Type `[ ] Review` in an empty editor. Click the named checkbox and then
    focus it and press Space; verify the check state and output Markdown both
    toggle. Repeat with read-only and disabled states and confirm no change.
    Check a nested task and an ordinary list alongside tasks survive a round trip.
13. In Table editing, change a cell and confirm the other cells, alignment and
    dimensions remain unchanged in the Markdown. Tab forward and backward
    between cells; at the final and first cells, respectively, Tab and Shift+Tab
    leave the editor without adding a row. At 320px, check Wide table scrolls
    inside its box, the page does not overflow, and the rendered scroll region
    can receive keyboard focus. Compare checked, unchecked and nested tasks and
    table rows in both themes against rendered Markdown.
14. In an empty Notes editor, paste styled web content containing a heading,
    link, and bold text. Confirm the structure and marks remain, the page's
    colours and fonts do not, and one undo removes the whole paste. The
    Chromium clipboard smoke test exercises HTML from the actual clipboard;
    WebKit is skipped there because Playwright cannot grant clipboard access.
15. Paste Markdown including a heading, list, and a link; confirm formatting and
    emitted Markdown. Paste ordinary text, a four-space-indented line, and a
    bare URL. Confirm the first two remain text and the URL becomes a link.
    Paste a URL over selected text and confirm it links the selection. Paste
    Markdown syntax into a code block and confirm it remains literal. Repeat
    a paste with read-only and disabled toggled and confirm no edit occurs.
16. In Research note, paste or drop an image file and confirm the image and its
    blob address and filename alt text appear in Current Markdown. Undo once.
    Confirm HTML images paste only their alt text, while an explicit HTTPS
    Markdown image renders. Compare the landscape image and its surrounding
    spacing on both sides of In-place comparison in light and dark at desktop
    and 320px. Select the image with an arrow key and remove it with Delete or
    Backspace. Component tests cover rejection, mapping and non-editable states.
17. Select text in Notes by dragging, then with Shift+arrow. Confirm the bubble
    contains Bold, Italic, Strikethrough, Inline code and Link, with pressed
    states and matching Markdown after each action. Collapse the selection and
    confirm it hides. Check a code block, an opaque block, a selected image,
    table cells, read-only and disabled states do not expose formatting.
18. Select text, press Alt+F10, and navigate with the arrows, Home and End.
    Escape returns to the same selection. Press Cmd/Ctrl+K; apply a bare domain,
    edit and remove the link, and undo. Try `javascript:` and an entity-encoded
    protocol and confirm the inline error and unchanged Markdown. Check the
    open toolbar and URL field with axe in both themes.
19. Scroll a filled field and select text at both edges; confirm the bubble is
    not clipped. At 320px on a coarse pointer select text by touch and confirm
    the bubble is below it and controls are tappable. Emulate reduced motion
    and confirm the bubble appears without animation.

Keep Playwright output and screenshots under `test-results/` with the run
receipt. Stop only a server started for the verification run.

## Boundaries

The callback and pre-edit byte guarantee are component-test criteria. The hook
is exercised through the component rather than through internal editor calls.
Tests assert visible results and Markdown output, never Tiptap document JSON,
extension arrays, or private methods.
