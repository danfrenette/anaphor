# Diff reading

Run `pnpm test:browser e2e/diff.spec.ts` for Chromium and 320px WebKit coverage.
The command builds the production demo and serves it on port 3105.

At `/#diff`:

1. Verify reading controls and Copy share the file header.
   Focus the icon controls to read their tooltips. Use the complete-file playground. Switch unified/split using the alternative-view action at desktop width, toggle Wrap/Unwrap,
   and expand full context. Split is disabled on narrow surfaces; no page overflow.
2. Collapse and reopen a file using the keyboard. Verify the shared 200ms height transition, no duplicate collapsed divider, and zero duration with reduced motion. Hidden code must leave the focus order; header controls and Copy remain available. Copy new file from complete source and Copy patch from
   the excerpt; verify clipboard feedback and payload when permission is available.
3. Locate the guard. The original new-file line 20 is emphasized and scrolled into
   view without focus theft, with a visible explanation and Clear highlight action. No line is emphasized initially. Excerpt context is explicitly limited to the patch.
4. Review the visible File states examples. Check added/deleted code, both rename paths, and the
   binary-file explanation. No unavailable source is presented as an empty diff.
5. Review light/dark themes, 320px, 200% zoom, reduced motion, keyboard focus and
   touch targets. Check code selection excludes line numbers and diff markers.
6. Run an axe scan for the Diff section. Manually inspect the screenshots and code
   contrast; automated scanning does not replace screen-reader review.

`test-results/diff-*.png` holds browser evidence. Large-file virtualization and
physical touch/screen-reader acceptance remain separate from the initial checks.

## Initial implementation receipt — 2026-10-15

- `pnpm lint` and `pnpm typecheck`: passed.
- `pnpm test`: 164 passed, one existing platform-specific test skipped before the
  new Diff tests were added. The focused Diff suite subsequently passed all four
  tests (unavailable/malformed/binary source, keyboard collapse, forwarded ref,
  rename, and both clipboard payloads).
- `pnpm test:browser e2e/diff.spec.ts`: both Chromium and 320px WebKit passed;
  includes the production build, light/dark axe scans, layout/wrapping, keyboard
  collapse, full context, actual highlighted-line visibility after reveal, and
  file states. Desktop and narrow screenshots were visually inspected.
- `pnpm test:registry`: independent Button and Diff installation, build, browser
  interaction, theme tokens, and fonts passed. Complete UI failed in the existing
  `shortcut.ts:99` HotkeySequence type contract with freshly resolved dependencies.
  This prevents claiming the full registry release gate passed.
- Full unrelated browser regression suite, physical touch, dedicated screen-reader
  review, 200% browser zoom, and large-file performance acceptance were not run.

The working local preview uses port 3217 because other applications occupy the
usual preview ports. No pull request or deployment was created.

## Icon and disclosure refinement

Lint and strict types passed. Diff/Collapsible integration tests passed (11).
The focused browser recipes passed 15 checks; the existing WebKit native Find
case remains skipped. These runs include the production build, popover focus
return, icon actions, keyboard disclosure, both themes, reduced motion and narrow
layout. The help popover was visually inspected. Independent Button and Diff
registry consumers passed again; complete UI remains blocked by the existing
shortcut type error described above. The full unrelated browser suite was not run.

## Compact header and icon research

Reading controls now share the file header with Copy; the help button and separate
toolbar are removed. Official Octicons supply the three reading icons. Lint,
strict types, and the four Diff integration tests passed. Both focused browser
projects passed, including tooltip names, header controls, 320px reflow and
light/dark axe checks. The desktop header was visually inspected. Independent
Button and Diff registry consumers passed with the added Octicons dependency.

## Pierre icon trial

Unified and split now render the original glyphs from Pierre's public sprite;
wrapping remains Octicons and copying remains Phosphor. Lint, strict types, four
Diff integration tests and both focused browser projects passed. The mixed icon
header was visually inspected. Registry installation and unrelated browser tests
were not repeated for this icon-only change; dependencies are unchanged.

## Octicons copy trial

The header now uses Octicons Copy through shared CardCopyButton's optional icon
content. Its success checkmark and clipboard behavior are preserved. Lint, types,
four Diff integration tests and both Chromium/WebKit browser checks passed; the
header was visually inspected. Full registry and unrelated regression checks
were not repeated for this visual refinement.

## Animated disclosure and alternate actions

Diff now uses shared Collapsible timing and hides its inner divider when closed.
Only the alternative layout action is shown; Octicons Wrap/Unwrap reflect the
next action. The demo highlights line 20 only on request, labels that emphasis,
and lets the reader clear it. Reveal waits until Pierre applies selection.

