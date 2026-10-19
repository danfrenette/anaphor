"use client";

import { useRef, useState, type MouseEvent, type ComponentProps, type ReactNode, type ReactElement } from "react";
import { ArrowDown, ArrowUp, ArrowsDownUp, CaretLeft, CaretRight, SlidersHorizontal, DotsThree, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Badge, Button, ButtonLabel, Checkbox, CheckboxGroup, Field, FieldLabel, Input, Menu, MenuItem, MenuPopup, MenuTrigger, Popover, PopoverBody, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger, Text, Tooltip, TooltipGroup, TooltipTrigger, TooltipPopup } from "@anaphor/system";
import { Check, Range, Select } from "./playground-fields";
import { TableFluidHover } from "./table-fluid-hover";
import { PlaygroundControls } from "./playground-host";

type RecordItem = { id: string; name: string; category: string; status: string; owner: string; budget: number };
const records: RecordItem[] = [
  { id: "PR–001", name: "Neighborhood field guide", category: "Publication", status: "In progress", owner: "Amara Okafor", budget: 12400 },
  { id: "PR–002", name: "Wayfinding for the waterfront", category: "Environment", status: "In review", owner: "Leo Chen", budget: 28750 },
  { id: "PR–003", name: "An archive of everyday objects", category: "Digital", status: "Planned", owner: "Sofia Reyes", budget: 8600 },
  { id: "PR–004", name: "Open house identity", category: "Identity", status: "Complete", owner: "Jules Martin", budget: 15200 },
  { id: "PR–005", name: "The long way home: stories from the northern coast", category: "Publication", status: "In progress", owner: "Amara Okafor", budget: 19250 },
  { id: "PR–006", name: "Community garden atlas", category: "Digital", status: "In review", owner: "Nour Haddad", budget: 6800 },
  { id: "PR–007", name: "Evening school", category: "Identity", status: "Planned", owner: "Leo Chen", budget: 9400 },
  { id: "PR–008", name: "Public library reading room", category: "Environment", status: "In progress", owner: "Sofia Reyes", budget: 42000 },
  { id: "PR–009", name: "Small press directory", category: "Publication", status: "Complete", owner: "Nour Haddad", budget: 3750 },
  { id: "PR–010", name: "A season of shared meals", category: "Digital", status: "Planned", owner: "Jules Martin", budget: 11200 },
  { id: "PR–011", name: "Museum after hours", category: "Environment", status: "In review", owner: "Amara Okafor", budget: 31500 },
  { id: "PR–012", name: "Common ground", category: "Identity", status: "Complete", owner: "Nour Haddad", budget: 17800 },
];
const columns = ["name", "status", "owner", "budget"] as const;
type Column = typeof columns[number];
const labels: Record<Column, string> = { name: "Project", status: "Status", owner: "Owner", budget: "Budget" };
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const defaults = { treatment: "Horizontal rules", density: "Editorial", responsive: "Cards", configuration: "Full", state: "Records", width: 840, selection: true, rowClick: false, actions: true } as const;
type Settings = { treatment: "Borderless" | "Horizontal rules" | "Full grid"; density: "Editorial" | "Compact"; responsive: "Cards" | "Scroll"; configuration: "Full" | "Minimal"; state: "Records" | "Loading" | "Empty" | "Error"; width: number; selection: boolean; rowClick: boolean; actions: boolean };

function Action({ children, ...props }: Omit<ComponentProps<typeof Button>, "nativeButton" | "type" | "variant" | "tone" | "size" | "shape" | "loading">) {
  return <Button nativeButton type="button" variant="outline" tone="neutral" size="sm" shape="square" loading={false} {...props}>{children}</Button>;
}

function Hint({ children, text }: { children: ReactElement; text: string }) {
  return <Tooltip><TooltipTrigger render={children} /><TooltipPopup side="top" align="center" sideOffset={6}>{text}</TooltipPopup></Tooltip>;
}

function ProjectName({ item }: { item: RecordItem }) {
  return <Popover><Hint text={item.name}><PopoverTrigger className="block min-h-11 w-full truncate text-start font-medium underline-offset-4 hover:underline">{item.name}</PopoverTrigger></Hint>
    <PopoverPopup side="bottom" align="start" sideOffset={8}><PopoverBody>
      <PopoverTitle>{item.name}</PopoverTitle><PopoverDescription>{item.id} · {item.category}</PopoverDescription>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-ui"><dt>Status</dt><dd>{item.status}</dd><dt>Owner</dt><dd>{item.owner}</dd><dt>Budget</dt><dd className="tabular-nums">{currency.format(item.budget)}</dd></dl>
    </PopoverBody></PopoverPopup></Popover>;
}

