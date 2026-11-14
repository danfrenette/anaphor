"use client";

import { type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowsDownUp } from "@phosphor-icons/react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type Row, type Table, type TableOptions } from "@tanstack/react-table";
import { Button, ButtonLabel } from "./button";
import { Checkbox, CheckboxGroup, useCheckboxPaint } from "./checkbox";
import { Field } from "./field";
import { cn } from "../lib/utils";

type DataTableOptions<T> = Omit<TableOptions<T>, "getCoreRowModel" | "getFilteredRowModel" | "getSortedRowModel" | "getPaginationRowModel" | "manualFiltering" | "manualSorting" | "manualPagination"> & {
  processing: "local" | "manual";
  getRowId: NonNullable<TableOptions<T>["getRowId"]>;
  enableRowSelection: NonNullable<TableOptions<T>["enableRowSelection"]>;
};

/** Applications own fetching, URL persistence and selection-reset policy. */
function useDataTable<T>({ processing, ...options }: DataTableOptions<T>): Table<T> {
  return useReactTable({
    ...options,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: processing === "manual",
    manualSorting: processing === "manual",
    manualPagination: processing === "manual",
  });
}

type DataTableProps<T> = {
  table: Table<T>;
  label: string;
  presentation: "table" | "cards";
  density: "compact" | "editorial";
  treatment: "borderless" | "rules" | "grid";
  selection: boolean;
  primaryColumnId: string;
  getRowLabel: (row: Row<T>) => string;
  renderCard?: (row: Row<T>) => ReactNode;
  renderActions?: (row: Row<T>) => ReactNode;
  className?: string;
} & ({ status: "ready"; emptyContent: ReactNode } | { status: "loading" | "error"; statusContent: ReactNode });

function DataTable<T>(props: DataTableProps<T>) {
  const empty = props.status === "ready" && !props.table.getRowModel().rows.length;
  return <div className={cn("min-w-0", props.className)}>
    <div role="status">{props.status === "loading" ? props.statusContent : empty && props.status === "ready" ? props.emptyContent : null}</div>
    <div role="alert">{props.status === "error" ? props.statusContent : null}</div>
    {props.status === "ready" && !empty && <DataTableRecords {...props} />}
  </div>;
}

function DataTableRecords<T>(props: DataTableProps<T>) {
  const { table, label, presentation, density, treatment, selection, primaryColumnId, getRowLabel, renderCard, renderActions } = props;
  const paintCards = useCheckboxPaint();
  const rows = table.getRowModel().rows;
  const padding = density === "compact" ? "px-3 py-2" : "p-4";
  const border = treatment === "grid" ? "border-e border-b [border-width:var(--anaphor-border-hairline)] border-border last:border-e-0" : treatment === "rules" ? "border-b [border-bottom-width:var(--anaphor-border-hairline)] border-border" : "";
  const selectPage = <Checkbox aria-label={`Select this page of ${label}`} checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} disabled={!rows.some(row => row.getCanSelect())} onCheckedChange={checked => table.toggleAllPageRowsSelected(checked)} />;
  const selectRow = (row: Row<T>) => <Field orientation="horizontal" className="min-h-11 min-w-11 justify-center"><Checkbox aria-label={`Select ${getRowLabel(row)}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onCheckedChange={checked => row.toggleSelected(checked)} /></Field>;
  const cellValue = (row: Row<T>, id: string) => {
    const cell = row.getVisibleCells().find(cell => cell.column.id === id);
    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
  };

  return <div className="min-w-0">
    {presentation === "cards" ? <>
      {selection && <div className="flex min-h-14 items-center gap-3 px-3">{selectPage}<span className="text-ui">Select this page</span></div>}
      <ul {...paintCards} aria-label={label} className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
        {rows.map(row => <li key={row.id} className={cn("min-w-0", treatment === "grid" && "rounded-md border [border-width:var(--anaphor-border-hairline)] border-border", treatment === "rules" && border, padding, row.getIsSelected() && "bg-muted")}>
          <div className="flex h-full items-start gap-3">{selection && selectRow(row)}<div className="min-w-0 flex-1 self-stretch">
            {renderCard ? renderCard(row) : <><div className="text-body font-medium break-words">{cellValue(row, primaryColumnId)}</div><dl className="mt-3 grid gap-2">{row.getVisibleCells().filter(cell => cell.column.id !== primaryColumnId).map(cell => <div key={cell.id} className="flex flex-wrap justify-between gap-2 text-ui"><dt className="text-muted-foreground">{typeof cell.column.columnDef.header === "string" ? cell.column.columnDef.header : cell.column.id}</dt><dd className="break-words">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd></div>)}</dl></>}
          </div>{renderActions?.(row)}</div>
        </li>)}
      </ul>
    </> : <div role="region" aria-label={`${label}, scroll for more columns`} tabIndex={0} className="overflow-x-auto rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
      <CheckboxGroup><table className="w-full border-separate border-spacing-0 text-start text-ui">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-muted">{table.getHeaderGroups().map((group, index) => <tr key={group.id}>
          {selection && index === 0 && <th scope="col" rowSpan={table.getHeaderGroups().length} className={cn(padding, border)}>{selectPage}</th>}
          {group.headers.map(header => <th key={header.id} colSpan={header.colSpan} scope="col" aria-sort={header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : undefined} className={cn("text-start font-medium", padding, border)}>
            {!header.isPlaceholder && (header.column.getCanSort() ? <button type="button" className="min-h-11 rounded-sm px-2 text-start focus-visible:outline-2 focus-visible:outline-ring" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}<span className="ms-2 inline-flex align-middle" aria-hidden="true">{header.column.getIsSorted() === "asc" ? <ArrowUp size={16} /> : header.column.getIsSorted() === "desc" ? <ArrowDown size={16} /> : <ArrowsDownUp size={16} />}</span></button> : flexRender(header.column.columnDef.header, header.getContext()))}
          </th>)}{renderActions && index === 0 && <th scope="col" rowSpan={table.getHeaderGroups().length} className={padding}><span className="sr-only">Actions</span></th>}
        </tr>)}</thead>
        <tbody>{rows.map(row => <tr key={row.id} className={row.getIsSelected() ? "bg-muted" : undefined}>
          {selection && <td className={cn(padding, border)}>{selectRow(row)}</td>}
          {row.getVisibleCells().map(cell => <td key={cell.id} className={cn("break-words", padding, border)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
          {renderActions && <td className={cn(padding, border)}>{renderActions(row)}</td>}
        </tr>)}</tbody>
      </table></CheckboxGroup>
    </div>}
  </div>;
}

function DataTablePagination<T>({ table, label }: { table: Table<T>; label: string }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getRowCount();
  const shown = table.getRowModel().rows.length;
  return <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 py-4 text-ui">
    <span role="status" className="tabular-nums">{shown ? pageIndex * pageSize + 1 : 0}–{shown ? pageIndex * pageSize + shown : 0} of {total}</span>
    <div className="flex items-center gap-2">
      <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><ButtonLabel>Previous page</ButtonLabel></Button>
      <Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><ButtonLabel>Next page</ButtonLabel></Button>
    </div>
  </nav>;
}

export { DataTable, DataTablePagination, useDataTable, type DataTableOptions, type DataTableProps };
