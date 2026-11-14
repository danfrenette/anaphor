import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DataTable, DataTablePagination, useDataTable } from "./components/ui/data-table";
import "./styles.css";
const data = [{ id: "first", title: "First source" }, { id: "second", title: "Second source" }];
const columns = [{ accessorKey: "title", header: "Title" }];
function Consumer() {
  const [count, setCount] = useState(0);
  const table = useDataTable({ data, columns, processing: "local", getRowId: row => row.id, enableRowSelection: true, initialState: { pagination: { pageIndex: 0, pageSize: 1 } } });
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial"><p className="max-w-reading">Shared layout in an independent consumer.</p></div>
    <button className="h-10" onClick={() => setCount(count + 1)}>Count {count}</button><p className="font-mono">Installed source</p>
    <DataTable table={table} label="Installed sources" presentation="cards" density="compact" treatment="rules" selection primaryColumnId="title" getRowLabel={row => row.original.title} status="ready" emptyContent="No sources" />
    <DataTablePagination table={table} label="Installed pages" />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Consumer />);
