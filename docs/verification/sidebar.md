# Sidebar placement and motion

**Outcome:** The Sidebar catalog demonstrates anatomy, left/right placement, and
an isolated interactive playground. Open and close movement keeps centered content at natural
scale. On mobile it uses one modal drawer with focus return. Consumers can
compose separate navigation and context rails with `side="both"`; the workspace
shell preview demonstrates that combination.

**Entry points:** `/#sidebar` in the Reference manual; `SidebarProvider` and
`Sidebar` from `@anaphor/system`. The top strip opens or closes the sidebar.

**Prerequisites:** A built manual at the current revision and Playwright's
Chromium and WebKit browsers. See [Development](../../README.md#development).
No account or seeded data is needed.

**Drive:** Run `pnpm exec playwright test e2e/sidebar.spec.ts`. In a manual pass,
visit `/#sidebar` and use Sidebar Controls to choose Placement and Resizable.
Select preview destinations, toggle its sidebar, and reset the controls. Confirm
these changes do not move or close the manual navigation. Run
`e2e/sidebar-catalog.spec.ts` for these interactions. The existing full-viewport
motion tests use `/sidebar-fixture` and its placement buttons; run
`e2e/sidebar-recovery.spec.ts` for interruptions and reversal coverage. On desktop, inspect the panel edges and centered content while
closing, reopening, and reversing quickly. At a narrow viewport, open the
drawer, dismiss it, and check focus returns to the trigger.

The manual index starts with Overview, followed by Foundations, Controls, Content,
and Navigation. Group labels use secondary color at the item font size; rows have
no icons. Search and breadcrumbs use the same categories. Studies and Source
Outline stay retired. Run `e2e/manual-index-review.spec.ts`,
`e2e/command-palette.spec.ts`, and `e2e/retired-pages.spec.ts` for these routes.

**Assertions:** Placement and inline code reflect the playground configuration.
Reset restores left placement, Overview, an open desktop rail, and its default
width with resizing off. The fixture uses `aria-pressed` for placement. Left and
Right use their named edge, with one guide navigation rail and no duplicate
outline. The workspace preview can show distinct navigation and context
regions around its card. Closing gives the inset full viewport width; the content card remains
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
