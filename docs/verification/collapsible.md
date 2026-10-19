# Collapsible sections

Outcome: a reader can open and close independent and nested sections, and native
browser Find reveals matching content inside closed panels. Requirements: [ANAPHOR-227](https://linear.app/anaphor/issue/ANAPHOR-227/keep-long-source-outlines-navigable-with-collapsible-sections).

Entry points: `/#collapsible`, exported Collapsible parts, and the source registry's `collapsible`/`ui` items.
No account or external data is needed.

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

The browser recipe drives both Chromium and 320px WebKit at `/#collapsible`.
Reading notes starts open. Open Controlled section with Enter or Space, then use
“Close from inside” to restore visible focus to its trigger. Disabled and
canceled changes are covered through the exported public API. Rapid reversals
must settle without clipping visible content. Registry verification installs
real source into a fresh consumer, builds it, and exercises click and keyboard.

Keep per-run results and tested revisions in the verification receipt. Playwright
retains failure traces/screenshots in `test-results/`; capture evidence before a
subsequent run overwrites that directory. The harness stops its own server.
Registry success removes its temporary consumers; failure retains their path.
Reload resets these examples; persistence and tree navigation are not claims.


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

## Catalog controls

The section groups States, Nested sections, and Playground with inline code.
Use Collapsible Controls to change Open, Disabled, and Show caret. The Open
control reflects trigger changes and can still change application state when
the trigger is disabled. Reset closes the preview, enables the trigger, and
restores its caret. Show code follows the current configuration. The preview
reserves space while the disclosure itself expands naturally.

The catalog browser recipe covers these controls, reset, reduced motion, and
horizontal overflow on desktop and mobile. Demo-only layout changes do not
require reinstalling the unchanged source registry component.
