import { DataTable, useDataTable, type DataTableOptions } from "@anaphor/system";
import { expectTypeOf } from "vitest";

const options = { data: [{ id: "a", title: "Title" }], columns: [{ accessorKey: "title", header: "Title" }], getRowId: (row: { id: string }) => row.id, processing: "local", enableRowSelection: true } satisfies DataTableOptions<{ id: string; title: string }>;
function Consumer() {
  const table = useDataTable(options);
  return <DataTable table={table} label="Sources" presentation="cards" density="compact" treatment="rules" selection primaryColumnId="title" status="ready" emptyContent="No sources" getRowLabel={row => row.original.title} renderCard={row => {
    expectTypeOf(row.original.title).toEqualTypeOf<string>();
    // @ts-expect-error Record inference must not widen to unknown fields.
    void row.original.missing;
    return row.original.title;
  }} />;
}
void Consumer;
// @ts-expect-error Stable identity is mandatory for catalog selection.
const missingIdentity: DataTableOptions<{ title: string }> = { data: [], columns: [], processing: "local", enableRowSelection: true };
void missingIdentity;
