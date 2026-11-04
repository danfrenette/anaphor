# Toast

Run:

```sh
pnpm exec vitest run packages/design-system/test/toast.test.tsx
pnpm --recursive typecheck
pnpm exec playwright test e2e/toast.spec.ts e2e/manual-index-review.spec.ts --workers=2
pnpm test:registry
```

At `/#toast`, save successfully and simulate a failed save. Loading must update
in place; failure persists until dismissed. Archive, then Undo, and confirm the
note returns to the library. Create a burst; hover or F6 expands the stack,
pauses dismissal, and exposes all controls. Shift+Tab from the viewport returns focus. Swipe in the
viewport's outward directions. Confirm timeouts resume after leaving the stack.
Inspect light/Carbon at desktop and 320px, reduced motion, and coarse targets.
Test all six positions in a consumer and use a persistent toast for long copy.
Check keyboard creation, update, and dismissal from controls outside the viewport.
With reduced motion, verify no entry/content fade, spinner, or drag recovery runs.
During a recovery spring, grab the toast again, press F6, and toggle reduced motion;
each must continue from the current position or settle without stale inline styles.
Cancel a drag by losing pointer capture. Try a fast short outward flick, a slow
short drag, an inward reversal, and a two-finger drag where the second finger lifts
first. Only the primary pointer owns the gesture. Repeat vertically in centered
placements and outward on both sides at corners.
Screen-reader announcements and physical touch require manual acceptance.

## Earlier verification — 2026-11-03

These records precede the gesture and reduced-motion corrections below. Their
200ms reduced-motion fade policy is superseded.

- Package/demo type checks and public configuration/ref fixtures passed.
- Integration tests: 3 passed (update/action/dismiss, promise resolution and
  rejection, independent manager routing).
- Lint passed with the existing DataTable React Compiler warning.
- Source-registry verification passed, including complete-UI installation and
  compilation of Toast. The installed host renders in the consumer; the existing
  registry browser suite does not yet activate its new trigger. Toast-only
  installation was not separately exercised.
- Production build passed through the browser recipe. Manual-index tests:
  11 passed, one intentional desktop skip.
- Root TypeScript remains blocked by six pre-existing Buffer incompatibilities
  in `e2e/local-tours.spec.ts`; package/demo checks are clean.
- Automated accessibility excludes Base UI's focus sentinels, matching the
  existing Diff recipe. Base UI 1.9 emits unnamed `role="button"` sentinels on
  iOS; this remains an upstream accessibility limitation, not a clean full-tree
  audit. Physical touch and dedicated screen-reader acceptance are unrun.
- Full regression suite, Linux visual baselines, independent four-position
  review, timeout-pausing and swipe browser regressions were not run. No PR-ready
  or hosted CI claim is made.
- Final focused Chromium/WebKit run: 4 passed, covering async replacement,
  failed-save dismissal, Undo, F6/Shift+Tab focus, expanded-stack geometry,
  light/Carbon contrast (excluding upstream sentinels), reduced motion, and
  44px coarse-pointer dismissal targets. All four theme/device captures inspected.
- Mechanical design detector returned no findings. Diff whitespace check passed.
- Independent Impeccable finish review: `ship` for the bounded extension, with
  no material fixes. Reviewed expanded-stack screenshots only; collapsed motion,
  loading/error/action visuals and screen-reader behavior remain outside that
  visual review.


## Motion cleanup and placement settings — 2026-11-03

Position now supports top/bottom × left/center/right. The manual exposes these
in Toast controls, with Reset restoring top-right. Centered stacks dismiss
vertically; corner stacks also dismiss outward horizontally.

Keyboard focus and keyboard dismissal suppress transitions, including collapse
on leaving the viewport. Pointer travel is gated to fine hover devices, except
for explicit swipe exits. Reduced motion preserves a 200ms opacity fade and
stops the spinner. Swipe exit targets include the released displacement and
stack offset instead of returning toward a fixed destination.

Integration coverage now includes consumer viewport callbacks alongside the
motion policy. Browser coverage adds all-six-position alignment and Reset,
normal-motion keyboard expansion/collapse, coarse-pointer geometry policy,
and reduced-motion opacity. Existing root tour-type and iOS focus-sentinel
limitations still apply; full regression and physical touch remain unrun.