Lint, strict types, and 11 Diff/Collapsible integration tests passed. Focused
Chromium and WebKit recipes passed 15 checks, with the existing native Find
WebKit case skipped. These cover collapsed height, divider, 200ms timing, reduced
motion, alternate actions, keyboard tooltips, revealed-line visibility, and
light/dark accessibility. The collapsed desktop header was visually inspected.
Independent Button and Diff registry consumers passed; full UI still fails on
the previously recorded shortcut type mismatch. Unrelated browser recipes were
not rerun.

## Catalog organization

At `/#diff`, verify Layouts, Line emphasis, File states, and Playground. Examples
use quiet same-size secondary headings and inline code disclosure without an extra
frame around the Diff surface. Added, Deleted, Renamed, and Unavailable examples
are visible without opening a parent disclosure.

The shared Controls panel changes layout, wrapping, context, reading controls, and
page-flow/bounded height. Header layout/wrap actions stay synchronized with it.
Reset controls restores defaults without changing the fixed comparison examples.

## Catalog cleanup receipt — 2026-10-17

The catalog now separates Layouts, Line emphasis, File states, and Playground.
The playground uses the shared Controls panel; comparisons retain fixed settings.
Pierre's inner code scrollers enter the keyboard focus order when wrapping is off
and receive the shared focus treatment. This fixes the narrow WebKit axe finding
exposed by the unwrapped comparison examples.

The standalone Diff registry install passed source installation, build, browser
interaction, theme, and font checks. The complete-UI registry run encountered an
unrelated `shortcut.ts:99` type error with its unversioned hotkeys dependency;
that broader registry check remains unresolved by this catalog change.

## Context-expansion accessibility

The final catalog pass checks unchanged-context expansion by Enter and Space in
Chromium and WebKit. Pierre's div-based controls receive an accessible name,
keyboard activation, a token-based focus outline, and 44px coarse-pointer targets.
The full-page axe scan includes the initially collapsed-context playground.

## E1 authored evidence notes and unchanged excerpts

Public contracts: `DiffNote`, `DiffAnnotations`, and the `unchanged` source branch
are documented in [Diff](../components/diff.md). The package owns presentation;
the consumer owns authored content, active note, reveal requests, and source identity.

Run `pnpm test packages/design-system/test/diff.test.tsx`, `pnpm typecheck`, and
`pnpm test:browser e2e/diff.spec.ts`. Registry distribution adds the Popover item;
`pnpm test:registry` exercises a real installed annotation popover, Escape/focus
return, and the existing copy/collapse/source rendering consumer.

1. In **Authored notes**, open the numbered guard title by keyboard. Its explanation
   is initially collapsed. Open the adjacent short note, dismiss with Escape, and
   confirm focus returns. The two notes sharing an anchor remain independently
   accessible. Follow the before-side note and verify original deleted code is emphasized.
2. Collapse the file. Focus **Locate 3: Keep the existing label** and press Enter.
   The file and previously hidden context open; line 8 is emphasized inside the
   280px viewport. Focus remains on the external button, the page does not scroll,
   and the inline explanation stays collapsed. Repeat requests remain usable.
3. **Unchanged excerpts** initially shows original lines 8–10 and 36. Expand the
   omitted context with Enter/Space. No changed-line markers are manufactured;
   the full file stays bounded, with the long line wrapping at narrow widths.
4. **Show unavailable source** retains all explanations and explicitly marks their
   missing targets. **Restore captured source** clears the consumer's active note
   and restores closed explanations. Inspect File states notes on added, deleted,
   renamed, and binary/unavailable sources. Integration tests cover a note outside
   supplied patch context and invalid excerpt bounds; neither is silently clamped.
5. Check both themes and 320px WebKit. The annotation recipe also uses 200% CSS
   layout zoom in a 640px viewport (320px effective width), reduced motion,
   keyboard focus, open popover axe scans, and captures the resulting surfaces.
   This zoom check is layout emulation, not a claim of browser-menu zoom or physical
   touch/screen-reader acceptance.

The E1 implementation run's scratch receipts are under
`/private/tmp/anaphor-evidence-delivery/`; final delivery records the exact revision
and integrated checks separately. Do not treat earlier receipts above as proof of E1.

The expanded annotation accessibility scan excludes only
`[data-base-ui-focus-guard]`. Base UI 1.9.0 deliberately assigns those visually
hidden sentinels `role="button"` on WebKit/VoiceOver to intercept its virtual cursor
(its `utils/FocusGuard` implementation); axe reports their missing command names.
All rules remain enabled for authored controls, code, and popup content. This is a
scoped scan limitation, not a substitute for dedicated VoiceOver acceptance.

Authored emphasis is source-side-specific. Verify that a before-side note does
not paint the adjacent after column in split view, and an after-side range in
unified view excludes interleaved deleted rows. The adapter uses Pierre's public
selection-side option and trims opposite-side unified row decorations after render.
