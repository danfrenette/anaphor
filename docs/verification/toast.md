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
