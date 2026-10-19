"use client";

import { Kbd, KbdGroup, Section, Text } from "@anaphor/system";
import { useState } from "react";
import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Select } from "./playground-fields";

const keys = [
  { value: "K", label: "Letter" },
  { value: "Esc", label: "Escape" },
  { value: "Enter", label: "Enter" },
  { value: "⌘", label: "Command" },
  { value: "⇧", label: "Shift" },
];
const combinationsCode = `<KbdGroup aria-label="Command K">
  <Kbd>⌘</Kbd><Kbd>K</Kbd>
</KbdGroup>

<KbdGroup aria-label="G then A">
  <Kbd>G</Kbd><span aria-hidden="true">then</span><Kbd>A</Kbd>
</KbdGroup>`;

export function KbdDemo() {
  const [example, setExample] = useState<"Single key" | "Chord" | "Sequence">("Chord");
  const [platform, setPlatform] = useState<"Mac" | "Windows">("Mac");
  const modifier = platform === "Mac" ? "⌘" : "Ctrl";
  const modifierLabel = platform === "Mac" ? "Command" : "Control";
  const code = example === "Single key" ? "<Kbd>Esc</Kbd>" : example === "Sequence"
    ? `<KbdGroup aria-label="G then A">
  <Kbd>G</Kbd><span aria-hidden="true">then</span><Kbd>A</Kbd>
</KbdGroup>`
    : `<KbdGroup aria-label="${modifierLabel} K">
  <Kbd>${modifier}</Kbd><Kbd>K</Kbd>
</KbdGroup>`;
  return <Section id="kbd" className="border-t border-border py-12">
    <Text as="h2" variant="title">Kbd</Text>
    <Text as="p" variant="description" className="mt-3">Shows the keys behind an action without owning the shortcut.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Keys" description="Letters, named keys, and modifier symbols share the same keycap." code={'<Kbd>K</Kbd>\n<Kbd>Esc</Kbd>\n<Kbd>Enter</Kbd>\n<Kbd aria-label="Command">⌘</Kbd>\n<Kbd aria-label="Shift">⇧</Kbd>'}>
        <div className="flex flex-wrap gap-x-8 gap-y-6">{keys.map(key => <div key={key.value} className="grid justify-items-start gap-3">
          <Kbd aria-label={key.value === "K" ? "K" : key.label}>{key.value}</Kbd>
          <span className="text-small text-muted-foreground">{key.label}</span>
        </div>)}</div>
      </CatalogExample>
      <CatalogExample title="Combinations" description="Press a chord together. Follow a sequence one key at a time." code={combinationsCode}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid content-start gap-3">
            <h4 className="font-sans text-ui font-medium normal-case text-muted-foreground">Chord</h4>
            <div className="flex flex-wrap items-center gap-3"><KbdGroup aria-label="Command K"><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup><span className="text-small text-muted-foreground">or</span><KbdGroup aria-label="Control K"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup></div>
            <p className="text-small text-muted-foreground">Hold the modifier and press K.</p>
          </div>
          <div className="grid content-start gap-3">
            <h4 className="font-sans text-ui font-medium normal-case text-muted-foreground">Sequence</h4>
            <KbdGroup aria-label="G then A"><Kbd>G</Kbd><span aria-hidden="true" className="px-1 font-sans text-small text-muted-foreground">then</span><Kbd>A</Kbd></KbdGroup>
            <p className="text-small text-muted-foreground">Press G, release it, then press A.</p>
          </div>
        </div>
      </CatalogExample>
      <PlaygroundControls sectionId="kbd" title="Kbd" onReset={() => { setExample("Chord"); setPlatform("Mac"); }}>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Example" value={example} options={["Single key", "Chord", "Sequence"]} onChange={setExample} />
          <Select label="Platform notation" value={platform} options={["Mac", "Windows"]} onChange={setPlatform} />
        </div>
        <p className="mt-3 text-small text-muted-foreground">Platform notation changes the chord’s modifier. Single keys and sequences stay the same.</p>
      </PlaygroundControls>
      <CatalogExample title="Playground" description="Use Controls to choose a preset and platform notation. Show code reflects the current preview." code={code}>
        <div role="group" aria-label="Keyboard notation preview" className="grid min-h-24 content-center justify-items-center gap-4">
          {example === "Single key" ? <Kbd>Esc</Kbd> : example === "Sequence" ? <KbdGroup aria-label="G then A"><Kbd>G</Kbd><span aria-hidden="true" className="px-1 font-sans text-small text-muted-foreground">then</span><Kbd>A</Kbd></KbdGroup> : <KbdGroup aria-label={`${modifierLabel} K`}><Kbd>{modifier}</Kbd><Kbd>K</Kbd></KbdGroup>}
          <p className="text-small text-muted-foreground">{example === "Single key" ? "Press one key." : example === "Chord" ? "Press both keys together." : "Press the keys in order."}</p>
        </div>
      </CatalogExample>
    </div>
    <p className="mt-4 text-small text-muted-foreground">Kbd displays a shortcut; it doesn’t register one. Applications own platform selection and shortcut behavior.</p>
  </Section>;
}
