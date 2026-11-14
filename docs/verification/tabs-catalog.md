# Tabs catalog

**Outcome:** The catalog compares Default, Lifted, and Line, three sizes, and a
vertical example with a disabled destination. A configurable playground uses the
existing Tabs components and shared Controls. Wide rows scroll inside their
examples on narrow screens rather than widening the manual.

**Drive:** Run `pnpm exec playwright test e2e/tabs-catalog.spec.ts` against the
production preview. Visit `/#tabs`; switch between Library, Recents, and Reports.
Use Controls to change variant, size, orientation, icons, and Reports availability.
Disable Reports while it is selected, then reset. Inspect inline code. Repeat
with keyboard navigation and at mobile width. In the Lifted example, click
between tabs in Light and Carbon and pause the transition midway.

**Assertions:** Selected tabs expose their associated panels. Disabling the active
Reports tab selects Library. Vertical tabs use up/down navigation and skip the
disabled tab. Reset restores the default medium horizontal text-only tabs and
Library. The playground maintains its minimum height across the tested settings;
the section does not overflow horizontally. Shared keyboard and reduced-motion
behavior remains owned by Tabs.

Lifted: mid-transition, the surface edge stays 1px inside the clip on both sides,
its shadow is not cut off, and labels change colour at the moving edge. Keyboard
selection, reduced motion, and first paint start no transition. Focused tabs
draw a solid 2px ring; a focused active tab keeps its active label colour.
Default and Line render unchanged.

**Checks:** `pnpm lint`, `pnpm typecheck`, the Tabs unit tests, and the catalog
browser recipe. Run `pnpm test:registry` when the tabs or style registry files
change. Keep failure artifacts in `test-results/` until triaged.

## Local verification — 2026-11-13 (lifted variant)

- `pnpm lint`: passed; existing React Compiler warning in DataTable.
- `pnpm typecheck`: passed, including the TabsList variant fixture.
- `pnpm test`: 244 passed, 6 skipped. The keyed-fragment regression test fails
  on the previous `collectVisualTabs` with React's duplicate-key error.
- `pnpm exec playwright test e2e/tabs-catalog.spec.ts`: 4 passed in production
  Chromium and 320px WebKit.
- `pnpm test:browser`: 475 passed, 49 skipped, 6 failed. Five screenshot
  failures (badge, card, showcase) also fail on unmodified `main` on this
  machine. The WebKit command-palette spec is intermittent on both branches.
- `pnpm test:registry`: passed; the built `tabs` item carries the variant and
  the `style` item carries its CSS.
- Light and Carbon at 1280px: pointer selection paused at 50/100/150ms keeps the
  surface edge 1px inside the clip, with the shadow intact. Keyboard selection,
  reduced motion and first paint start no transition. Small, large and vertical
  lifted lists render in both themes. Default and Line captures of the Sizes and
  Orientation examples were pixel-identical to `main`.

Local macOS run with Node 26 rather than CI's Node 24. Linux baselines, physical
touch, screen readers and 200% zoom were not checked.
