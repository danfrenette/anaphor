import { Prose, Section, Text } from "@anaphor/system";
import { DataTablePlayground } from "./data-table-playground";

export function DataTableDemo() {
  return <Section id="data-table" className="border-t border-border py-12">
    <header>
      <Text as="p" variant="label" className="text-muted-foreground">02.09 / Data</Text>
      <Text as="h2" variant="title" className="mt-8">Data table</Text>
      <Text as="p" variant="description" className="mt-3">One collection, different ways to read it. Compare the structure before choosing the details.</Text>
    </header>
    <div className="mt-8"><DataTablePlayground /></div>
    <div className="mt-8 grid gap-6 sm:grid-cols-3">
      <div><Text as="h3" variant="subheading">Borderless</Text><Text as="p" variant="caption" className="mt-2">Whitespace carries the rows. Quiet and open; long records need more care to follow across.</Text></div>
      <div><Text as="h3" variant="subheading">Horizontal rules</Text><Text as="p" variant="caption" className="mt-2">A steady reading track. Separates records without enclosing every value.</Text></div>
      <div><Text as="h3" variant="subheading">Full grid</Text><Text as="p" variant="caption" className="mt-2">Every value has an address. Easier to compare across columns, with more visual structure.</Text></div>
    </div>
    <Prose as="div" className="mt-8"><p>Use the controls to compare a minimal view with a working toolbar, compact and editorial spacing, and loading or empty states. Narrow the preview to see the same records become labeled cards or remain a scrolling table. Theme follows the manual.</p><p>This is a visual exploration. The reusable table, advanced filters, column resizing and pinning, and extended selection behavior follow after this pass.</p></Prose>
  </Section>;
}
