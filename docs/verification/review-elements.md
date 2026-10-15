# Review elements

## Outcome and entry points

A reviewer reads a problem, follows pinned code with authored range annotations,
inspects annotated screenshots and timestamped video, and expands execution details.
The owner makes the merge decision. `/review-elements` demonstrates synthetic
content; a locally imported tour demonstrates actual authored review content.

## Prerequisites and doctor

Follow [the development setup](../../README.md#development) and
[local tour setup](local-tours.md). Confirm the target checkout and revision,
HTTP readiness, browser hydration, and the selected tour revision. Use the existing
loopback server if it is running. No authentication or database is needed locally.

## Drive and assertions

Run `pnpm exec vitest run packages/design-system/test/code-review.test.tsx packages/design-system/test/annotated-media.test.tsx apps/demo/features/tours/reader.test.tsx apps/demo/features/tours/review-content.test.ts`.
Run `pnpm test:local-tours`, `pnpm test:registry`, and the repository release gate.
The local suite owns an isolated workspace and must not share a Next development
lock with another server in the checkout; stop/restart only the owned preview as needed.

With agent-browser 0.39.0, open `/review-elements`, then snapshot after hydration.
Inspect authored ranges and their original line numbers. Select a code line and
confirm the reader selection remains distinct from authored emphasis. Expand full
context; inspect unchanged, added, and removed source in component tests.
Enlarge the screenshot with the keyboard, close with Escape, and confirm focus
returns to the trigger. Select each labelled video moment: the playhead moves,
playback does not start automatically, and native controls remain usable.

Repeat at 320px, at 200% zoom, and in both themes. Check normalized callouts stay
on the same image location. Image outlines must be inset 1px black at 10% in light
mode and white at 10% in dark mode. Check focus and automated accessibility.

Open the real local-import section. Follow the six-step map, section anchors,
active location, and previous/next links. Open a supporting check: it must reach
one canonical execution record. Historical runs remain reachable through history.
Recorded result, applicability, and supersession remain separate. Inspect missing
assets and stale required checks using the local browser suite; their explanation
and merge concern stay readable. Update the bundle and confirm the open revision
changes only after Refresh tour. Failed refresh retains the selected revision.

## Evidence and cleanup

Keep command receipts, source revision/patch, screenshots, and temporal captures in
the persistent authoring workspace. Identify synthetic fixtures separately from
actual captures. Keep the final inspection receipt outside the tour if embedding
it would require another revision. Close the owned agent-browser session. Retain
the local preview server for owner review and report its port/worktree.