Cleanup verification: 4 integration tests passed; package/demo type checks and
lint passed (existing DataTable warning only). The Chromium/WebKit run passed
10 checks with one intentional mobile skip; the corrected long-swipe test then
passed separately in Chromium, for 11 passing checks in total. That test seeks
the real CSS transition endpoint and verifies it lies beyond the release point.
Production builds and the registry suite passed. Bottom-center desktop and
320px captures were inspected; copies are in `/tmp/anaphor-toast-position-review`.
Root type checking still reports only the existing six local-tour Buffer errors.


## Gesture and modality corrections — 2026-11-04

Independent Chromium reproductions confirmed animated keyboard calls from outside
the viewport, a reduced-motion fade, a short flick remaining open, second-touch
takeover, and cancellation snapping on a coarse pointer. The corrected wrapper
retains Base UI dragging and notification behavior, with primary-pointer guards,
recent outward flick velocity, and Motion spring recovery. Lost capture cancels;
re-grabbing preserves the visible transform. Keyboard input and live reduced-motion
changes cancel recovery and restore CSS ownership. Reusing a closing ID clears
flick state and does not replay an old recovery.

Browser regressions cover external keyboard callers, no animations during reduced
motion (including loading), short touch flicks and two-finger ownership via the
Chromium input protocol, recovery interruption, lost capture, and live preference
changes. Protocol touch is emulation, not physical-device proof. Existing six-position,
focus, async replacement, theme, narrow-layout, and long-swipe checks remain.

Final verification:

- `vitest run packages/design-system/test/toast.test.tsx`: 4 passed.
- `pnpm --recursive typecheck`: package and demo passed.
- `pnpm lint`: passed, with the existing DataTable React Compiler warning;
  focused ESLint passed again after the final gesture test changes.
- Root `tsc --noEmit`: blocked only by the six existing Buffer incompatibilities
  in `e2e/local-tours.spec.ts`; no Toast type errors remain.
- `pnpm exec playwright test e2e/toast.spec.ts e2e/manual-index-review.spec.ts
  --workers=2`: final production build passed; 26 checks passed and 4 intentional
  device-specific skips. This includes 15 Toast checks and 11 manual-index checks.
  Gesture recovery/interruption and short-flick ownership also passed three
  consecutive development-preview repetitions before final production verification.
- The coarse-touch flick test seeks its actual CSS transform transition and
  confirms the endpoint remains beyond the release position plus the toast width.
  Recovery tests pause the actual spring, grab its visible position, lose capture,
  press F6, and change reduced motion while recovery is active.
- `pnpm test:registry`: passed, including Toast compilation in the complete UI
  consumer and font/theme checks. Independent Toast-only installation and a registry
  browser activation of its trigger remain unrun.
- Desktop light, mobile Carbon, and bottom-center captures were visually inspected.
  Protocol touch remains emulation; physical touch and dedicated screen-reader
  acceptance remain unrun. The existing axe focus-sentinel exclusion remains.
- Full repository integration/browser suites, hosted CI, and Linux visual baselines
  were not run for this bounded correction. No PR-ready claim is made.
- `git diff --check`: passed.

## Adversarial PR review — 2026-11-04

Base and merge-base: `2476f4d78471d9c7f8f781f37528c05ba0c91e0e` (`origin/main`).
Initial reviewed head: `5f266ad98035586ea58bf1a6ea471bee1fd5d8c6`.
Affected re-review head: `7e18fc823e26e8cc70adc1287f4e11485fe438a4`.
Commits covered: `feat: add Base UI toast notifications with six placements`,
then `fix: close toast keyboard and gesture lifecycle gaps`. Earlier breadcrumb
and tag-button commits are already on main and are excluded from this branch.

Accepted requirements came directly from the user: a Sonner-inspired notification
system built on Base UI, six top/bottom × left/center/right settings, and animation
review/fixes under the installed Emil animations guidance. That latest guidance
requires static keyboard and reduced-motion feedback, interruptible gesture
recovery, transform/opacity motion, and faster exits. The component contract
supplies public configuration and lifecycle details.

Four separate read-only reviewers were dispatched with `fork_turns: "none"`:
Standards, Spec, Principles, and Execution/Concurrency/Performance. None inherited
builder conversation or another reviewer's verdict. Each received pinned source,
requirements, applicable repository standards and evidence locations. Reports
separate source inspection from supplied verification. Affected reviewers checked
the fix commit after the implementation owner reproduced and corrected findings.

