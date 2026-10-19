# Tabs catalog

**Outcome:** The catalog compares Default and Line, three sizes, and a vertical
example with a disabled destination. A configurable playground uses the existing
Tabs components and shared Controls. Wide rows scroll inside their examples on
narrow screens rather than widening the manual.

**Drive:** Run `pnpm exec playwright test e2e/tabs-catalog.spec.ts` against the
production preview. Visit `/#tabs`; switch between Library, Recents, and Reports.
Use Controls to change variant, size, orientation, icons, and Reports availability.
Disable Reports while it is selected, then reset. Inspect inline code. Repeat
with keyboard navigation and at mobile width.

**Assertions:** Selected tabs expose their associated panels. Disabling the active
Reports tab selects Library. Vertical tabs use up/down navigation and skip the
disabled tab. Reset restores the default medium horizontal text-only tabs and
Library. The playground maintains its minimum height across the tested settings;
the section does not overflow horizontally. Shared keyboard and reduced-motion
behavior remains owned by Tabs.

**Checks:** `pnpm lint`, `pnpm typecheck`, the Tabs unit tests, and the catalog
browser recipe. Keep failure artifacts in `test-results/` until triaged.
