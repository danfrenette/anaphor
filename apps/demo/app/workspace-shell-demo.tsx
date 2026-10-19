"use client";

import {
  BottomBar,
  BottomBarGroup,
  Prose,
  Section,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
  WorkspaceShell,
  WorkspaceTopBar,
} from "@anaphor/system";
import { useState } from "react";

const regions = ["Top", "Navigation", "Context", "Bottom", "Tabs"] as const;
type Region = typeof regions[number];

export function WorkspaceShellDemo() {
  const [visible, setVisible] = useState<Record<Region, boolean>>({ Top: true, Navigation: true, Context: true, Bottom: true, Tabs: true });
  const toggle = (region: Region) => setVisible(current => ({ ...current, [region]: !current[region] }));

  return <Section id="workspace-shell" className="border-t border-border py-12">
    <Text as="p" variant="label" className="text-muted-foreground">02.00 / Layout</Text>
    <Text as="h2" variant="title" className="mt-8">Workspace shell</Text>
    <Text as="p" variant="description" className="mt-3">The content card is the only required region. Add navigation, context, tabs, and utilities as the work needs them.</Text>
    <Prose as="div" className="mt-6"><p>The outer canvas stays continuous. Omitted regions leave no empty track or divider, while the card keeps its own edge and gutter.</p></Prose>

    <div role="group" aria-label="Preview regions" className="mt-8 flex flex-wrap gap-2">
      {regions.map(region => <button key={region} type="button" aria-pressed={visible[region]} onClick={() => toggle(region)}
        className="min-h-10 rounded-md border border-border bg-background px-3 text-small text-foreground transition-[background-color,transform] duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96] pointer-coarse:min-h-11">
        {region}
      </button>)}
    </div>

    <Tabs defaultValue="overview" className="contents">
      <WorkspaceShell aria-label="Workspace composition preview" className="relative inset-auto mt-4 h-80 overflow-hidden rounded-xl border border-border">
        {visible.Top && <WorkspaceTopBar>
          <div className="col-start-2 flex min-w-0 items-center gap-2 px-3">
            {visible.Tabs ? <TabsList aria-label="Preview views" className="bg-transparent p-0">
              <TabsTab value="overview">Overview</TabsTab><TabsTab value="details">Details</TabsTab>
            </TabsList> : <span className="text-small text-muted-foreground">Workspace controls</span>}
          </div>
        </WorkspaceTopBar>}
        {visible.Navigation && <aside aria-label="Preview navigation" className="col-start-1 row-start-2 w-24 p-3 text-small text-muted-foreground"><span>Navigation</span></aside>}
        <WorkspaceCard>
          <WorkspaceCardHeader className="min-h-10 text-small">Content card</WorkspaceCardHeader>
          <WorkspaceCardBody className="p-4 text-small">
            <TabsPanel value="overview" className="block">A quiet place for the main work.</TabsPanel>
            <TabsPanel value="details" className="block">Each view supplies its own content.</TabsPanel>
          </WorkspaceCardBody>
        </WorkspaceCard>
        {visible.Context && <aside aria-label="Preview context" className="col-start-3 row-start-2 w-24 p-3 text-small text-muted-foreground"><span>Context</span></aside>}
        {visible.Bottom && <BottomBar appearance="integrated" aria-label="Preview utilities"><BottomBarGroup><span className="px-2">Help</span></BottomBarGroup><BottomBarGroup><span className="px-2">Status</span></BottomBarGroup></BottomBar>}
      </WorkspaceShell>
    </Tabs>
  </Section>;
}
