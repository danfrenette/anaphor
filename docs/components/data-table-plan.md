# Data table and Popover — agreed design

Status: design decisions agreed on September 24, 2026. The shared Popover
foundation is implemented; see `popover.md` for its contract. The table remains
planned, with visual explorations preceding DataTable implementation.

## Direction

Build a reusable record-management table on TanStack Table. Follow shadcn's
composition patterns, use Coss for structural inspiration, and retain Anaphor's
controls, tokens, typography, and interaction conventions. Use emil animation
guidance for new motion.

Provide server-safe semantic Table parts and an interactive DataTable composition.
Appearance and capabilities are independently configurable through props. Follow
`docs/component-prop-contracts.md`: component-owned configuration is explicit at
call sites. Configuration can also restrict individual columns where relevant.
Exact public prop names will be established during implementation.

This is a component-library addition with its own Components navigation entry,
documentation, and configurable playground. Use dedicated fictional records.
Neither implementation nor examples depend on the Studies, which will be reworked
separately.

## Shared Popover first

Build a true Base UI-backed Popover, using the installed primitive dependency.
Reuse Menu's surface and positioning conventions, while preserving Popover's
focus and interaction semantics for arbitrary interactive content.

Include root, trigger, popup, title, description, and close parts;
controlled/uncontrolled state; explicit placement; collision handling; focus
management; Escape and outside dismissal. Table controls use explicit activation.
Popover gets its own documentation, registry export, and configurable playground.

Motion: trigger-origin opacity and restrained scale, approximately 180ms opening
and 125ms closing across pointer, touch, and keyboard activation. Control
interactions remain immediate; Base UI restores focus after exit. Reduced motion disables animation,
including fades. Keep trigger measurement stable during press feedback.
Defer hover-opening examples, shared moving panels, and automatic mobile drawers.

## Data and state

TanStack Table owns row processing and table state. Implement in-memory search,
filtering, sorting, and pagination first. Design controlled state and explicit
local/manual processing modes now so server integration need not replace the API.

Fetching belongs to the consuming application. TanStack Query can supply rows,
counts, loading/error state and respond to table-state changes; it is not required
inside the table. Searching, filtering, sorting, and pagination must operate over
the same dataset, rather than silently filtering just one server-fetched page.

Expose state and change callbacks for app-owned preference persistence. Do not
silently write settings to browser storage.

## Search, filters, and sorting

- Search across explicitly designated searchable columns.
- Support individual text, categorical, numeric, and date filters, with active
  filter indicators and a clear reset action. Allow custom filter controls as
  the form component library grows.
- Support configurable single or multiple-column sorting. Header activation
  cycles ascending, descending, and unsorted; menus offer explicit choices.
- Show sort priority in multi-sort mode and allow adding sorts without relying
  on a keyboard shortcut.
- Defer nested AND/OR condition builders.

## Column configuration

“Editing columns” means visibility, order, and width. It does not include editing
cell values, renaming fields, or changing data types. Future form components can
provide cell editing separately.

Use a Columns popover with visibility checkboxes, draggable ordering,
keyboard-accessible move controls, and Reset columns. Resize through header
separators with a keyboard-accessible width control. Keep selection fixed at the
start. Support optional pinned columns.

## Row selection and actions

Use Anaphor Checkbox and its existing painting behavior: the initial checkbox
determines whether visited checkboxes become checked or unchecked. Disabled rows
are skipped. Paint through checkbox hit areas, exclude the header, and preserve
touch scrolling. Ordinary cells remain available for text selection.

Add edge auto-scroll within a scrollable table, bounded to the current page.
Provide Shift-click range selection within the current page. Preserve selection
by stable record ID across sorting and page changes; clear it when search or
filters change. The header checkbox selects eligible rows on the current page
and displays the mixed state when appropriate.

Open records through their name/link or explicit row action. Provide optional
row-action menus, a bulk-action area, and expandable row details. The consuming
application supplies actions and export behavior.

Implementation note: current checkbox painting hit testing expects a Field
ancestor. Preserve semantic table markup when composing that behavior. Edge
auto-scroll and Shift-click are additions to existing painting support.

## Appearance and responsive behavior

Offer borderless, horizontal-separator, and full-grid treatments. These are
Anaphor variants, not names claimed to exist in Coss. Support both themes and
Anaphor's editorial/compact densities. Appearance does not enable features.

Provide two configurable narrow-container modes:

- Horizontal scrolling within the table container.
- Card reflow at a configurable container-width breakpoint.

Generate cards from visible columns as labeled fields, using an explicitly
designated primary field for the heading. Offer a custom renderer for richer
layouts. Share the same TanStack state, record identity, selection, pagination,
and actions across both presentations. Touch selection remains ordinary checkbox
activation, with native scrolling.

Expose sorting in the toolbar when column headers disappear. Preserve column
width and pinning settings for return to table layout. Reflow should not silently
discard fields. Keep controls usable in narrow containers.

## Included scope and deferred features

Include pagination, sticky headers, optional pinned columns, density controls,
row and bulk actions, optional expandable details, and app-supplied export
actions. Cover loading, error, empty-data, and no-results states. Keyboard access,
accessible naming, and native semantics are foundational.

Defer cell editing, grouped rows and aggregates, saved named views, row
reordering, nested filter builders, built-in export formats, built-in fetching,
infinite scrolling, virtualization, and spreadsheet-style keyboard navigation.

## Visual exploration and validation

Compare the same dedicated dataset across the three aesthetic variants with
identical capabilities, then show minimal and full-feature configurations.
Include both themes and densities, selected rows, open column controls, loading
and empty states, and scroll/card responsive modes in a resizable preview.

Validate Popover focus/dismissal and nested controls, keyboard column operations,
selection scope and painting, responsive state continuity, and accessible table
and card presentation. Component exports, registry installation, documentation,
and playground integration are part of shipping the library addition.

## Research references

- [shadcn Data Table](https://ui.shadcn.com/docs/components/base/data-table):
  TanStack composition, column controls, pagination, and page selection.
- [Coss Table](https://coss.com/ui/docs/components/table) and
  [Frame](https://coss.com/ui/docs/components/frame): table presentation and
  surrounding framing remain separate.
- [shadcn Popover](https://ui.shadcn.com/docs/components/base/popover) and
  [Coss Popover](https://coss.com/ui/docs/components/popover): composable Base UI
  popup structure and positioning.
- [MUI-Datatables](https://github.com/gregnb/mui-datatables#options): vertical
  responsive mode pairs labels with stacked field values.
- [PrimeFaces responsive DataTable](https://showcase.primefaces.org/ui/data/datatable/responsive.xhtml):
  priority-based visibility and stacked reflow are distinct responsive patterns.

The responsive references demonstrate stacked records, not bespoke card layouts;
the primary-field heading and custom renderer are our agreed extensions.