function value(item: RecordItem, column: Column): ReactNode {
  if (column === "name") return <div><ProjectName item={item} /><span className="block truncate text-small text-muted-foreground">{item.id} · {item.category}</span></div>;
  if (column === "status") return <Badge size="sm" variant="outline" shape="round" className="whitespace-nowrap"><span aria-hidden="true" className={`size-1.5 rounded-full ${item.status === "In progress" ? "bg-primary" : item.status === "Complete" ? "bg-foreground" : "border border-muted-foreground"}`} />{item.status}</Badge>;
  if (column === "budget") return currency.format(item.budget);
  return <Hint text={item[column]}><span className="block truncate" tabIndex={0}>{item[column]}</span></Hint>;
}

export function DataTablePlayground() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All statuses" | "Planned" | "In progress" | "In review" | "Complete">("All statuses");
  const [sort, setSort] = useState<{ column: Column; descending: boolean } | null>(null);
  const [visible, setVisible] = useState<Column[]>([...columns]);
  const [order, setOrder] = useState<Column[]>([...columns]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const full = settings.configuration === "Full";
  const selection = full && settings.selection;
  const activeColumns = full ? order.filter(column => visible.includes(column)) : [...columns];
  const actions = full && settings.actions;
  const matching = records.filter(item => !full || ((`${item.name} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())) && (status === "All statuses" || item.status === status)));
  const sorted = [...matching].sort((a, b) => {
    if (!sort || !full) return 0;
    const left = a[sort.column]; const right = b[sort.column];
    const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
    return sort.descending ? -result : result;
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / 6));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = sorted.slice(currentPage * 6, currentPage * 6 + 6);
  const allSelected = rows.length > 0 && rows.every(row => selected.includes(row.id));
  const someSelected = rows.some(row => selected.includes(row.id));
  const cellPadding = settings.density === "Compact" ? "px-3 py-2" : "px-4 py-4";
  const borders = settings.treatment === "Full grid" ? "border border-border" : settings.treatment === "Horizontal rules" ? "border-b border-border" : "";
  const cardMode = settings.responsive === "Cards";
  const resetQuery = () => { setQuery(""); setStatus("All statuses"); setSelected([]); setPage(0); };
  const reset = () => { setSettings(defaults); resetQuery(); setSort(null); setVisible([...columns]); setOrder([...columns]); };
  const toggle = (id: string, checked: boolean) => setSelected(current => checked ? [...new Set([...current, id])] : current.filter(value => value !== id));
  const sortBy = (column: Column) => { setSort(current => current?.column !== column ? { column, descending: false } : !current.descending ? { column, descending: true } : null); setPage(0); };
  const rowCheckbox = (item: RecordItem) => <Field orientation="horizontal" className="min-h-11 justify-center"><Checkbox aria-label={`Select ${item.name}`} checked={selected.includes(item.id)} onCheckedChange={checked => toggle(item.id, checked)} /></Field>;
  const selectPage = <Checkbox aria-label="Select this page" checked={allSelected} indeterminate={!allSelected && someSelected} disabled={rows.length === 0} onCheckedChange={checked => setSelected(current => checked ? [...new Set([...current, ...rows.map(row => row.id)])] : current.filter(id => !rows.some(row => row.id === id)))} />;
  const moveColumn = (column: Column, direction: number) => setOrder(current => {
    const next = [...current]; const index = next.indexOf(column); const other = index + direction;
    if (other < 0 || other >= next.length) return current;
    const neighbor = next[other];
    if (neighbor === undefined) return current;
    next[index] = neighbor; next[other] = column;
    return next;
  });

  function selectRow(event: MouseEvent<HTMLElement>, item: RecordItem) {
    if (!selection || !settings.rowClick || !(event.target instanceof Element)) return;
    if (!event.currentTarget.contains(event.target) || event.target.closest('button, a, input, label, [role="checkbox"], [role="menuitem"], [contenteditable], [data-slot="field"]')) return;
    if (window.getSelection()?.toString()) return;
    toggle(item.id, !selected.includes(item.id));
  }
  const rowActions = (item: RecordItem) => <Menu>
    <MenuTrigger aria-label={`Actions for ${item.name}`} render={<Button nativeButton type="button" variant="ghost" tone="neutral" size="sm" shape="square" iconOnly loading={false} className="size-11" />}><DotsThree aria-hidden="true" size={20} /></MenuTrigger>
    <MenuPopup side="bottom" align="end" sideOffset={6} aria-label={`Actions for ${item.name}`}>
      {selection && <MenuItem variant="default" onClick={() => toggle(item.id, !selected.includes(item.id))}>{selected.includes(item.id) ? "Deselect project" : "Select project"}</MenuItem>}
      <MenuItem variant="default" onClick={() => { setQuery(item.owner); setStatus("All statuses"); setSelected([]); setPage(0); }}>Show projects by {item.owner}</MenuItem>
    </MenuPopup>
  </Menu>;

  return <TooltipGroup delay={400} closeDelay={80} timeout={400}>
    <PlaygroundControls sectionId="data-table" title="Data table" onReset={reset}>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Treatment" value={settings.treatment} options={["Borderless", "Horizontal rules", "Full grid"]} onChange={treatment => setSettings(s => ({ ...s, treatment }))} />
        <Select label="Density" value={settings.density} options={["Editorial", "Compact"]} onChange={density => setSettings(s => ({ ...s, density }))} />
        <Select label="Narrow layout" value={settings.responsive} options={["Cards", "Scroll"]} onChange={responsive => setSettings(s => ({ ...s, responsive }))} />
        <Select label="Configuration" value={settings.configuration} options={["Full", "Minimal"]} onChange={configuration => setSettings(s => ({ ...s, configuration }))} />
        <Select label="Preview state" value={settings.state} options={["Records", "Loading", "Empty", "Error"]} onChange={state => setSettings(s => ({ ...s, state }))} />
        <Check label="Row selection" checked={settings.selection} onChange={selection => setSettings(s => ({ ...s, selection }))} />
        <Check label="Select by clicking a row" checked={settings.rowClick} onChange={rowClick => setSettings(s => ({ ...s, rowClick }))} />
        <Check label="Row actions" checked={settings.actions} onChange={actions => setSettings(s => ({ ...s, actions }))} />
        <Range label="Preview width" value={settings.width} min={280} max={840} step={20} unit="px" onChange={width => setSettings(s => ({ ...s, width }))} />
      </div>
    </PlaygroundControls>
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Table treatment">
      {(["Borderless", "Horizontal rules", "Full grid"] as const).map(treatment => <Action iconOnly={false} key={treatment} aria-pressed={settings.treatment === treatment} className={settings.treatment === treatment ? "bg-muted" : ""} onClick={() => setSettings(s => ({ ...s, treatment }))}><ButtonLabel>{treatment}</ButtonLabel></Action>)}
    </div>
    <div className="max-w-full" style={{ width: settings.width }}>
      <div className="@container rounded-md border border-border bg-background" role="group" aria-label="Data table preview">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-5 pb-4"><div><Text as="h3" variant="subheading">Studio projects</Text><Text as="p" variant="caption" className="mt-1">A shared view of the work in progress.</Text></div><span className="font-mono text-small text-muted-foreground">{settings.state === "Empty" ? 0 : records.length} records</span></div>
        {full && <div className="flex flex-wrap items-end gap-3 border-t border-border px-4 py-4">
          <form role="search" aria-label="Filter studio projects" className="min-w-0 flex-[1_1_180px]" onSubmit={event => { event.preventDefault(); setPage(0); }}><Field orientation="vertical"><FieldLabel>Search projects</FieldLabel><div className="relative"><MagnifyingGlass aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2" /><Input ref={searchRef} type="search" enterKeyHint="search" autoComplete="off" spellCheck={false} data-1p-ignore data-lpignore="true" size="md" className="min-h-11 ps-9 pe-11 [&::-webkit-search-cancel-button]:appearance-none" placeholder="Name or owner…" value={query} onValueChange={next => { setQuery(next); setSelected([]); setPage(0); }} />{query && <button type="button" aria-label="Clear search" className="absolute end-0 top-0 grid size-11 place-items-center rounded-control text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setQuery(""); setSelected([]); setPage(0); searchRef.current?.focus(); }}><X aria-hidden="true" /></button>}</div></Field></form>
          <Select label="Status" value={status} options={["All statuses", "Planned", "In progress", "In review", "Complete"]} onChange={next => { setStatus(next); setSelected([]); setPage(0); }} />
          <Popover><Hint text="Configure columns"><PopoverTrigger aria-label="Configure columns" render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly loading={false} className="size-11" />}><SlidersHorizontal aria-hidden="true" /></PopoverTrigger></Hint>
            <PopoverPopup side="bottom" align="end" sideOffset={8}><PopoverBody><PopoverTitle>Columns</PopoverTitle><PopoverDescription>Check columns to show them. Move them up or down to change their position from left to right.</PopoverDescription>
              <CheckboxGroup className="mt-4 grid gap-2">{order.map((column, index) => <div className="flex items-center gap-2" key={column}>
                <Field orientation="horizontal" className="min-h-11 flex-1"><Checkbox checked={visible.includes(column)} disabled={column === "name"} onCheckedChange={checked => setVisible(current => checked ? [...current, column] : current.filter(value => value !== column))} /><FieldLabel>{labels[column]}{column === "name" && <span className="ms-2 text-small text-muted-foreground">Required</span>}</FieldLabel></Field>
                <Hint text={`Move ${labels[column]} earlier`}><Action iconOnly aria-label={`Move ${labels[column]} earlier`} disabled={index === 0} onClick={() => moveColumn(column, -1)}><ArrowUp aria-hidden="true" /></Action></Hint><Hint text={`Move ${labels[column]} later`}><Action iconOnly aria-label={`Move ${labels[column]} later`} disabled={index === order.length - 1} onClick={() => moveColumn(column, 1)}><ArrowDown aria-hidden="true" /></Action></Hint>
              </div>)}</CheckboxGroup><p className="mt-3 text-small text-muted-foreground">Selection stays first; actions stay last.</p><Action iconOnly={false} className="mt-4 w-full" onClick={() => { setVisible([...columns]); setOrder([...columns]); }}><ButtonLabel>Reset columns</ButtonLabel></Action>
            </PopoverBody></PopoverPopup>
          </Popover>
          <div className={cardMode ? "w-full @[640px]:hidden" : "hidden"}><Select label="Sort records" value={sort ? `${labels[sort.column]} ${sort.descending ? "descending" : "ascending"}` : "Original order"} options={["Original order", ...activeColumns.flatMap(column => [`${labels[column]} ascending`, `${labels[column]} descending`])]} onChange={next => { const column = columns.find(column => next.startsWith(`${labels[column]} `)); setSort(column ? { column, descending: next.endsWith("descending") } : null); setPage(0); }} /></div>
          {(query || status !== "All statuses") && <Action iconOnly={false} onClick={resetQuery}><ButtonLabel>Reset filters</ButtonLabel></Action>}
        </div>}
        {settings.state === "Records" && selection && <div className="flex min-h-12 flex-wrap items-center gap-3 border-t border-border px-4 py-2 text-small tabular-nums" aria-live="polite"><span>{selected.length} selected</span><Action iconOnly={false} className={selected.length === 0 ? "invisible" : ""} onClick={() => setSelected([])}><ButtonLabel>Clear selection</ButtonLabel></Action><span className="ms-auto text-muted-foreground">Select across pages</span></div>}
        {settings.state === "Loading" ? <div className="grid gap-5 px-4 py-6" role="status"><span className="text-ui text-muted-foreground">Loading projects…</span>{[0, 1, 2, 3].map(row => <div key={row} className="h-10 rounded-sm bg-muted" aria-hidden="true" />)}</div>
          : settings.state === "Error" ? <div className="grid min-h-64 place-content-center justify-items-center gap-3 px-4 text-center" role="alert"><Text as="h4" variant="subheading">Projects couldn’t load</Text><p className="text-ui text-muted-foreground">Try loading the collection again.</p><Action iconOnly={false} onClick={() => setSettings(s => ({ ...s, state: "Records" }))}><ButtonLabel>Try again</ButtonLabel></Action></div>
          : settings.state === "Empty" || rows.length === 0 ? <div className="grid min-h-64 place-content-center justify-items-center gap-3 px-4 text-center" role="status"><Text as="h4" variant="subheading">{settings.state === "Empty" ? "No projects yet" : "No matching projects"}</Text><p className="text-ui text-muted-foreground">{settings.state === "Empty" ? "Projects will appear here once they’re added." : "Try another name or clear your filters."}</p>{settings.state !== "Empty" && <Action iconOnly={false} onClick={resetQuery}><ButtonLabel>Clear filters</ButtonLabel></Action>}</div>
          : <CheckboxGroup>
            <div className={cardMode ? "hidden @[640px]:block" : "block"}>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Project table, scroll horizontally for more columns">
                <TableFluidHover><table className="w-full table-fixed border-collapse text-ui" style={{ minWidth: activeColumns.reduce((width, column) => width + (column === "name" ? 240 : 140), (selection ? 56 : 0) + (actions ? 56 : 0)) }}>
                  <caption className="sr-only">Studio projects</caption>
                  <colgroup>{selection && <col style={{ width: 56 }} />}{activeColumns.map(column => <col key={column} style={{ width: column === "name" ? 240 : 140 }} />)}{actions && <col style={{ width: 56 }} />}</colgroup>
                  <thead className="bg-muted"><tr>{selection && <th scope="col" className={`w-14 px-4 py-3 ${borders}`}>{selectPage}</th>}{activeColumns.map(column => <th key={column} scope="col" aria-sort={sort?.column === column && full ? sort.descending ? "descending" : "ascending" : undefined} className={`${cellPadding} ${borders} ${column === "budget" ? "text-end" : "text-start"} font-medium`}>
                    {full ? <button type="button" className={`-mx-2 inline-flex min-h-8 items-center gap-2 rounded-sm px-2 whitespace-nowrap hover:bg-background focus-visible:outline-2 focus-visible:outline-ring motion-safe:transition-[background-color,transform] motion-safe:duration-125 motion-safe:active:scale-[0.97] pointer-coarse:min-h-11 ${column === "budget" ? "justify-end" : ""}`} aria-label={`Sort by ${labels[column]}: ${sort?.column !== column ? "ascending" : sort.descending ? "clear sorting" : "descending"}`} onClick={() => sortBy(column)}>{labels[column]}{sort?.column === column ? sort.descending ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" /> : <ArrowsDownUp aria-hidden="true" className="text-muted-foreground" />}</button> : labels[column]}
                  </th>)}{actions && <th scope="col" className={`px-2 ${borders}`}><span className="sr-only">Actions</span></th>}</tr></thead>
                  <tbody>{rows.map(item => <tr data-fluid-row key={item.id} onClick={event => selectRow(event, item)} className={selection && selected.includes(item.id) ? "bg-muted" : ""}>{selection && <td className={`px-4 ${borders}`}>{rowCheckbox(item)}</td>}{activeColumns.map(column => <td key={column} className={`${cellPadding} ${borders} break-words ${column === "budget" ? "text-end tabular-nums" : ""}`}>{value(item, column)}</td>)}{actions && <td className={`px-1 text-center ${borders}`}>{rowActions(item)}</td>}</tr>)}</tbody>
                </table></TableFluidHover>
              </div>
            </div>
            <div className={cardMode ? "@[640px]:hidden" : "hidden"}>
              {selection && <label className="flex min-h-14 cursor-pointer items-center gap-4 border-t border-border px-5">{selectPage}<span className="text-ui">Select this page</span></label>}
              <TableFluidHover><ul className={`grid grid-cols-1 ${settings.treatment === "Full grid" ? "gap-3 p-3" : ""}`}>{rows.map(item => <li data-fluid-row key={item.id} onClick={event => selectRow(event, item)} className={`${cellPadding} ${borders} ${selection && selected.includes(item.id) ? "bg-muted" : ""}`}>
                <div className="flex items-start gap-3">{selection && rowCheckbox(item)}<div className="min-w-0 flex-1">{value(item, "name")}</div>{actions && rowActions(item)}</div>
                <dl className="mt-4 grid gap-3">{activeColumns.filter(column => column !== "name").map(column => <div key={column} className="flex flex-wrap items-center justify-between gap-2 text-ui"><dt className="text-muted-foreground">{labels[column]}</dt><dd className="tabular-nums">{value(item, column)}</dd></div>)}</dl>
              </li>)}</ul></TableFluidHover>
            </div>
          </CheckboxGroup>}
        {settings.state === "Records" && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-small"><span className="text-muted-foreground tabular-nums" aria-live="polite">{sorted.length ? currentPage * 6 + 1 : 0}–{Math.min((currentPage + 1) * 6, sorted.length)} of {sorted.length}</span><div className="flex items-center gap-2"><Action iconOnly aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><CaretLeft aria-hidden="true" /></Action><span className="tabular-nums">{currentPage + 1} / {pageCount}</span><Action iconOnly aria-label="Next page" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}><CaretRight aria-hidden="true" /></Action></div></div>}
      </div>
    </div>
  </TooltipGroup>;
}
