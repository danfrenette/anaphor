"use client";

import {
  BottomBar, BottomBarGroup, Checkbox, Field, FieldLabel, Section,
  Sidebar, SidebarClose, SidebarInset, SidebarInsetContent, SidebarProvider, SidebarTrigger,
  Tabs, TabsList, TabsPanel, TabsTab, Text, useSidebar,
  WorkspaceCard, WorkspaceCardBody, WorkspaceCardHeader, WorkspaceShell, WorkspaceTopBar,
} from "@anaphor/system";
import { useState } from "react";
import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Check } from "./playground-fields";

const defaults = { Top: true, Navigation: true, Context: true, Bottom: true, Tabs: true };
type Regions = typeof defaults;
const frame = "relative inset-auto h-64 overflow-hidden rounded-card border border-border";
const anatomyCode = `<WorkspaceShell>
  <WorkspaceTopBar>Workspace controls</WorkspaceTopBar>
  <aside className="col-start-1 row-start-2">Navigation</aside>
  <WorkspaceCard>
    <WorkspaceCardHeader>Content card</WorkspaceCardHeader>
    <WorkspaceCardBody>Main work</WorkspaceCardBody>
  </WorkspaceCard>
  <aside className="col-start-3 row-start-2">Context</aside>
  <BottomBar appearance="integrated">Utilities</BottomBar>
</WorkspaceShell>`;

function Utilities() {
  return <BottomBar appearance="integrated" aria-label="Preview utilities"><BottomBarGroup><span className="px-2">Help</span></BottomBarGroup><BottomBarGroup><span className="px-2">Status</span></BottomBarGroup></BottomBar>;
}

function StaticShell({ full = false }: { full?: boolean }) {
  return <WorkspaceShell aria-label={full ? "Full workspace anatomy" : "Content-only composition"} className={frame}>
    {full && <WorkspaceTopBar><span className="col-start-2 px-3 text-small text-muted-foreground">Top bar</span></WorkspaceTopBar>}
    {full && <aside className="col-start-1 row-start-2 w-20 p-3 text-small text-muted-foreground">Navigation</aside>}
    <WorkspaceCard>
      <WorkspaceCardHeader className="min-h-10 text-small">Content card</WorkspaceCardHeader>
      <WorkspaceCardBody className="p-4 text-small text-muted-foreground">A quiet place for the main work.</WorkspaceCardBody>
    </WorkspaceCard>
    {full && <aside className="col-start-3 row-start-2 w-20 p-3 text-small text-muted-foreground">Context</aside>}
    {full && <Utilities />}
  </WorkspaceShell>;
}

function RegionControls({ visible, setVisible, reset }: { visible: Regions; setVisible: (value: Regions) => void; reset: () => void }) {
  const { prepareMotion, mobileOpen, toggleMobile } = useSidebar();
  return <PlaygroundControls sectionId="workspace-shell" title="Workspace shell" onReset={() => { prepareMotion(false); if (mobileOpen) toggleMobile(false); reset(); }}>
    <div className="grid grid-cols-2 gap-4">
      {(["Top", "Navigation", "Context", "Bottom"] as const).map(region => <Check key={region} label={region} checked={visible[region]} onChange={value => { prepareMotion(false); setVisible({ ...visible, [region]: value }); }} />)}
      <Field orientation="horizontal"><Checkbox checked={visible.Tabs} disabled={!visible.Top} onCheckedChange={value => setVisible({ ...visible, Tabs: value })} /><FieldLabel>Tabs</FieldLabel></Field>
    </div>
    <p className="mt-3 text-small text-muted-foreground">Tabs live in the top bar. Include Top to configure them. Use the preview’s sidebar button to open or close its rails.</p>
  </PlaygroundControls>;
}

