# Bottom bar catalog

The `/#bottom-bar` section presents Anatomy, Standalone/Integrated appearances,
and a Playground using the shared BottomBar parts. Help updates local guidance;
Search opens a local CommandPalette whose selection updates only that preview.

Run lint, typecheck, and
`pnpm exec playwright test e2e/bottom-bar-catalog.spec.ts --workers=2`.
The browser recipe covers command selection, focus return, independent state,
appearance/status/label controls, inline code, reset, and narrow containment.

Inspect both appearances and the playground in the local preview. At narrow
container widths, labels hide while the named actions remain available; status
truncates before action groups collide. The previews remain in document flow.
The shared BottomBar implementation and fixed manual utilities are unchanged.
