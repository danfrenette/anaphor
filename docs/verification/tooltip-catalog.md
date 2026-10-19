# Tooltip catalog

The `/#tooltip` catalog presents Single tooltip, Instant group, and Playground
with inline code. Save and formatting actions are independent in each example.
Controls configure the playground example, side, alignment, offset, hover delay,
and group-only instant window. Reset restores only playground settings and actions.

Run `pnpm exec playwright test e2e/tooltip.spec.ts --workers=2`, the tooltip
component tests, lint, and typecheck. Browser coverage checks instant grouped
motion, keyboard focus and Escape, independent state, configuration code, and reset.
Hover-specific coverage is skipped on touch; controls and reset run on both engines.

In the local preview, hover the first formatting action and then its neighbor.
Confirm keyboard focus opens a hint immediately and Escape retains trigger focus.
Check the examples at narrow widths, and capture an open hint. The shared tooltip
surface, timing, reduced-motion handling, and public API are unchanged.
