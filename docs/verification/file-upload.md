# File-upload selection and independent progress

Open `/#file-upload` in the reference manual. Use the shared **File upload controls** tab for scenarios and state inspection. Transfers and processing are simulated; picker selection uses real File objects. The example policy permits nonempty PDF, Markdown, or plain-text files up to 10 MB each.

1. Choose two valid files together. Both names and metadata appear; the native chooser permits multiple selection. Add another batch; earlier files stay in place. Drop files over a nested child of the drop surface and verify the same validation and append behavior.
2. Add a mixed valid/invalid batch. Valid siblings appear, rejected names have associated actionable feedback, and prior accepted files remain. Cancel the native picker and choose the same file again; dismissal preserves the list, and reselection reaches the callback.
3. Start the batch with the keyboard. Its initiating button retains focus through completion and blocks activation when no files are ready. Cancel one file: its selected File remains, focus returns to its upload action, and siblings continue. Add and upload another file while the first batch runs. Retry a failure without resetting other file rows. Remove a nonbusy row while scrolled into a long list. Focus moves to the next row’s upload action, or the previous row when removing the last row. When the list becomes empty, focus returns to Choose files. Focus handoffs suppress scrolling; shortening a list at its bottom may still clamp the scroll position naturally.
4. Inspect finishing and processing. Transferred bytes reach 100% before completion; processing has an indeterminate meter without a numerical value. Unknown-total transfer likewise has no fabricated percentage. A processing retry begins at processing in the simulator.
5. Inspect mixed states, long filenames, Light/Carbon, and a 390px viewport. Check no horizontal page overflow, wrapping filenames, available actions, and orange rails. Reduce motion: stage changes and measured progress become immediate and the unknown segment becomes static. Check forced colors and keyboard focus in the real browser.
6. Disable the uploader during a drag. Hover clears, the trigger and input become unavailable, and dropping files does not add rows. Drop a link or text inside the surface: no navigation and no selection callback. A disabled picker does not automatically cancel existing application jobs.
7. With a screen reader, check names and hint/error associations, independent named progress tasks, and polite stage announcements without byte-by-byte chatter.

Automated coverage lives in [the public-part tests](../../packages/design-system/test/file-upload.test.tsx), [the multi-file consumer tests](../../apps/demo/components/upload-example.test.tsx), and [production-browser regressions](../../e2e/file-upload.spec.ts). Run those plus package/demo type checks, ESLint, production build, and registry verification after changing the contract. DOM tests cover native-input callback behavior and synthetic drag events; they do not prove OS drag delivery, native-picker dismissal, or screen-reader announcement timing.

## Evidence — October 11, 2026

All 140 repository tests passed, along with package/demo TypeScript, repository ESLint, and a production Webpack build containing `/uploads`. The registry verifier installed the updated full UI registry, typechecked and built the fresh consumer, and passed its existing interaction/theme/font checks; the new file-upload source was included in that installation.

Browser checks on the working example covered real native multiple selection, append, per-file cancellation with focus restored while a sibling progressed, mixed states, Light/Carbon at 390px, long filename wrapping without visible text or page overflow, orange rail rendering, and unknown processing without a numerical value. The local reduced-motion control produced a static unknown segment and zero-duration transitions.

OS drag delivery, native-picker Escape dismissal, forced-colors rendering, physical coarse-pointer interaction, and a screen-reader run remain manual checks. Synthetic component tests cover nested drag depth, disabled/non-file drops, same-file callback reselection, and cancellation-event callback suppression. Production transfer, storage, and processing are outside this simulated example.

Polish follow-up: verify selected → uploading → processing → complete at a fixed viewport. The meter slot and action target stay reserved; progress/status changes must not move subsequent file rows. Check Remove/Cancel tooltips, exiting-row inertness, and keyboard focus return. Check Light’s soft shadow and Carbon’s white keyline, plus neutral focus and reduced-motion icon/row transitions.

Polish verification on October 11, 2026: all 141 tests passed, including a new focus test for Cancel disappearing when processing starts. Package/demo type checks, repository ESLint, the final production Webpack build, and registry generation passed. Browser checks confirmed a 176.5px long-file row in both selected and processing states at the same viewport, an indeterminate meter with no value, static reduced-motion progress, and no visible text/page overflow in the narrow Light/Carbon checks. Carbon computed a single white 9% surface ring. The shared controls panel opened and closed, and its scenario/state/reduced-motion controls drove the same example. The remaining OS/assistive-technology checks above still apply.

Removal/color follow-up: the five consumer tests, demo TypeScript, scoped ESLint, and production build passed. A native browser removal with visible neighbors kept the workspace scroll offset at 487.5px before and after, and moved focus to the next file’s upload action. The application suppresses focus scrolling and browser anchoring inside the changing upload subtree. Button state inspection confirmed accent for Add/Upload and danger for all Remove actions. Only the shared footer theme switcher remains.

Surface/layout follow-up: use the shared 390px canvas control in a wide window, then Mirror layout (RTL). Status/actions must stack according to the card width; the progress fill must begin at the reading-direction edge. Inspect all phases at a narrow width: an empty percentage slot reserves the same line as measured progress, and the long filename keeps its measure. Enabled actions use soft shadow edges, Carbon uses one white ring, and disabled controls have no lift. File groups use space; the footer retains a hairline divider. See the scoped findings and unverified coverage in the component document.

