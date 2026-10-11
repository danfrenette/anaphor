"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger, Prose, Section, SidebarTrigger, Text } from "@anaphor/system";
import { CaretRight } from "@phosphor-icons/react";
import { useState } from "react";

export function CollapsibleDemo() {
  const [open, setOpen] = useState(false);
  return <Section id="collapsible" className="border-t border-border py-12">
    <Text as="p" variant="label" className="text-muted-foreground">02 / Disclosure</Text>
    <Text as="h2" variant="title" className="mt-8">Collapsible</Text>
    <Text as="p" variant="description" className="mt-3">Keep a long outline navigable. Reveal the section you need without changing your selection.</Text>
    <div className="mt-8 space-y-4">
      <Collapsible defaultOpen>
        <CollapsibleTrigger><CaretRight aria-hidden="true" />Reading notes</CollapsibleTrigger>
        <CollapsibleContent><p className="px-8 py-3 text-body">A shared language grows through conversations about the model.</p></CollapsibleContent>
      </Collapsible>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger><CaretRight aria-hidden="true" />Controlled section</CollapsibleTrigger>
        <CollapsibleContent><div className="px-8 py-3"><p>Expansion belongs to the consuming application.</p><button type="button" className="mt-3 min-h-11 rounded-md border border-border px-3 focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setOpen(false)}>Close from inside</button></div></CollapsibleContent>
      </Collapsible>
      <Collapsible disabled><CollapsibleTrigger><CaretRight aria-hidden="true" />Unavailable section</CollapsibleTrigger><CollapsibleContent>Unavailable content</CollapsibleContent></Collapsible>
    </div>
    <div role="group" aria-label="Disclosure controls" className="mt-6 flex flex-wrap gap-3">
      <button type="button" aria-pressed={open} onClick={() => setOpen(!open)} className="min-h-11 rounded-md border border-border px-3 text-ui focus-visible:outline-2 focus-visible:outline-ring">{open ? "Close" : "Open"} controlled section</button>
      <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-md border border-border px-3 text-ui focus-visible:outline-2 focus-visible:outline-ring">Reset controlled example</button>
    </div>
    <Text as="h3" variant="heading" className="mt-8">Nested reading notes</Text>
    <Text as="p" variant="description" className="mt-3">Each level opens independently. Close Reading journal, then use your browser’s Find command to search for a phrase from the notes inside.</Text>
    <div role="group" aria-label="Nested reading notes" className="mt-4">
      <Collapsible defaultOpen>
        <CollapsibleTrigger><CaretRight aria-hidden="true" />Reading journal</CollapsibleTrigger>
        <CollapsibleContent><div className="ms-4 border-s border-border ps-2 py-1">
          <Collapsible defaultOpen>
            <CollapsibleTrigger><CaretRight aria-hidden="true" />Chapter notes</CollapsibleTrigger>
            <CollapsibleContent><div className="ms-4 border-s border-border ps-2 py-1">
              <Collapsible>
                <CollapsibleTrigger><CaretRight aria-hidden="true" />Field observations</CollapsibleTrigger>
                <CollapsibleContent><p className="px-8 py-3 text-body">The orchard notebook connects field observations to a shared language.</p></CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger><CaretRight aria-hidden="true" />Questions to revisit</CollapsibleTrigger>
                <CollapsibleContent><p className="px-8 py-3 text-body">Which assumptions changed after talking with the people doing the work?</p></CollapsibleContent>
              </Collapsible>
            </div></CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger><CaretRight aria-hidden="true" />Further reading</CollapsibleTrigger>
            <CollapsibleContent><p className="px-8 py-3 text-body">Compare the coastal atlas with notes from the next chapter.</p></CollapsibleContent>
          </Collapsible>
        </div></CollapsibleContent>
      </Collapsible>
    </div>
    <Text as="h3" variant="heading" className="mt-8">A source outline inside Sidebar</Text>
    <Prose as="div" className="mt-3"><p>The Source outline below the manual index recreates the supplied chapter hierarchy. Chapter 1 starts open with Knowledge crunching selected. Chapters expand independently; selecting a section keeps it selected through collapse and reopening. Chapter 2 includes a nested disclosure.</p><p>Tab visits visible controls; Enter or Space toggles a disclosure. This is a list of disclosure buttons, with no tree arrow-key model. Closing a section from inside returns focus to its trigger.</p></Prose>
    <SidebarTrigger target="mobile" aria-label="Open source outline sidebar" className="mt-4 min-h-11 rounded-md border border-border px-3 md:hidden">Open source outline sidebar</SidebarTrigger>
  </Section>;
}
