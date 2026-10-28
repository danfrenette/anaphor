"use client";

import { useState } from "react";
import { DataTable, DataTablePagination, useDataTable, Button, ButtonLabel, Field, FieldLabel, Input, Text, Tabs, TabsList, TabsTab, TabsPanel, Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, Checkbox, Badge } from "@anaphor/system";
import { records, type RecordItem } from "./data-table-data";

const columns = [{ accessorKey: "name", header: "Project" }, { accessorKey: "owner", header: "Owner" }, { accessorKey: "status", header: "Status" }];
const emptyRecords: RecordItem[] = [];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
type CatalogState = "ready" | "loading" | "empty" | "error";
const states: { value: CatalogState; label: string }[] = [
  { value: "ready", label: "Records" }, { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" }, { value: "error", label: "Error" },
];

function ProjectCard({ project, selected, onSelect }: { project: RecordItem; selected: boolean; onSelect: (checked: boolean) => void }) {
  return <Card variant="default" className={selected ? "h-full ring-2 ring-ring" : "h-full"}>
    <CardHeader>
      <CardDescription>{project.category}</CardDescription>
      <CardAction><Field orientation="horizontal" className="min-h-11 min-w-11 justify-center"><Checkbox aria-label={`Select ${project.name}`} checked={selected} onCheckedChange={onSelect} /></Field></CardAction>
      <CardTitle as="h3" variant="heading" className="text-balance">{project.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">
      <dl className="grid grid-cols-2 gap-4 text-ui">
        <div><dt className="text-small text-muted-foreground">Owner</dt><dd className="mt-1 break-words">{project.owner}</dd></div>
        <div className="text-end"><dt className="text-small text-muted-foreground">Budget</dt><dd className="mt-1 tabular-nums">{currency.format(project.budget)}</dd></div>
      </dl>
      <Badge size="sm" variant="outline" shape="round">{project.status}</Badge>
    </CardContent>
  </Card>;
}

export function DataTableFoundation() {
  const [presentation, setPresentation] = useState<"cards" | "table">("cards");
  const [status, setStatus] = useState<CatalogState>("ready");
  const table = useDataTable({ data: status === "empty" ? emptyRecords : records, columns, getRowId: row => row.id, processing: "local", enableRowSelection: true, autoResetPageIndex: false, initialState: { pagination: { pageIndex: 0, pageSize: 4 } } });
  function resetSearch() { table.setGlobalFilter(""); table.setPageIndex(0); setStatus("ready"); }
  const empty = <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 text-center"><Text as="h3" variant="subheading">No matching projects</Text><p className="max-w-sm text-ui text-muted-foreground">Clear the search to show all projects.</p><Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} onClick={resetSearch}><ButtonLabel>Show all projects</ButtonLabel></Button></div>;
  const state = status === "ready" || status === "empty" ? { status: "ready", emptyContent: empty } as const : { status, statusContent: <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 text-center"><Text as="h3" variant="subheading">{status === "loading" ? "Loading projects…" : "Projects couldn’t load."}</Text><p className="max-w-sm text-ui text-muted-foreground">{status === "loading" ? "Your selection stays in place." : "Your selection is saved. Try loading the collection again."}</p>{status === "error" && <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} onClick={() => setStatus("ready")}><ButtonLabel>Retry projects</ButtonLabel></Button>}</div> } as const;
  const selected = table.getSelectedRowModel().rows.length;
  return <section aria-label="Shared catalog foundation" className="min-w-0 space-y-4">

    <Tabs value={presentation} onValueChange={value => { if (value === "cards" || value === "table") setPresentation(value); }} className="min-w-0 gap-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TabsList size="md" aria-label="Catalog layout"><TabsTab value="cards" className="min-h-11">Cards</TabsTab><TabsTab value="table" className="min-h-11">Table</TabsTab></TabsList>
        <Field orientation="vertical" className="w-full sm:w-72"><FieldLabel>Search shared projects</FieldLabel><Input size="md" type="search" value={String(table.getState().globalFilter ?? "")} onValueChange={value => { table.setGlobalFilter(value); table.setPageIndex(0); table.resetRowSelection(); }} /></Field>
      </div>
      {(["cards", "table"] as const).map(layout => <TabsPanel key={layout} value={layout} className="min-w-0">
      <Tabs value={status} onValueChange={value => { if (value === "ready" || value === "loading" || value === "empty" || value === "error") setStatus(value); }} className="min-w-0 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="max-w-full overflow-x-auto"><TabsList variant="line" size="md" aria-label="Catalog state">{states.map(item => <TabsTab key={item.value} value={item.value} className="min-h-11">{item.label}</TabsTab>)}</TabsList></div>
        <Button nativeButton type="button" variant="ghost" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} onClick={() => table.setSorting([{ id: "name", desc: table.getState().sorting[0]?.desc !== true }])}><ButtonLabel>Sort projects {table.getState().sorting[0]?.desc ? "ascending" : "descending"}</ButtonLabel></Button>
      </div>
        {states.map(item => <TabsPanel key={item.value} value={item.value} className="min-w-0">
        <div className="min-h-80">
          {(status === "ready" || status === "empty") && <div className="flex min-h-14 items-center justify-between gap-3 px-3 text-ui">
            {layout === "cards" && status === "ready" && table.getRowModel().rows.length > 0 && <Field orientation="horizontal" className="min-h-11"><Checkbox aria-label="Select this page of Shared projects" checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onCheckedChange={checked => table.toggleAllPageRowsSelected(checked)} /><FieldLabel>Select this page</FieldLabel></Field>}
            <p role="status" className="tabular-nums">{selected} {selected === 1 ? "project" : "projects"} selected</p>
          </div>}
          <DataTable table={table} label="Shared projects" presentation={layout} density="compact" treatment={layout === "cards" ? "borderless" : "rules"} selection={layout === "table"} primaryColumnId="name" getRowLabel={row => row.original.name} renderCard={row => <ProjectCard project={row.original} selected={row.getIsSelected()} onSelect={checked => row.toggleSelected(checked)} />} {...state} />
        </div>
        <div className="min-h-20">{(status === "ready" || status === "empty") && <DataTablePagination table={table} label="Shared project pages" />}</div>
        </TabsPanel>)}
      </Tabs>
      </TabsPanel>)}
    </Tabs>
  </section>;
}
