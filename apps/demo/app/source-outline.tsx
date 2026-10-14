"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger, Text } from "@anaphor/system";
import { CaretRight } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

function Chapter({ label, children, defaultOpen = false }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  return <li><Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger><CaretRight aria-hidden="true" /><span className="min-w-0 [overflow-wrap:anywhere]">{label}</span></CollapsibleTrigger>
    <CollapsibleContent><ul className="ms-4 border-s border-border ps-2 py-1">{children}</ul></CollapsibleContent>
  </Collapsible></li>;
}

export function SourceOutline() {
  const [selected, setSelected] = useState("1.1 Knowledge crunching");
  function section(label: string) {
    return <li><button type="button" aria-current={selected === label ? "true" : undefined} onClick={() => setSelected(label)}
      className="min-h-9 w-full rounded-md px-2 py-2 text-start text-ui text-foreground [overflow-wrap:anywhere] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-current:bg-muted aria-current:font-medium pointer-coarse:min-h-11">{label}</button></li>;
  }
  return <nav aria-label="Source outline" className="min-w-0 px-2 pb-6">
    <Text as="h2" variant="label" className="px-2 text-muted-foreground">Source outline</Text>
    <Text as="p" variant="ui" className="mt-3 px-2 font-semibold text-foreground">Domain-Driven Design</Text>
    <Text as="p" variant="caption" className="mt-1 px-2">Book · 3 chapters</Text>
    <Text as="h3" variant="label" className="mt-6 px-2 text-muted-foreground">Contents</Text>
    <ul className="mt-2 space-y-1">
      <Chapter label="1 Putting the domain model to work" defaultOpen>
        {section("1.1 Knowledge crunching")}
        {section("1.2 Continuous learning")}
        {section("1.3 A language for the team")}
      </Chapter>
      <Chapter label="2 Communication and language">
        <Chapter label="2.1 Model conversations">{section("2.1.1 Shared vocabulary")}</Chapter>
        {section("2.2 Ubiquitous language")}
      </Chapter>
      <Chapter label="3 Binding model and implementation">{section("3.1 Connecting the model to working software")}</Chapter>
    </ul>
  </nav>;
}
