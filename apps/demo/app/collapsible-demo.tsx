"use client";

import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Section, Text } from "@anaphor/system";
import { CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import { CatalogExample } from "./catalog-example";
import { Check } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";

const statesCode = `<Collapsible>
  <CollapsibleTrigger>Additional context</CollapsibleTrigger>
  <CollapsibleContent>Supporting details stay close to the work.</CollapsibleContent>
</Collapsible>
<Collapsible defaultOpen>{/* Initially open */}</Collapsible>
<Collapsible disabled>{/* Unavailable */}</Collapsible>`;
const nestedCode = `<Collapsible defaultOpen>
  <CollapsibleTrigger>Reading journal</CollapsibleTrigger>
  <CollapsibleContent>
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Chapter notes</CollapsibleTrigger>
      <CollapsibleContent>
        <Collapsible>
          <CollapsibleTrigger>Field observations</CollapsibleTrigger>
          <CollapsibleContent>Searchable notes</CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  </CollapsibleContent>
</Collapsible>`;

export function CollapsibleDemo() {
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [caret, setCaret] = useState(true);
  const code = `const [open, setOpen] = useState(${open});

<Collapsible open={open} onOpenChange={setOpen}${disabled ? " disabled" : ""}>
  <CollapsibleTrigger>${caret ? '<CaretRight aria-hidden="true" />' : ""}Controlled section</CollapsibleTrigger>
  <CollapsibleContent>
    <div className="px-8 py-3">
      <p>Expansion belongs to the consuming application.</p>
      <Button nativeButton type="button" variant="outline" tone="neutral" size="sm" shape="square" iconOnly={false} loading={false} onClick={() => setOpen(false)}>
        Close from inside
      </Button>
    </div>
  </CollapsibleContent>
</Collapsible>`;
  return <Section id="collapsible" className="border-t border-border py-12">
    <Text as="h2" variant="title">Collapsible</Text>
    <Text as="p" variant="description" className="mt-3">Reveal supporting content without leaving the page.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="States" description="Start closed, reveal content on arrival, or keep an unavailable section disabled." code={statesCode}>
        <div className="space-y-6">
          <div><h4 className="mb-2 font-sans text-ui font-medium normal-case text-muted-foreground">Closed</h4><Collapsible><CollapsibleTrigger><CaretRight aria-hidden="true" />Additional context</CollapsibleTrigger><CollapsibleContent><p className="px-8 py-3 text-ui">Supporting details stay close to the work.</p></CollapsibleContent></Collapsible></div>
          <div><h4 className="mb-2 font-sans text-ui font-medium normal-case text-muted-foreground">Initially open</h4><Collapsible defaultOpen><CollapsibleTrigger><CaretRight aria-hidden="true" />Reading notes</CollapsibleTrigger><CollapsibleContent><p className="px-8 py-3 text-ui">A shared language grows through conversations about the model.</p></CollapsibleContent></Collapsible></div>
          <div><h4 className="mb-2 font-sans text-ui font-medium normal-case text-muted-foreground">Disabled</h4><Collapsible disabled><CollapsibleTrigger><CaretRight aria-hidden="true" />Unavailable section</CollapsibleTrigger><CollapsibleContent>Unavailable content</CollapsibleContent></Collapsible></div>
        </div>
      </CatalogExample>
      <CatalogExample title="Nested sections" description="Each level opens independently. Close Reading journal and use browser Find for a phrase in Field observations. Supported browsers reveal its ancestors." code={nestedCode}>
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
      </CatalogExample>
      <PlaygroundControls sectionId="collapsible" title="Collapsible" onReset={() => { setOpen(false); setDisabled(false); setCaret(true); }}>
        <div className="grid grid-cols-2 gap-4"><Check label="Open" checked={open} onChange={setOpen} /><Check label="Disabled" checked={disabled} onChange={setDisabled} /><Check label="Show caret" checked={caret} onChange={setCaret} /></div>
        <p className="mt-3 text-small text-muted-foreground">Disabled prevents trigger interaction. The application can still change Open.</p>
      </PlaygroundControls>
      <CatalogExample title="Playground" description="Toggle the disclosure or change its state in Controls. Closing from inside returns focus to the trigger." code={code}>
        <div role="group" aria-label="Collapsible playground" className="min-h-60">
          <Collapsible open={open} onOpenChange={setOpen} disabled={disabled}>
            <CollapsibleTrigger>{caret && <CaretRight aria-hidden="true" />}Controlled section</CollapsibleTrigger>
            <CollapsibleContent><div className="px-8 py-3"><p className="text-ui">Expansion belongs to the consuming application.</p><Button nativeButton type="button" variant="outline" tone="neutral" size="sm" shape="square" iconOnly={false} loading={false} className="mt-3" onClick={() => setOpen(false)}>Close from inside</Button></div></CollapsibleContent>
          </Collapsible>
        </div>
      </CatalogExample>
    </div>
  </Section>;
}