## Delivery review and checks — October 11, 2026

The upload branch was isolated from consumer-guidance work and rebased onto actual PR target `main`, revision `c4ee83300107f892da5af9ddea0be9014932a684`. Separate read-only Standards, Spec, and Principles reviewers assessed initial revision `428bd12a7b7c703caf34c0ed1c56890cefce6a0c`, then the corrections at `68a931e98790b26e63d38b78144cb044f76b6262`. The PR description records the final delivery head; later changes tighten browser assertions and this receipt without changing runtime behavior.

- **Standards:** replaced synthetic consumer clicks with user-event interactions and constrained the contrast exception to accent-solid controls. No unresolved findings after those corrections.
- **Spec:** retained the batch initiating button through completion and mirrored the RTL activity translations. Both corrections have production-browser regressions.
- **Principles:** reset only local drag state when disabled changes. The regression preserves an uncontrolled child's value, DOM identity, and focus. JavaScript/TypeScript, React/Next.js, and UI/motion profiles were assessed; no remaining actionable findings in the corrected runtime.
- **Execution:** component tests exercise candidate validation, append, independent cancellation/retry/removal, processing focus handoff, and retained batch focus. Browser checks establish real File selection, keyboard batch activation/completion, neighbor focus, RTL traversal, reduced motion, reflow, and axe checks.
- **Security:** filenames are rendered as React text; selection neither reads file content nor sends data to a sensitive operation. Picker hints do not provide validation; backend validation remains a documented consumer responsibility.
- **Concurrency:** the simulated run map isolates retries/cancellation/removal, keeps sibling runs intact, and cleans up its interval. No production transport or distributed ordering is claimed.
- **Performance:** source inspection covered linear candidate/list processing and the 100ms simulator tick. Consumer limits, transport concurrency, and large production queues remain application policy; no benchmark claim is made.
- **Migration:** not applicable; additive primitives introduce no persisted representation or existing-consumer API change.

Executed on the corrected source:

- Repository ESLint; root, package, and demo strict TypeScript: passed. The final browser-test edits also passed ESLint and root TypeScript.
- `vitest run --maxWorkers=2`: **144 tests passed across 31 files**. The unrestricted run timed out across 19 tests; limiting workers passed the same suite without extending timeouts.
- Production `next build --webpack`: passed, including `/uploads`.
- Production Playwright, original Chromium/WebKit project settings, upload regressions plus manual accessibility/skip-link smoke: **8 passed**. A temporary config served the already built Webpack output on port 3105.
- `scripts/verify-registry.mjs`: fresh independent Button and complete-UI installation, repeat installation, TypeScript/Vite build, and existing browser interaction/theme/font checks passed. File-upload source was included; standalone file-upload installation was not separately exercised.

The full browser suite is left to PR CI. Earlier visual inspection remains working-preview evidence rather than a committed visual baseline. The manual OS/assistive-technology, actual zoom, forced-colors, translated-label, physical touch, and high-DPI checks listed above remain unverified. The draft PR does not claim merge readiness or production upload integration.

## Manual integration and state refactor

The example now lives in the main component list at `/#file-upload`, between Skeleton and Input; `/uploads` is removed. Verify the manual index link, active section, and shared Controls/Code tabs. The supporting files remain in `app/uploads/` as demo modules, not a route.

`use-upload.ts` retains scenario/disabled settings and event handlers. The pure `upload-state.ts` reducer owns file lifecycle, feedback, IDs, and announcements. Each file carries its own optional simulation; inspected file and running status derive during rendering. The only effect subscribes to the external clock while simulations exist and cleans up the interval. Static state previews do not run; inspecting one file stops only that simulation. No state-synchronizing effect or mutable run map remains.

Baseline: `66eeaf1e1c5a69cb23a7a0ef117024c29882743c`. Initial follow-up source review: `5af889fd97edebd5af12b5fa31697960ce4731e9`. Separate Standards, Spec/Execution/Concurrency, and Principles passes found no refactor defects. A pre-existing delayed-tick limitation was corrected afterward: transfer-failure thresholds are checked before later phases, so a throttled tick cannot skip the selected failure scenario. The final refactor commit is recorded in the PR description.

Verification on the corrected source: **148 integration tests passed across 31 files**, including ten upload-consumer tests under Strict Mode. New regressions cover processing retry without reupload, static inspection while siblings run, reset/restart, and a delayed failure tick. Repository lint, strict types, and production Webpack build passed. The build no longer lists `/uploads`.

**Ten production-browser checks passed** in Chromium and 320px WebKit: manual-index navigation, active upload section, shared Controls and Code installation/usage, real multi-file selection, batch focus through completion, removal focus, RTL traversal/reduced motion, section accessibility/contrast, and manual accessibility/skip-link smoke. Native preview inspection also confirmed `Components / File upload` and both shared tabs.

No package component, stylesheet, export, registry item, or dependency changed in this follow-up; the previous successful registry-consumer evidence applies to the identical distributed source. The full browser suite remains a PR CI check. Existing manual accessibility/OS coverage limits above remain open.
