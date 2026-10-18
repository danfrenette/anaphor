import { Section, Text } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { records } from "./data-table-data";
import { DataTablePlayground } from "./data-table-playground";

const treatments = [
  { name: "Borderless", border: "", description: "Whitespace separates the rows." },
  { name: "Horizontal rules", border: "border-b border-border", description: "Rules provide a steady reading track across columns." },
  { name: "Full grid", border: "border border-border", description: "Cell borders make each value easy to locate." },
] as const;
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function TableSample({ label, border, compact }: { label: string; border: string; compact: boolean }) {
  const padding = compact ? "px-3 py-2" : "px-4 py-4";
  return <div className="overflow-x-auto" role="region" aria-label={`${label} table preview`} tabIndex={0}>
    <table className="w-full min-w-96 border-collapse text-ui">
      <caption className="sr-only">{label} project comparison</caption>
      <thead className="bg-muted"><tr>
        <th scope="col" className={`${padding} ${border} text-start font-medium`}>Project</th>
        <th scope="col" className={`${padding} ${border} text-start font-medium`}>Status</th>
        <th scope="col" className={`${padding} ${border} text-end font-medium`}>Budget</th>
      </tr></thead>
      <tbody>{records.slice(0, 3).map(item => <tr key={item.id}>
        <td className={`${padding} ${border}`}>{item.name}</td>
        <td className={`${padding} ${border}`}>{item.status}</td>
        <td className={`${padding} ${border} text-end tabular-nums`}>{currency.format(item.budget)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function DataTableDemo() {
  return <Section id="data-table" className="border-t border-border py-12">
    <Text as="h2" variant="title">Data table</Text>
    <Text as="p" variant="description" className="mt-3">One collection, different ways to read it. Compare the structure before choosing the details.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Table treatments" description="The same three projects, with only the borders changed." code={`// Native table composition; apply the treatment to th and td.
const borders = treatment === "Full grid" ? "border border-border"
  : treatment === "Horizontal rules" ? "border-b border-border" : "";

<table className="w-full border-collapse text-ui">
  <thead className="bg-muted">{/* Column headers */}</thead>
  <tbody>
    {records.map(item => <tr key={item.id}>
      <td className={\`px-3 py-2 \${borders}\`}>{item.name}</td>
      {/* Status and budget cells */}
    </tr>)}
  </tbody>
</table>`}>
        <div className="grid min-w-0 gap-8">
          {treatments.map(treatment => <div key={treatment.name} className="min-w-0">
            <h4 className="font-sans text-ui font-medium normal-case text-muted-foreground">{treatment.name}</h4>
            <p className="mt-1 mb-4 text-small text-muted-foreground">{treatment.description}</p>
            <TableSample label={treatment.name} border={treatment.border} compact />
          </div>)}
        </div>
      </CatalogExample>
      <CatalogExample title="Density" description="Compact and editorial spacing use the same records and horizontal rules." code={`const cellPadding = density === "Compact" ? "px-3 py-2" : "px-4 py-4";

<td className={\`\${cellPadding} border-b border-border\`}>
  {item.name}
</td>`}>
        <div className="grid min-w-0 gap-8">
          {(["Compact", "Editorial"] as const).map(density => <div key={density} className="min-w-0">
            <h4 className="mb-4 font-sans text-ui font-medium normal-case text-muted-foreground">{density}</h4>
            <TableSample label={density} border="border-b border-border" compact={density === "Compact"} />
          </div>)}
        </div>
      </CatalogExample>
      <div>
        <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
        <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore configuration, density, and loading, empty, or error states. Narrow layouts can use cards or a scrolling table.</p>
        <div className="mt-4"><DataTablePlayground /></div>
        <p className="mt-4 text-small text-muted-foreground">This table is a demo-owned composition of native HTML and shared controls, not an exported Data Table component.</p>
      </div>
    </div>
  </Section>;
}