export function WorkspaceShellDemo() {
  const [visible, setVisible] = useState(defaults);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("overview");
  const side = visible.Navigation && visible.Context ? "both" : visible.Context ? "right" : "left";
  const hasRails = visible.Navigation || visible.Context;
  const tabsEnabled = visible.Top && visible.Tabs;
  const code = `${tabsEnabled ? '<Tabs defaultValue="overview">\n' : ""}<WorkspaceShell>
  <SidebarProvider layout="workspace" side="${side}" mode="uncontrolled" defaultOpen={true} shortcut={null} resizable={false}>${visible.Top ? `
    <WorkspaceTopBar>
      <div className="col-start-2">${tabsEnabled ? '\n        <TabsList aria-label="Preview views">\n          <TabsTab value="overview">Overview</TabsTab>\n          <TabsTab value="details">Details</TabsTab>\n        </TabsList>' : 'Workspace controls'}
      </div>
    </WorkspaceTopBar>` : ""}${visible.Navigation ? '\n    <Sidebar side="left"><SidebarClose />Navigation</Sidebar>' : ""}
    <SidebarInset>
      <WorkspaceCard>
        <WorkspaceCardHeader>${hasRails ? '\n          <SidebarTrigger target="desktop" className="hidden md:grid" />\n          <SidebarTrigger target="mobile" className="md:hidden" />\n          ' : ""}Content card</WorkspaceCardHeader>
        <WorkspaceCardBody>${tabsEnabled ? '\n          <TabsPanel value="overview">A quiet place for the main work.</TabsPanel>\n          <TabsPanel value="details">Each view supplies its own content.</TabsPanel>\n        ' : 'A quiet place for the main work.'}</WorkspaceCardBody>
      </WorkspaceCard>
    </SidebarInset>${visible.Context ? '\n    <Sidebar side="right"><SidebarClose />Context</Sidebar>' : ""}${visible.Bottom ? '\n    <BottomBar appearance="integrated">Utilities</BottomBar>' : ""}
  </SidebarProvider>
</WorkspaceShell>${tabsEnabled ? '\n</Tabs>' : ""}`;
  return <Section id="workspace-shell" className="border-t border-border py-12">
    <Text as="h2" variant="title">Workspace shell</Text>
    <Text as="p" variant="description" className="mt-3">One continuous canvas around the main work. Add navigation, context, and utilities as needed.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Anatomy" description="The content card owns its surface. Supporting regions sit on the surrounding canvas." code={anatomyCode} framed={false}><StaticShell full /></CatalogExample>
      <CatalogExample title="Compositions" description="The card is the only required region. Omitted regions leave no empty track or divider." code={'<WorkspaceShell>\n  <WorkspaceCard>\n    <WorkspaceCardHeader>Content card</WorkspaceCardHeader>\n    <WorkspaceCardBody>Main work</WorkspaceCardBody>\n  </WorkspaceCard>\n</WorkspaceShell>'} framed={false}><StaticShell /></CatalogExample>
      <CatalogExample title="Playground" description="Use Controls to compose the workspace. Toggle the rails and switch views in the preview." code={code} framed={false}>
        <Tabs value={tab} onValueChange={setTab} className="contents">
          <WorkspaceShell aria-label="Workspace composition preview" className={`${frame} h-80`}>
            <SidebarProvider layout="workspace" side={side} mode="controlled" open={open} onOpenChange={setOpen} shortcut={null} resizable={false} className="[--anaphor-sidebar-width:7rem] [--anaphor-sidebar-min-width:7rem] [--anaphor-sidebar-max-width:7rem]">
              <RegionControls visible={visible} setVisible={setVisible} reset={() => { setVisible(defaults); setOpen(true); setTab("overview"); }} />
              {visible.Top && <WorkspaceTopBar><div className="col-start-2 min-w-0 px-3">{visible.Tabs ? <TabsList aria-label="Preview views" className="bg-transparent p-0"><TabsTab value="overview">Overview</TabsTab><TabsTab value="details">Details</TabsTab></TabsList> : <span className="text-small text-muted-foreground">Workspace controls</span>}</div></WorkspaceTopBar>}
              {visible.Navigation && <Sidebar side="left" aria-label="Preview navigation" className="p-3 text-small text-muted-foreground"><SidebarClose aria-label="Close preview navigation" />Navigation</Sidebar>}
              <SidebarInset><WorkspaceCard>
                <WorkspaceCardHeader className="min-h-12 gap-2 text-small">
                  {hasRails && <><SidebarTrigger target="desktop" aria-label="Toggle preview rails" className="hidden md:grid" /><SidebarTrigger target="mobile" aria-label="Open preview sidebar" className="md:hidden" /></>}
                  <SidebarInsetContent>Content card</SidebarInsetContent>
                </WorkspaceCardHeader>
                <WorkspaceCardBody className="p-4 text-small"><SidebarInsetContent>
                  {visible.Top && visible.Tabs ? <><TabsPanel value="overview">A quiet place for the main work.</TabsPanel><TabsPanel value="details">Each view supplies its own content.</TabsPanel></> : "A quiet place for the main work."}
                </SidebarInsetContent></WorkspaceCardBody>
              </WorkspaceCard></SidebarInset>
              {visible.Context && <Sidebar side="right" aria-label="Preview context" className="p-3 text-small text-muted-foreground"><SidebarClose aria-label="Close preview context" />Context</Sidebar>}
              {visible.Bottom && <Utilities />}
            </SidebarProvider>
          </WorkspaceShell>
        </Tabs>
      </CatalogExample>
    </div>
  </Section>;
}
