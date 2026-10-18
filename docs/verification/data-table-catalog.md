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
