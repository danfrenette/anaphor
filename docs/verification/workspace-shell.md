# Workspace shell composition

**Outcome:** The Reference manual presents one continuous canvas around an
inset content card. The top strip can hold custom tabs and controls; navigation,
context, and bottom utilities can be included independently. Every omitted
region collapses without an empty track, border, offset, landmark, or focus stop.

**Entry points:** `/#workspace-shell` in the Reference manual;
`WorkspaceShell`, `WorkspaceTopBar`, `WorkspaceCard`, `WorkspaceCardHeader`,
`WorkspaceCardBody`, `SidebarProvider layout="workspace"`, and
`BottomBar appearance="integrated"` from `@anaphor/system`.

**Prerequisites:** A production build of the current revision on
`http://127.0.0.1:3105/`, with Playwright Chromium and WebKit installed.
No account or seeded data is needed.

**Drive:** Run `pnpm exec playwright test e2e/workspace-shell.spec.ts`.
In a manual pass, visit `/#workspace-shell` directly and confirm the top strip
stays visible while the card body lands on that section. Toggle Top, Navigation, Context,
and Bottom through all combinations. Toggle Tabs separately and switch between
the two custom views. Inspect full, no-bottom, no-top, one-side, and no-side
compositions in light and dark themes. Scroll the long manual article, then
toggle the sidebar and open the contextual tools. Repeat a representative pass
at mobile width, 200% zoom, and RTL direction.

**Assertions:** The card is inset from all remaining shell edges, with its own
surface and perimeter. Shell chrome has no border seams. The card body scrolls
without moving the viewport or fixed shell. Top and bottom rows vanish when omitted; side
columns vanish when omitted. With the top row present but tabs absent, other
top controls remain visible. Tabs use normal selection and keyboard behavior.
The manual's breadcrumb stays inside the card header. Sidebar placement and
modal behavior follow [Sidebar placement and motion](sidebar.md). A missing
bottom bar reserves no clearance; Search, Theme, and morph controls remain
reachable when the bar is present.

**Evidence:** Record the tested revision, command, browser, pass/fail counts,
and any `test-results/` artifacts. Structural coverage for all 16 region
combinations lives in `packages/design-system/test/workspace-shell.test.tsx`;
running-browser coverage lives in `e2e/workspace-shell.spec.ts`.

**Cleanup:** Stop the local server owned by the verification run after saving
the result. Keep failure artifacts until triage is complete.
