"use client";

import { useState } from "react";
import { DataTable, DataTablePagination, useDataTable, Button, ButtonLabel, Field, FieldLabel, Input, Text } from "@anaphor/system";
import { records } from "./data-table-data";

const columns = [{ accessorKey: "name", header: "Project" }, { accessorKey: "owner", header: "Owner" }, { accessorKey: "status", header: "Status" }];

export function DataTableFoundation() {
  const [presentation, setPresentation] = useState<"cards" | "table">("cards");
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const table = useDataTable({ data: records, columns, getRowId: row => row.id, processing: "local", enableRowSelection: true, initialState: { pagination: { pageIndex: 0, pageSize: 4 } } });
  const state = status === "ready" ? { status, emptyContent: "No matching projects. Clear the search to show all projects." } as const : { status, statusContent: status === "loading" ? "Loading projects…" : <><p>Projects couldn’t load.</p><Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} onClick={() => setStatus("ready")}><ButtonLabel>Retry projects</ButtonLabel></Button></> } as const;
  return <section aria-label="Shared catalog foundation" className="min-w-0 space-y-4">
    <Text as="h3" variant="heading">Shared catalog foundation</Text>
    <Text as="p" variant="description">One selection across cards and rows. Search and pagination use the same collection.</Text>
    <div className="flex flex-wrap items-end gap-3">
      <Field orientation="vertical"><FieldLabel>Search shared projects</FieldLabel><Input size="md" type="search" value={String(table.getState().globalFilter ?? "")} onValueChange={value => { table.setGlobalFilter(value); table.resetRowSelection(); }} /></Field>
      <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} onClick={() => setPresentation(presentation === "cards" ? "table" : "cards")}><ButtonLabel>{presentation === "cards" ? "Show table" : "Show cards"}</ButtonLabel></Button>
      <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} onClick={() => table.setSorting([{ id: "name", desc: table.getState().sorting[0]?.desc !== true }])}><ButtonLabel>Sort projects {table.getState().sorting[0]?.desc ? "ascending" : "descending"}</ButtonLabel></Button>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Catalog state">{(["ready", "loading", "error"] as const).map(value => <Button key={value} nativeButton type="button" variant="ghost" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} aria-pressed={status === value} onClick={() => setStatus(value)}><ButtonLabel>{value}</ButtonLabel></Button>)}</div>
    <p className="text-ui" role="status">{table.getSelectedRowModel().rows.length} projects selected</p>
    <DataTable table={table} label="Shared projects" presentation={presentation} density="compact" treatment="rules" selection primaryColumnId="name" getRowLabel={row => row.original.name} {...state} />
    {status === "ready" && <DataTablePagination table={table} label="Shared project pages" />}
  </section>;
}
