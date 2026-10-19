# Dropdown menu catalog

The `/#dropdown-menu` catalog groups Actions & states, Selection, and Playground.
All previews use the exported Menu components. Actions only change local feedback;
Delete does not remove data, and shortcut hints do not register keyboard shortcuts.

Run `pnpm exec playwright test e2e/menu.spec.ts --workers=2` for Chromium and mobile
WebKit. The suite covers anchor stability, keyboard focus and dismissal, shared
pointer highlighting, reduced motion, accessibility, selection, and catalog controls.
Run the menu unit tests, lint, and typecheck for the changed consumer.

Open Document actions and confirm Share is disabled. Choose a sort option and
confirm the trigger label updates. In Playground Controls, change Placement,
Alignment, Icons, Shortcut hints, and Disable Share. Open File actions and select
an enabled action. Inline code reflects the configuration; Reset restores defaults
and clears the action feedback. Placement can flip at viewport edges. Check that
the catalog remains within the viewport on mobile.

Save screenshots and test results before stopping the verification server. The
shared component and registry output are unchanged by this catalog cleanup.
