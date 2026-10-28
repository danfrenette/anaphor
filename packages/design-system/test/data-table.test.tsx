import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataTable, DataTablePagination, useDataTable } from "../src/index";

const records = [{ id: "a", title: "Alpha", owner: "Kim" }, { id: "b", title: "Beta", owner: "Dan" }, { id: "c", title: "Gamma", owner: "Kim" }];
const columns = [{ accessorKey: "title", header: "Title" }, { accessorKey: "owner", header: "Owner" }];
function Catalog() {
  const [cards, setCards] = useState(false);
  const table = useDataTable({ data: records, columns, getRowId: row => row.id, processing: "local", enableRowSelection: true, initialState: { pagination: { pageIndex: 0, pageSize: 2 } } });
  return <><label>Search<input onChange={event => table.setGlobalFilter(event.target.value)} /></label><button onClick={() => setCards(value => !value)}>Change presentation</button>
    <DataTable table={table} label="Sources" presentation={cards ? "cards" : "table"} density="compact" treatment="rules" selection={true} primaryColumnId="title" getRowLabel={row => row.original.title} status="ready" emptyContent="No matching sources" />
    <DataTablePagination table={table} label="Source pages" />
  </>;
}
describe("DataTable consumer", () => {
  it("keeps selected identity when changing presentation and pages, and filters the full dataset", async () => {
    const user = userEvent.setup(); render(<Catalog />);
    await user.click(screen.getByRole("checkbox", { name: "Select Alpha" }));
    await user.click(screen.getByRole("button", { name: "Change presentation" }));
    expect(screen.getByRole("checkbox", { name: "Select Alpha" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Gamma")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByRole("checkbox", { name: "Select Alpha" })).toBeChecked();
    await user.type(screen.getByRole("textbox", { name: "Search" }), "Gamma");
    expect(screen.getByText("Gamma")).toBeVisible();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Source pages" })).getByText("1–1 of 1")).toBeVisible();
  });
});

function ManualCatalog({ status = "ready" }: { status?: "ready" | "loading" | "error" }) {
  const table = useDataTable({ data: records.slice(2), columns, getRowId: row => row.id, processing: "manual", enableRowSelection: row => row.original.id !== "c", rowCount: 25, state: { pagination: { pageIndex: 1, pageSize: 24 }, globalFilter: "does not match", sorting: [{ id: "title", desc: true }] } });
  const state = status === "ready" ? { status, emptyContent: "Nothing here" } as const : { status, statusContent: status === "loading" ? "Loading sources" : "Try again" } as const;
  return <><DataTable table={table} label="Manual sources" presentation="cards" density="editorial" treatment="borderless" selection={true} primaryColumnId="title" getRowLabel={row => row.original.title} renderCard={row => <a href={`/source/${row.id}`}>Open {row.original.title}</a>} {...state} /><DataTablePagination table={table} label="Manual pages" /></>;
}
it("renders a server page without filtering or paginating it again and honors disabled selection", () => {
  render(<ManualCatalog />);
  expect(screen.getByRole("link", { name: "Open Gamma" })).toHaveAttribute("href", "/source/c");
  expect(screen.getByText("25–25 of 25")).toBeVisible();
  expect(screen.getByRole("checkbox", { name: "Select Gamma" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("checkbox", { name: "Select this page of Manual sources" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
});
it("shows truthful loading and error content without retaining interactive records", () => {
  const { rerender } = render(<ManualCatalog status="loading" />);
  expect(screen.getByText("Loading sources")).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  rerender(<ManualCatalog status="error" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Try again");
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
});

it("keeps the announcement region available before loading and recovery", () => {
  const { rerender } = render(<ManualCatalog />);
  const announcement = screen.getAllByRole("status").find(element => !element.textContent);
  expect(announcement).toBeInTheDocument();
  rerender(<ManualCatalog status="loading" />);
  expect(announcement).toHaveTextContent("Loading sources");
  expect(announcement).not.toHaveAttribute("aria-busy", "true");
  rerender(<ManualCatalog />);
  expect(announcement).toBeEmptyDOMElement();
});

function ControlledCatalog() {
  const [selection, setSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 2 });
  const table = useDataTable({ data: records, columns, processing: "local", getRowId: row => row.id, enableRowSelection: row => row.original.id !== "b", state: { rowSelection: selection, pagination }, onRowSelectionChange: setSelection, onPaginationChange: setPagination });
  return <><DataTable table={table} label="Controlled sources" presentation="table" density="compact" treatment="grid" selection primaryColumnId="title" getRowLabel={row => row.original.title} status="ready" emptyContent="No sources" /><DataTablePagination table={table} label="Controlled pages" /></>;
}
it("lets the consumer control selection and paging while selecting only eligible rows", async () => {
  const user = userEvent.setup(); render(<ControlledCatalog />);
  await user.click(screen.getByRole("checkbox", { name: "Select this page of Controlled sources" }));
  expect(screen.getByRole("checkbox", { name: "Select Alpha" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Select Beta" })).not.toBeChecked();
  await user.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByText("Gamma")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Previous page" }));
  expect(screen.getByRole("checkbox", { name: "Select Alpha" })).toBeChecked();
});
