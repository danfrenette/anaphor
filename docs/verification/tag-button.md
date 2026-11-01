# Tag button

Visit `/#tag-button`. Activate Remove Research and Add Analysis with Enter,
Space and pointer input; confirm the assigned list changes and retained actions
keep focus. Inspect Methods to reveal its origin. Disabled and loading pills
must not activate; loading retains focus. Tag actions must not submit a form.

Run `pnpm exec playwright test e2e/tag-button.spec.ts e2e/manual-index-review.spec.ts --workers=2`
and `pnpm exec vitest run packages/design-system/test/tag-button.test.tsx`.
Run `pnpm typecheck` for the public configuration and ref fixtures.
Run `pnpm test:registry` for the complete-UI source install including TagButton.

Inspect light and Carbon themes at desktop and 320px, including keyboard focus,
long unbroken text, icons and contextual origin text. Check that compact
leading keeps multiline tags readable and font-edge trimming centers labels
without clipping descenders. Confirm no horizontal
overflow, coarse-pointer targets of at least 44px, and immediate reduced-motion
feedback. The component reuses Button's interaction and animation contract.
Screen-reader and physical touch acceptance remain manual checks.

## Local verification — 2026-10-31

- `pnpm lint`: passed; existing React Compiler warning in DataTable.
- `pnpm --recursive typecheck`: package and demo passed, including TagButton
  configuration, events, refs and state-aware className fixtures.
- `pnpm typecheck`: root check blocked by existing Buffer/BinaryLike errors in
  `e2e/local-tours.spec.ts`; no changes made to that fixture.
- `pnpm test --maxWorkers=2`: 235 passed, 6 skipped (47 files passed, 2 skipped).
- `pnpm build`: passed. The first browser harness build hit a sandbox port-binding
  error; the standalone build and subsequent production browser run passed.
- TagButton and manual-index browser recipes: 15 passed, one desktop-only
  mobile-navigation skip across Chromium and 320px WebKit. A focused recapture
  against the same production build passed all four TagButton tests again.
- `pnpm test:registry`: passed, including installation, compilation and rendering
  of TagButton in the complete-UI consumer. Independent TagButton-only installation
  was not added to the representative installation matrix.
- Light and Carbon viewport captures reviewed for desktop and mobile, with
  separate long-label views. Mechanical design scan returned no findings;
  independent finish review returned `ship`; documentation review found no drift.

Browser evidence is under `test-results/tag-button-*`. The running local demo
remains at `http://127.0.0.1:3002/#tag-button`. Full browser-suite regression,
Linux visual baselines, physical touch, dedicated screen-reader testing and
200% zoom acceptance were not run. This is local component verification, not
PR-ready or hosted CI evidence.

## Optical and wrapping refinement — 2026-11-01

TagButton now uses 1.25 label leading and progressively enhanced cap/baseline
text-box trimming instead of ButtonLabel's fixed upward offset. Shared Button
behavior and sizing are unchanged. In the local Chromium preview, the two-line
origin example decreased from 52px to about 38px; short targets stayed 28px.

- `pnpm exec playwright test e2e/tag-button.spec.ts --workers=2`: 4 passed in
  production Chromium and 320px WebKit, with a successful production build.
  The recipe checks wrapping, desktop multiline density, coarse-pointer target
  heights, keyboard actions/focus, loading/disabled semantics, light/dark axe and
  reduced motion. Desktop/mobile captures were visually inspected.
- Focused ESLint and `git diff --check`: passed.
- Existing root tour type errors, physical touch, dedicated screen-reader testing
  and older browsers without text-box support were not rechecked in this pass.
  The CSS fallback preserves wrapping with ordinary centered line boxes.

Long-label composition follow-up: the wrapping examples explicitly use `px-4`
(16px horizontal padding) to keep text clear of the rounded ends. Short tags
retain their approved compact geometry. Production Chromium/320px WebKit recipe
passed again (4 tests); desktop capture reviewed and diff whitespace check passed.
