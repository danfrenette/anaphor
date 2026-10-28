# DataTable foundation

`useDataTable`, `DataTable`, and `DataTablePagination` ship through the package root
and the `data-table` registry item. This is the shared foundation required by
Autodidact Library. The broader [DataTable plan](data-table-plan.md) still owns
future column configuration, resizing, pinning, range selection and auto-scroll.

## Ownership

TanStack Table v8 owns row models and state. `processing="local"` filters and sorts
the full supplied dataset before pagination. `processing="manual"` renders the
supplied server page without repeating those operations; supply `rowCount` and
controlled pagination, sorting and filters with their change callbacks. Fetching,
request cancellation, URL/storage persistence, mutation actions and selection-reset
policy belong to the application. A server response must correspond to its current
query; the component does not fetch or resolve stale responses.

Stable `getRowId` and `enableRowSelection` are required. Selection is keyed by ID,
so table/card changes and paging do not erase it. Page selection affects only
eligible rows on the current page. Read selected IDs from `table.getState().rowSelection`
when server paging: selected row models can include only supplied records. Consumers
that require page-scoped selection explicitly clear it when changing query/page.

## Presentation

Supply `label`, `presentation` (`table` or `cards`), `density` (`compact` or
`editorial`), `treatment` (`borderless`, `rules`, `grid`), `selection`,
`primaryColumnId` and `getRowLabel`. Cards can be the primary desktop presentation.
The application chooses when to switch presentation; the same table instance keeps
state across changes. Table overflow remains within its focusable scroll region.

The default card uses the primary column followed by labeled visible fields.
`renderCard(row)` replaces its content for covers and richer identity. Keep its
links separate from the supplied selection checkbox and `renderActions(row)`.
Custom renderers own their content's semantics and wrapping. Consumers provide
sort/filter controls for card mode through the table API. No row-click selection
is introduced; ordinary content remains selectable and links retain their action.

Ready state requires `emptyContent`. Loading/error states require `statusContent`
and unmount records so stale actions cannot remain available. The caller supplies
recovery actions and suitable loading geometry. Render pagination only when usable.

The shared controls have immediate state changes and add no movement. Anaphor
Checkbox supplies keyboard, touch and pointer-paint behavior; table headers are
outside its paintable Field wrappers. Table column-header buttons cycle sorting.
All rendered header labels and card field labels must be meaningful to the consumer.

## Consumer sketch

```tsx
const table = useDataTable({
  data, columns, getRowId: row => row.id,
  processing: "local", enableRowSelection: true,
  initialState: { pagination: { pageIndex: 0, pageSize: 24 } },
});
<DataTable table={table} label="Sources" presentation="cards"
  density="compact" treatment="rules" selection
  primaryColumnId="title" getRowLabel={row => row.original.title}
  status="ready" emptyContent="No sources yet" />
<DataTablePagination table={table} label="Source pages" />
```

TanStack's mutable table instance is not React Compiler memoization-safe. The
existing lint compatibility warning is retained, not suppressed; consumers must
not memoize the table or derived callbacks as immutable values. No React Compiler
support is claimed by this foundation.
