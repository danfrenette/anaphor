# Manual navigation order

Keep Overview first, followed by Foundations, Controls, Content, and Navigation.
Alphabetize labels within each group. In-page sections follow the same sequence;
dedicated reference routes retain their links in the corresponding sorted group.
Manual search consumes the navigation data, so its group order stays aligned.

Run `pnpm exec playwright test e2e/manual-index-review.spec.ts e2e/sections.spec.ts --workers=2`.
Check desktop and mobile index navigation, direct links, breadcrumbs, drawer
dismissal, alphabetized lists, matching document order, and j/k/gg/Shift-G
navigation. Typography's in-page summary remains in the Foundations sequence;
its index destination continues to open the dedicated typography page.

## Final catalog consistency pass — 2026-10-18

Reviewed the catalog after `8c96916`. Overview remains first; labels are alphabetical
within Foundations, Controls, Content, and Navigation. The browser assertion now
compares every in-page section against the index, with only the legacy Principles
anchor retained beneath Overview. Dedicated routes keep their sorted index positions.
Shared titles, quiet example headings, spacing, code disclosures, and playground
controls remain consistent. Token reference now uses its navigation label as the
page title. Its disclosures and Typography's reading experiments use the shared
Collapsible instead of native details/summary.

The full run also exposed unnamed, pointer-only Pierre context-expansion controls.
Diff now gives those controls accessible names, keyboard activation, focus outlines,
and coarse-pointer targets. Enter and Space expansion are checked in both browsers.
Fresh registry installs now request the same Hotkeys ^0.10.0 range as the workspace;
unbounded resolution previously selected the incompatible 0.16 API.

Verification on macOS:

- `pnpm lint` and `pnpm typecheck`: passed.
- `pnpm test --maxWorkers=2`: 168 passed, one existing platform skip. The initial
  unrestricted concurrent run hit timeouts and was stopped; the bounded full run passed.
- `pnpm test:browser --workers=4`: 383 passed, 43 intentional skips, two WebKit
  motion failures. The catalog ordering, full-page accessibility, and new Diff
  keyboard checks passed in both projects.
- `pnpm test:browser e2e/hold-button.spec.ts e2e/playground.spec.ts --workers=2`:
  29 passed, one skip. The Hold early-release test now pauses and seeks the real
  CSS animation instead of racing a wall-clock delay. The existing surface-motion
  check passed unchanged at lower concurrency. This is a focused recheck, not a
  claim of an entirely green single full-suite invocation.
- `pnpm test:registry`: independent Button, Diff, and complete UI installs, builds,
  browser behavior, themes, and fonts passed with the final component changes.
- `pnpm build`: passed through the production browser harness builds.
- Updated macOS visual baselines were reviewed at desktop and 320px, in light/dark.
  Local Typography disclosure preview was inspected; Rail/Deck screenshots were
  captured in the preceding preview retry.

Linux visual baselines were not regenerated: Docker's daemon is unavailable locally.
The pinned Linux CI image remains the required environment for that follow-up; do
not copy macOS images to the Linux baseline paths. Private-tour database/provider
acceptance, physical touch, and dedicated screen-reader testing were not run.
Unrelated CODING_STANDARDS.md edits and the untracked lab route were preserved.
