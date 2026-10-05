# Workspace shell: a continuous canvas around the work

A person using the Reference manual can place its navigation on the left or
right while reading in one content card. Consumers can also compose distinct
navigation and context panels on both sides. The top strip can hold tabs or
other controls, and the bottom bar can hold persistent utilities. A consumer can
leave out any of those regions without creating a blank track or border seam.
This makes the shell usable for many application layouts rather than tying tabs
or sidebars to a particular route.

This walkthrough covers [PR #27](https://github.com/danfrenette/anaphor/pull/27),
based on [the merged bottom bar PR #26](https://github.com/danfrenette/anaphor/pull/26).
The original implementation links below are pinned to revision
[`19e08f9`](https://github.com/danfrenette/anaphor/commit/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b).
The guide-specific duplicate right outline was removed in a later revision of
the same PR; the reusable two-sided layout remains available.
The supplied Linear images informed the visual direction; the accepted product
choices were a full-width top row, generic caller-provided tab content and
actions, a breadcrumb inside the card, and a continuous canvas behind the side
and bottom regions.

## From a section link to the reading card

The manual composes the [shell, provider, tabs, sidebars, card, and bottom
bar](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/apps/demo/app/demo-shell.tsx#L213-L250).
The top tab is a view supplied by the manual. The reusable Tabs component owns
selection and keyboard behavior; the manual can later provide additional tabs
or add and close controls. The [breadcrumb is inside the card
header](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/apps/demo/app/demo-shell.tsx#L185-L210),
below the top strip.

The [card body is the scroll
container](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/components/workspace-shell.tsx#L27-L43).
Passing its ref to
[ContentSections](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/components/sections.tsx#L40-L70)
keeps hash navigation, keyboard section movement, and the current-section
indicator tied to the card instead of the browser window. The manual uses one
navigation rail; its section links remain in the left or right rail selected
by the reader.

## Optional regions and motion

`WorkspaceShell` owns the [three-column, three-row
geometry](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/components/workspace-shell.tsx#L4-L25).
The card is the only required part. The
[workspace sidebar layout](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/components/sidebar.tsx#L185-L228)
uses the outer canvas, while
[SidebarInset](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/components/sidebar.tsx#L625-L635)
keeps the content in the center track as panels open and close. Collapsed side
tracks are removed by [shell layout
rules](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/styles.css#L9-L20).
The [integrated bottom bar](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/packages/design-system/src/components/bottom-bar.tsx#L7-L20)
spans the canvas without a separate border. Its standalone appearance remains
available to consumers outside the shell.

The [live composition
preview](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/apps/demo/app/workspace-shell-demo.tsx#L20-L64)
lets a reviewer toggle top, navigation, context, bottom, and tabs independently.
On mobile, the card becomes a flush page surface and side navigation moves to
a modal drawer. At medium widths, the secondary sidebar hides. Bottom utility
clearance is scoped to a mounted main bar, so an embedded preview bar cannot
reserve space for the whole application.

## Why this split

The shell describes geometry and surfaces. Sidebar owns placement, responsive
drawer behavior, focus, width, and motion. Tabs owns selection and keyboard
behavior. The manual supplies labels, content, and actions. This preserves the
existing sidebar and bottom-bar APIs while giving consumers an integrated
appearance for this composition. A single page component controlling every
region would make optional layouts and reuse harder; embedding route semantics
inside Tabs would also conflict with the requested customizable top content.

## Verification and review

At the implementation revision above, the author ran the Next production
build, ESLint, TypeScript, Vitest (**126 passed**), the registry consumer check,
and Playwright in desktop Chromium and mobile WebKit (**245 passed, 25 intended
skips**). The [workspace shell browser
tests](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/e2e/workspace-shell.spec.ts#L3-L116)
cover direct links, card scrolling, all 16 top/left/right/bottom combinations,
top controls without tabs, mobile flush geometry, and a representative RTL
and 200% zoom pass. [Sidebar browser
tests](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/e2e/sidebar.spec.ts#L61-L102)
cover placement and drawer focus. The repeatable
[verification recipe](https://github.com/danfrenette/anaphor/blob/19e08f92ed1ba9a3e7d89f1a38170b09d3f18e8b/docs/verification/workspace-shell.md)
lists entry points and assertions.

The Standards, Spec, Principles, and execution review passes found no
remaining material issue after refinements to the mobile card, sidebar state,
and omission assertions. These are local verification receipts summarized in
the [draft PR](https://github.com/danfrenette/anaphor/pull/27); they do not
claim a separate CI result. A reviewer should still inspect real consumer
compositions with unusual tab content and the shell on a touch device with the
on-screen keyboard open, which the current tests do not exhaustively cover.
