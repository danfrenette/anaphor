"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTab, TabsPanel, Text } from "@anaphor/system";
import { DataTablePlayground } from "./data-table-playground";

export function DataTableExamples({ catalog, treatments, density }: { catalog: ReactNode; treatments: ReactNode; density: ReactNode }) {
  const [example, setExample] = useState("catalog");
  return <Tabs value={example} onValueChange={value => { if (typeof value === "string") setExample(value); }} className="mt-8 min-w-0 gap-6">
    <div className="max-w-full overflow-x-auto">
      <TabsList variant="line" size="md" aria-label="Data table examples">
        <TabsTab value="catalog" className="min-h-11">Catalog</TabsTab>
        <TabsTab value="treatments" className="min-h-11">Treatments</TabsTab>
        <TabsTab value="density" className="min-h-11">Density</TabsTab>
        <TabsTab value="advanced" className="min-h-11">Advanced</TabsTab>
      </TabsList>
    </div>
    <TabsPanel value="catalog" keepMounted className="min-w-0 data-[hidden]:hidden">{catalog}</TabsPanel>
    <TabsPanel value="treatments" keepMounted className="min-w-0 data-[hidden]:hidden">{treatments}</TabsPanel>
    <TabsPanel value="density" keepMounted className="min-w-0 data-[hidden]:hidden">{density}</TabsPanel>
    <TabsPanel value="advanced" keepMounted className="min-w-0 space-y-4 data-[hidden]:hidden">
      <div><Text as="h3" variant="heading">Advanced playground</Text><Text as="p" variant="description" className="mt-2">Explore column order, density, and responsive behavior with Controls.</Text></div>
      <DataTablePlayground active={example === "advanced"} />
      <p className="text-small text-muted-foreground">A native-table composition for additional experiments. The Catalog tab demonstrates the shared DataTable component.</p>
    </TabsPanel>
  </Tabs>;
}