| Axis | Initial findings | Disposition at re-review |
| --- | --- | --- |
| Standards | 1: F6 focused a viewport without a visible indicator | Act on; fixed with first-available-toast focus ring and regression |
| Spec | 2: keyboard loading still spun; docs overstated touch entry travel | Act on; static keyboard loading and accurate coarse-pointer documentation |
| Principles | 0 unique; independently found the Standards focus defect | Duplicate cross-reference, not counted twice; resolved |
| Execution / Concurrency | 2: held drag could dismiss a reused ID; recovery retained stale stack geometry | Act on; cancel old Base UI drag before reuse, retarget recovery and restore CSS ownership |
| Performance | 0 | No actionable issue for supported bounded stacks |

All five distinct findings are resolved; none were dismissed or deferred as
optional hardening. Security and Migration were not triggered: the change adds no
identity, sensitive-operation, persistence or rollout boundary. Existing upstream
focus-sentinel accessibility limits remain documented above.

Standards authority was the repository's CODING_STANDARDS router and its
Architecture, Design, prop-contract, Testing and Vocabulary references, plus
PRODUCT and scoped AGENTS instructions. Coverage included package/consumer and
registry boundaries, explicit props and composition, shared appearance, keyboard
and reduced motion, cancellation/cleanup, and observable tests. All applicable
rules were assessed; the twelve Fowler smell heuristics produced no additional
finding. Mechanical rules remain supported by executed checks rather than review
opinion.

Principles covered JavaScript/TypeScript, React/Next client boundaries, UI craft,
CSS/motion, tests, JSON distribution and public documentation. Applied profiles:
JavaScript/TypeScript, Frontend, UI craft, Motion and Refactoring UI, with their
installed tdd, Vercel React/composition, web-design-guidelines, Emil UI/motion,
layout/type/color/accessibility and writing references. No external aesthetic
preference displaced repository rules. The affected pass inspected Motion mini,
Base UI pointer cleanup, observer identity/disposal and regression design.

Execution traced add/update/close/promise, closing-ID reuse, primary pointer,
lost capture, interruption, stack geometry, keyboard/reduced-motion settlement,
and listener disposal through installed Base UI and Motion. Both concurrency
findings were reproduced by the implementation owner before correction. Reviewers
ran only read-only source commands; browser and test results below are verifier
evidence, not independent reviewer execution. Physical touch, dedicated screen
readers and perceived motion remain outside source-only review.

### PR verification results

- Before the review fixes, `pnpm test` passed 241 tests (6 skipped) across 49
  passing files (2 skipped). After the lifecycle correction, the focused Toast
  integration suite passed all 5 tests, including held-ID reuse.
- At `7e18fc8`, lint passed with the existing DataTable React Compiler warning;
  recursive package/demo types passed. Root `pnpm typecheck` still fails with the
  six existing Buffer type errors in unchanged `e2e/local-tours.spec.ts`.
- Fresh `pnpm test:registry` passed after the Motion mini change, including
  complete-UI source installation, compilation, theme/font and interaction checks.
- The full production browser run built the initial reviewed head and passed
  468 checks, skipped 48, and failed 6: Badge screenshots in Chromium/WebKit,
  Card screenshots in Chromium/WebKit, Showcase screenshot in Chromium, and
  WebKit MediaViewer caption-state persistence (expected disabled, got showing).
  These are outside Toast; they were not rerun against a clean main checkout and
  are not claimed proven baseline failures. Log: `/tmp/anaphor-toast-pr-browser.log`;
  failure evidence: `/tmp/anaphor-toast-pr-full-failures`.
- The final production build at `7e18fc8` passed. The combined Toast/manual-index
  recipe passed 30 checks, skipped 5, and failed the WebKit direct-Tabs active-link
  assertion. Within that run all 20 Toast checks passed, with 4 intentional
  device-specific skips. The same final Toast file also passed 20/4 in an isolated
  development-preview run. Log: `/tmp/anaphor-toast-pr-final-focused.log`.
- Physical-device touch, dedicated screen-reader acceptance, Linux visual baselines
  and hosted CI remain unrun. Existing focus-sentinel exclusions apply. Independent
  Toast-only registry installation is not part of the registry recipe.
- The PR remains draft because the complete release gate is not green. No merge-ready
  claim is made. Main was fetched again and remained `2476f4d`; it is an ancestor
  of the reviewed branch, so no integration conflict was present.
- The failed direct-Tabs WebKit check passed three isolated repetitions against
  the final production build. The initial failure is retained as intermittent
  navigation evidence, not silently replaced with a clean combined-run result.
  Log: `/tmp/anaphor-toast-pr-tabs-retry.log`.
