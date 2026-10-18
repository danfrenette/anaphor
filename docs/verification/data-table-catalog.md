# Data table catalog

Visit `/#data-table`. Table treatments compares borderless, horizontal rules,
and full grid with the same three project records. Density compares compact and
editorial padding. Both references use native tables with scoped headers, captions,
and focusable horizontal scroll regions. They share fixtures with Playground.

Playground retains filtering, sorting, selection across pages, column configuration,
row actions, pagination, state controls, and Cards/Scroll responsive treatments.
It remains a demo-owned composition rather than a new package component.

Run `pnpm exec playwright test e2e/data-table.spec.ts --workers=2`.
Verify reference semantics, row spacing, light/dark reflow, code disclosure,
filter reset focus, selection persistence, column controls, and row actions.

Structural table scroll surfaces use `rounded-sm` (4px); the playground frame
and separate full-grid mobile panels use `rounded-md` (8px). Colors, type,
and cell spacing consume the shared semantic and spacing utilities. Check
header/grid clipping and visible keyboard focus at the scroll boundary.

Full-grid scroll regions own the rounded perimeter border. Tables use separate
borders with zero spacing and interior-only cell rules so the clipping edge cannot
cut through a square perimeter. Inset mobile card hover follows each row's position
and computed radius. Verify both in light and dark themes.
