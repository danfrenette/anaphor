"use client";

import { ChartBarIcon, ClockCounterClockwiseIcon, FolderIcon } from "@phosphor-icons/react";
import { Section, Tabs, TabsList, TabsPanel, TabsTab, Text } from "@anaphor/system";
import { useState } from "react";
import { CatalogExample } from "./catalog-example";
import { Check, Select } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";

const collections = [
  { value: "library", title: "Library", description: "Twelve saved references, arranged by the work they support.", icon: FolderIcon },
  { value: "recents", title: "Recents", description: "The four references opened during this session.", icon: ClockCounterClockwiseIcon },
  { value: "reports", title: "Reports", description: "A compact view of reading activity and saved notes.", icon: ChartBarIcon },
];
type Variant = "default" | "lifted" | "line";
type Size = "sm" | "md" | "lg";
type Orientation = "horizontal" | "vertical";

function CollectionTabs({ label, variant = "default", size = "md", orientation = "horizontal", icons = false, disabled = false, value, onValueChange }: { label: string; variant?: Variant; size?: Size; orientation?: Orientation; icons?: boolean; disabled?: boolean; value?: string; onValueChange?: (value: string) => void }) {
  return <Tabs defaultValue="library" value={value} onValueChange={next => { if (typeof next === "string") onValueChange?.(next); }} orientation={orientation} className="min-w-0 gap-4 overflow-x-auto">
    <TabsList aria-label={label} variant={variant} size={size} className="max-w-full shrink-0">
      {collections.map(({ value, title, icon: Icon }) => <TabsTab key={value} value={value} disabled={disabled && value === "reports"}>{icons && <Icon aria-hidden="true" />}{title}</TabsTab>)}
    </TabsList>
    <div className="min-h-28 min-w-0 flex-1">
      {collections.map(collection => <TabsPanel key={collection.value} value={collection.value}>
        <Text as="h4" variant="ui" className="font-medium">{collection.title}</Text>
        <Text as="p" variant="caption" className="mt-2">{collection.description}</Text>
      </TabsPanel>)}
    </div>
  </Tabs>;
}

function exampleCode({ variant = "default", size = "md", orientation = "horizontal", icons = false, disabled = false }: { variant?: Variant; size?: Size; orientation?: Orientation; icons?: boolean; disabled?: boolean } = {}) {
  const iconNames = ["FolderIcon", "ClockCounterClockwiseIcon", "ChartBarIcon"];
  return `<Tabs defaultValue="library" orientation="${orientation}">
  <TabsList aria-label="Collections" variant="${variant}" size="${size}">
${collections.map((collection, index) => `    <TabsTab value="${collection.value}"${disabled && collection.value === "reports" ? " disabled" : ""}>${icons ? `<${iconNames[index]} aria-hidden="true" />` : ""}${collection.title}</TabsTab>`).join("\n")}
  </TabsList>
${collections.map(collection => `  <TabsPanel value="${collection.value}">${collection.description}</TabsPanel>`).join("\n")}
</Tabs>`;
}

export function TabsDemo() {
  const [variant, setVariant] = useState<Variant>("default");
  const [size, setSize] = useState<Size>("md");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [icons, setIcons] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [selected, setSelected] = useState("library");
  return <Section id="tabs" className="border-t border-border py-12">
    <Text as="h2" variant="title">Tabs</Text>
    <Text as="p" variant="description" className="mt-3">Switch between related views while keeping their shared context in place.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Variants" description="A contained active surface, the same surface lifted by a keyline and soft shadow, or a quieter underline, with the same selection behavior." code={`${exampleCode()}\n\n${exampleCode({ variant: "lifted" })}\n\n${exampleCode({ variant: "line" })}`}>
        <div className="grid gap-8 lg:grid-cols-2">{(["default", "lifted", "line"] as const).map(value => <div key={value} className="min-w-0 space-y-4"><h4 className="font-sans text-ui font-medium normal-case text-muted-foreground">{{ default: "Default", lifted: "Lifted", line: "Line" }[value]}</h4><CollectionTabs label={`${value} variant`} variant={value} /></div>)}</div>
      </CatalogExample>
      <CatalogExample title="Sizes" description="Small, medium, and large share the same layout and typography tokens." code={['<TabsList size="sm">{/* Tabs */}</TabsList>', '<TabsList size="md">{/* Tabs */}</TabsList>', '<TabsList size="lg">{/* Tabs */}</TabsList>'].join("\n")}>
        <div className="grid gap-6">{(["sm", "md", "lg"] as const).map((value, index) => <div key={value} className="grid min-w-0 gap-3 sm:grid-cols-[5rem_1fr] sm:items-center"><h4 className="font-sans text-ui font-medium normal-case text-muted-foreground">{["Small", "Medium", "Large"][index]}</h4><Tabs defaultValue="library" className="min-w-0 overflow-x-auto"><TabsList size={value} aria-label={`${value} size`}>{collections.map(collection => <TabsTab key={collection.value} value={collection.value}>{collection.title}</TabsTab>)}</TabsList>{collections.map(collection => <TabsPanel key={collection.value} value={collection.value} className="sr-only">{collection.description}</TabsPanel>)}</Tabs></div>)}</div>
      </CatalogExample>
      <CatalogExample title="Orientation & states" description="Stack navigation vertically when space allows. Disabled destinations remain visible and skip keyboard selection." code={exampleCode({ orientation: "vertical", disabled: true })}>
        <CollectionTabs label="Vertical collections" orientation="vertical" disabled />
      </CatalogExample>
      <PlaygroundControls sectionId="tabs" title="Tabs" onReset={() => { setVariant("default"); setSize("md"); setOrientation("horizontal"); setIcons(false); setDisabled(false); setSelected("library"); }}>
        <div className="grid grid-cols-2 gap-4"><Select label="Variant" value={variant} options={["default", "lifted", "line"]} onChange={setVariant} /><Select label="Size" value={size} options={["sm", "md", "lg"]} onChange={setSize} /><Select label="Orientation" value={orientation} options={["horizontal", "vertical"]} onChange={setOrientation} /><Check label="Icons" checked={icons} onChange={setIcons} /><Check label="Disable Reports" checked={disabled} onChange={value => { setDisabled(value); if (value && selected === "reports") setSelected("library"); }} /></div>
      </PlaygroundControls>
      <CatalogExample title="Playground" description="Use Controls to change the presentation. Select a view with the pointer or arrow keys." code={exampleCode({ variant, size, orientation, icons, disabled })}>
        <div role="group" aria-label="Tabs playground" className="min-h-60 overflow-x-auto"><CollectionTabs label="Collections" variant={variant} size={size} orientation={orientation} icons={icons} disabled={disabled} value={selected} onValueChange={setSelected} /></div>
      </CatalogExample>
    </div>
    <p className="mt-4 text-small text-muted-foreground">Pointer selection moves the active indicator. Keyboard selection and reduced motion settle immediately.</p>
  </Section>;
}
