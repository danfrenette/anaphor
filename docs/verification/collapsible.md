# Collapsible sections and source outline

Outcome: a reader can collapse irrelevant chapters without changing the selected
section, and native browser Find reveals matching content inside closed panels. Requirements: [ANAPHOR-227](https://linear.app/anaphor/issue/ANAPHOR-227/keep-long-source-outlines-navigable-with-collapsible-sections).

Entry points: `/#collapsible`, the Source outline at `/collapsible-playground`, exported Collapsible parts, and the source registry's `collapsible`/`ui` items.
No account or external data is needed. Initial state comes from the supplied wireframe.

Use [repository setup](../../README.md#development) and the
[shared browser procedure](README.md). Record `git rev-parse HEAD` and local changes
before execution. Playwright builds the current checkout and checks readiness on
port 3105; a successful build and response identify its owned target.

Run:

```sh
pnpm exec vitest run packages/design-system/test/collapsible.test.tsx
pnpm exec playwright test e2e/collapsible.spec.ts --workers=2
pnpm test:registry
```

The browser recipe drives both Chromium and 320px WebKit. Visit `/collapsible-playground`. Within Source outline, check chapter 1 expanded, 1.1 selected,
and other chapters collapsed. Open chapter 2 and its nested 2.1 disclosure;
chapter 1 stays open. Close/reopen chapter 1, select 1.2, and repeat: selection is
preserved. Enter and Space toggle; Tab skips hidden sections. In the standalone
example, “Close from inside” restores visible focus to “Controlled section.”
Disabled and canceled changes are covered through the exported public API.

Theme runs constrain the outline to 200px, check wrapping, reduced-motion timing,
and axe results, and capture `outline-light.png` / `outline-dark.png` under the
Playwright test output directory. Review those images for indentation, chevrons,
and selected treatment. Registry verification installs real source into a fresh
consumer, builds it, and exercises the disclosure by click and keyboard.

Keep per-run results and tested revisions in the verification receipt. Playwright
retains failure traces/screenshots in `test-results/`; capture evidence before a
subsequent run overwrites that directory. The harness stops its own server.
Registry success removes its temporary consumers; failure retains their path.
Reload resets this example; persistent selection and tree navigation are not claims.


For nested content, use the “Nested reading notes” group in the main example.
Open Field observations and Questions to revisit independently, close Chapter
notes and Reading journal, then search for “orchard notebook” with Ctrl+F (Cmd+F
on macOS). The matching panel and its ancestors should open without opening
Further reading. Closed panels remain out of Tab order. Repeat with the controlled
section using its inner text to confirm application-owned state accepts the reveal.

Automated coverage separates the native matching path from the event contract:
Chromium text-fragment navigation finds the phrase with all three levels closed;
Chromium and WebKit both dispatch the browser's `beforematch` event and assert
nested state and visibility. The event test does not establish native Find support
in WebKit. Browsers without `hidden="until-found"` support require manual expansion.
