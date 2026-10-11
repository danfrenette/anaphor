# Collapsible sections and source outline

Outcome: a reader can collapse irrelevant chapters without changing the selected
section. Requirements: [ANAPHOR-227](https://linear.app/anaphor/issue/ANAPHOR-227/keep-long-source-outlines-navigable-with-collapsible-sections).

Entry points: `/#collapsible`, the Source outline after the Sidebar's manual
index, exported Collapsible parts, and the source registry's `collapsible`/`ui` items.
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

The browser recipe drives both Chromium and 320px WebKit. Open the mobile Sidebar
with “Open sidebar.” Within Source outline, check chapter 1 expanded, 1.1 selected,
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

Keep per-run results and tested revisions in the delivery walkthrough. Playwright
retains failure traces/screenshots in `test-results/`; capture evidence before a
subsequent run overwrites that directory. The harness stops its own server.
Registry success removes its temporary consumers; failure retains their path.
Reload resets this example; persistent selection and tree navigation are not claims.
