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

## Linux follow-up — 2026-10-18

Completed the previously blocked Linux follow-up from committed revision
`b3c7b69f44e731df071d1924a9112fefe6ef8262`, with only the test corrections and
reviewed Linux baselines described below overlaid. Docker became available after
the macOS receipt above. The isolated checkout used Node 24.20.0, pnpm 10.33.0,
`CI=true`, and `mcr.microsoft.com/playwright:v1.63.0-noble` on Linux amd64
(image digest `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`).
The image ran under emulation on an arm64 Mac; the 47.4-minute full browser run
therefore does not establish the CI job's 30-minute runtime budget.

- Frozen workspace installation passed.
- The workflow's candidate-baseline command passed 18 tests. Reviewed the 44
  changed Linux PNGs at desktop and 320px in both themes, covering Badge,
  foundations, Typography, Button, Card, and the showcase. Two of the 46 candidate
  images were unchanged. The full browser run then compared these baselines
  without snapshot updates; all visual baseline checks passed.
- `pnpm test:browser`: 375 passed, 43 intentional skips, seven failures, and three
  tests passed on retry. Failures were four slider appearance comparisons,
  first desktop tooltip hover, mobile reduced-motion Hold, and mobile clipboard
  confirmation. Traces showed pre-hydration interaction/capture and transient
  states expiring during slow browser round trips. Tests now await hydration,
  pause the real Hold animation while asserting its state, and control clipboard
  confirmation time with Playwright's clock. Product behavior is unchanged.
- Focused recheck of Slider, Tooltip, Hold, clipboard, and the three retry cases:
  17 passed and one touch-hover skip; only the two clipboard tests failed because
  the initial test-clock pause targeted a time that had already elapsed. After
  correcting the clock to fixed installation/pause dates, the clipboard check
  passed in both projects (two passed, no retries). The original checkbox and
  radio accessibility retry cases passed without retries. This combined evidence
  is not a claim of a green single full-suite invocation after the test changes.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test --maxWorkers=2` passed serially:
  168 integration tests passed, with the existing native Keychain opt-in skip.
  An earlier integration attempt overlapped browser work and was stopped after
  contention-related timeouts; the complete serial rerun passed.
- `pnpm test:registry`: independent Button, Diff, and complete UI installations,
  builds, browser interaction, themes, and fonts passed.
- Disposable Postgres 17 migrations passed. Initial `pnpm test:tours` produced
  17 passes, three intentional skips, and two failures from an ambiguous manual
  heading after the new Card showcase added another “Anaphor” heading. Scoping
  the assertion to the level-one heading fixes the intended return-to-manual
  check. The entire rerun passed 19 tests with three intentional viewport skips,
  without retries, including real CLI publication/revocation, device decisions,
  fixed expiry, unauthorized access, and both fictional provider identities.
- Production builds passed through each public/private Playwright harness.
- Lint and strict types passed again after the final tour assertion change.
  The test corrections are committed separately as `c3eaee4`.

Full public failure evidence is retained in `/tmp/anaphor-linux-full-report` and
`/tmp/anaphor-linux-full-results`; final tour screenshots are retained in
`/tmp/anaphor-linux-tour-final-results`. Command logs use
`/tmp/anaphor-linux-*.log`. Only the task's two disposable containers and network
were removed after verification; Docker Desktop and the existing host dev server
were left running. Real OAuth/deployed-domain acceptance, native Keychain access,
physical touch, and dedicated screen-reader testing remain outside this run.
Unrelated CODING_STANDARDS.md edits and the untracked lab route were preserved.

## Full-run retry and targeted follow-up — 2026-10-19

Recreated an isolated committed-HEAD checkout at `3b2c02c` (including `c3eaee4`)
in the same pinned Linux amd64 image, Node 24.20.0 and pnpm 10.33.0. Frozen
installation and the production build passed. No host checkout was mounted, and
no snapshot updates or competing verification gates ran.

- The requested complete `pnpm test:browser` retry finished in 42.5 minutes:
  383 passed, 43 intentional skips, one failure, and one test passed on retry.
  All seven original failures passed on their first attempts. The remaining
  failure was mobile WebKit's combined light/dark Button contrast matrix exceeding
  its explicit 120-second overall test budget, on both attempts. It reported a
  timeout while operating the variant control, not a contrast violation.
- Commit `87a6db4` separates that existing matrix into light and dark tests.
  Every tone/variant combination, axe rule, and documented accent-solid exception
  is retained; each theme keeps the existing 120-second per-test limit.
- The surface-growth test passed on retry, but its trace showed the initial
  600ms sample window ending at heights 56px/57px before content growth occurred.
  The trace already had `data-hydrated=true` before evaluation, so hydration alone
  does not establish the cause. The final correction samples until the expanded
  height settles for three frames, bounded by ten seconds, while retaining the
  expanded-height, intermediate-frame, bottom-edge, identity, and closing checks.
- A subsequent 430-test full run was stopped during its initial desktop cases.
  The user explicitly changed scope to targeted mobile verification and requested
  no further full-suite run. That interrupted invocation is not a full-suite
  acceptance result; no clean full run is claimed for these final corrections.
- Final requested command:
  `pnpm test:browser e2e/manual.spec.ts e2e/playground.spec.ts --project=mobile-webkit --grep 'button color roles|one shell grows'`.
  All three tests passed without retries in 2.0 minutes. Each contrast theme took
  about 1.2 minutes; surface growth passed in 14.3 seconds. No snapshots changed.
- Final lint and strict type checking passed. The settled-growth correction is
  committed as `c2b91e7`; the theme split is in `87a6db4`.

The completed retry's evidence is retained in
`/tmp/anaphor-linux-final-attempt1-report` and
`/tmp/anaphor-linux-final-attempt1-results`, with output in
`/tmp/anaphor-linux-final-browser.log`. Final targeted evidence is in
`/tmp/anaphor-linux-final-mobile-report`,
`/tmp/anaphor-linux-final-mobile-results`, and
`/tmp/anaphor-linux-final-mobile-targeted.log`. The interrupted full-run output is
`/tmp/anaphor-linux-final-browser-clean.log`. The task's isolated container was
removed after saving evidence. Docker Desktop, the existing host preview,
unrelated CODING_STANDARDS.md edits, and the untracked lab route were preserved.
