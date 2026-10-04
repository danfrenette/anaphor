# Sidebar placement and motion

**Outcome:** A Reference manual reader selects Left, Right, or Both in the
Sidebar section. The desktop layout places navigation and, in Both mode, a page
outline around the core content at wide widths. Open and close movement keeps
centered content at natural scale. At medium widths Both keeps the left panel;
on mobile it uses one left modal drawer with focus return.

**Entry points:** `/#sidebar` in the Reference manual; `SidebarProvider` and
`Sidebar` from `@anaphor/system`. The top strip opens or closes the sidebar.

**Prerequisites:** A built manual at the current revision and Playwright's
Chromium and WebKit browsers. See [Development](../../README.md#development).
No account or seeded data is needed.

**Drive:** Run `pnpm exec playwright test e2e/sidebar.spec.ts`. In a manual pass,
visit `/#sidebar`, select each labeled placement button, and use the header
sidebar trigger. On desktop, inspect the panel edges and centered content while
closing, reopening, and reversing quickly. At a narrow viewport, open the
drawer, dismiss it, and check focus returns to the trigger.

**Assertions:** `aria-pressed` identifies the selected placement. Left and
Right use their named edge; Both shows navigation left and outline right at
wide desktop widths, with the inset between them. The outline hides below
`lg`. Closing gives the inset full viewport width; the content card remains
inset within it. Content moves without scaling. Mobile has one modal dialog, scroll lock, Escape/outside
dismissal, and focus return. Keyboard and reduced-motion toggles settle without
positional travel. A rail grows toward the page, including the right rail, and
two rails keep independent widths.

**Evidence:** Retain the command, tested revision, pass/fail counts, and any
Playwright trace or screenshot from `test-results/` in a per-run receipt. Unit
coverage lives in `packages/design-system/test/sidebar.test.tsx`; browser
coverage lives in `e2e/sidebar.spec.ts`.

**Cleanup:** Stop the owned local server after capturing the result. Leave
failure artifacts until triage is complete.
