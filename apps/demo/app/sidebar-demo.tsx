"use client";

import {
  Section, Sidebar, SidebarClose, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarInsetContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
  Text, useSidebar, WorkspaceShell, WorkspaceCard, WorkspaceCardBody, WorkspaceCardHeader,
} from "@anaphor/system";
import { useState } from "react";
import { CatalogExample } from "./catalog-example";
import { Check, Select } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";

const destinations = ["Overview", "Projects", "Activity"] as const;
const anatomyCode = `<Sidebar>
  <SidebarHeader>Workspace</SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton isActive>Overview</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>Personal workspace</SidebarFooter>
  <SidebarRail />
</Sidebar>`;

function Navigation({ selected, onSelect, label = "Sidebar preview navigation" }: { selected: string; onSelect: (value: string) => void; label?: string }) {
  const { mobileOpen, toggleMobile } = useSidebar();
  return <Sidebar aria-label={label}>
    <SidebarHeader className="flex-row items-center justify-between border-0"><span className="font-heading text-ui">Workspace</span><SidebarClose aria-label="Close sidebar preview" /></SidebarHeader>
    <SidebarContent><SidebarGroup>
      <SidebarGroupLabel className="text-ui text-muted-foreground">Navigation</SidebarGroupLabel>
      <SidebarMenu>{destinations.map(destination => <SidebarMenuItem key={destination}><SidebarMenuButton isActive={selected === destination} onClick={() => { onSelect(destination); if (mobileOpen) toggleMobile(false); }}>{destination}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
    </SidebarGroup></SidebarContent>
    <SidebarFooter className="text-small text-muted-foreground">Personal workspace</SidebarFooter>
    <SidebarRail />
  </Sidebar>;
}

function Controls({ side, setSide, resizable, setResizable, reset }: { side: "left" | "right"; setSide: (value: "left" | "right") => void; resizable: boolean; setResizable: (value: boolean) => void; reset: () => void }) {
  const { prepareMotion, rootRef, mobileOpen, toggleMobile } = useSidebar();
  return <PlaygroundControls sectionId="sidebar" title="Sidebar" onReset={() => { prepareMotion(false); rootRef.current?.style.removeProperty("--anaphor-sidebar-drag-width"); if (mobileOpen) toggleMobile(false); reset(); }}>
    <div className="grid gap-4"><Select label="Placement" value={side} options={["left", "right"]} onChange={value => { prepareMotion(false); setSide(value); }} /><Check label="Resizable" checked={resizable} onChange={setResizable} /></div>
    <p className="mt-3 text-small text-muted-foreground">On desktop, drag the enabled rail or use its arrow keys to resize. On mobile, the sidebar opens as a drawer.</p>
  </PlaygroundControls>;
}

function Placement({ side }: { side: "left" | "right" }) {
  return <div className="grid gap-3"><h4 className="font-sans text-ui font-medium normal-case text-muted-foreground">{side === "left" ? "Left" : "Right"}</h4><div className={`flex h-32 overflow-hidden rounded-card border border-border bg-muted ${side === "right" ? "flex-row-reverse" : ""}`}><div className="flex w-24 items-center justify-center text-small text-muted-foreground">Navigation</div><div className="m-2 flex min-w-0 flex-1 items-center justify-center rounded-card bg-background text-small shadow-card">Content</div></div></div>;
}

function RightSidebarExample() {
  const [selected, setSelected] = useState("Overview");
  return <WorkspaceShell aria-label="Right-hand sidebar example" className="relative inset-auto h-80 overflow-hidden rounded-card border border-border">
    <SidebarProvider layout="workspace" side="right" mode="uncontrolled" defaultOpen={true} shortcut={null} resizable={false} className="[--anaphor-sidebar-width:12rem] [--anaphor-sidebar-min-width:10rem]">
      <Navigation selected={selected} onSelect={setSelected} label="Right-hand navigation" />
      <SidebarInset><WorkspaceCard>
        <WorkspaceCardHeader className="justify-between gap-2">
          <SidebarInsetContent>{selected}</SidebarInsetContent>
          <SidebarInsetContent>
            <SidebarTrigger target="desktop" aria-label="Toggle right-hand navigation" className="hidden md:grid" />
            <SidebarTrigger target="mobile" aria-label="Open right-hand navigation" className="md:hidden" />
          </SidebarInsetContent>
        </WorkspaceCardHeader>
        <WorkspaceCardBody className="p-4 text-small text-muted-foreground"><SidebarInsetContent>Switch destinations or open and close navigation on the right.</SidebarInsetContent></WorkspaceCardBody>
      </WorkspaceCard></SidebarInset>
    </SidebarProvider>
  </WorkspaceShell>;
}

export function SidebarDemo() {
  const [anatomySelection, setAnatomySelection] = useState("Overview");
  const [side, setSide] = useState<"left" | "right">("left");
  const [resizable, setResizable] = useState(false);
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Overview");
  const code = `<WorkspaceShell>
  <SidebarProvider layout="workspace" side="${side}" mode="uncontrolled"
    defaultOpen={true} resizable={${resizable}} shortcut={null}>
    ${anatomyCode.replaceAll("\n", "\n    ")}
    <SidebarInset>
      <WorkspaceCard>
        <WorkspaceCardHeader>
          <SidebarTrigger target="desktop" className="hidden md:grid" />
          <SidebarTrigger target="mobile" className="md:hidden" />
          ${selected}
        </WorkspaceCardHeader>
        <WorkspaceCardBody>Workspace content</WorkspaceCardBody>
      </WorkspaceCard>
    </SidebarInset>
  </SidebarProvider>
</WorkspaceShell>`;
  return <Section id="sidebar" className="border-t border-border py-12">
    <Text as="h2" variant="title">Sidebar</Text>
    <Text as="p" variant="description" className="mt-3">Navigation, identity, and workspace actions on either edge of the main content.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Anatomy" description="A header, grouped destinations, and a footer. The selected destination stays distinct from hover." code={anatomyCode}>
        <SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut={null} resizable={false} className="mx-auto block min-h-0 w-full max-w-72">
          <SidebarHeader className="border-0 font-heading">Workspace</SidebarHeader>
          <SidebarContent><SidebarGroup><SidebarGroupLabel className="text-ui text-muted-foreground">Navigation</SidebarGroupLabel><SidebarMenu>{destinations.map(destination => <SidebarMenuItem key={destination}><SidebarMenuButton isActive={destination === anatomySelection} onClick={() => setAnatomySelection(destination)}>{destination}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup></SidebarContent>
          <SidebarFooter className="mt-4 text-small text-muted-foreground">Personal workspace</SidebarFooter>
        </SidebarProvider>
      </CatalogExample>
      <CatalogExample title="Placement" description="Use the left edge for primary navigation or the right edge for supporting navigation." code={'<SidebarProvider side="left" /* … */ />\n<SidebarProvider side="right" /* … */ />'}>
        <div className="grid gap-6 sm:grid-cols-2"><Placement side="left" /><Placement side="right" /></div>
      </CatalogExample>
      <CatalogExample title="Right-hand navigation" description="The same sidebar on the opposite edge, with shared selection and disclosure behavior." code={'<WorkspaceShell>\n  <SidebarProvider layout="workspace" side="right" mode="uncontrolled" defaultOpen={true} shortcut={null} resizable={false}>\n    <Sidebar>{/* Navigation */}</Sidebar>\n    <SidebarInset>{/* Content and SidebarTrigger */}</SidebarInset>\n  </SidebarProvider>\n</WorkspaceShell>'} framed={false}><RightSidebarExample /></CatalogExample>
      <CatalogExample title="Playground" description="Select a destination, toggle the sidebar, or use Controls to change its placement and resizing." code={code} framed={false}>
        <WorkspaceShell aria-label="Sidebar playground" className="relative inset-auto h-96 overflow-hidden rounded-card border border-border">
          <SidebarProvider layout="workspace" side={side} mode="controlled" open={open} onOpenChange={setOpen} shortcut={null} resizable={resizable} className="[--anaphor-sidebar-width:12rem] [--anaphor-sidebar-min-width:10rem] [--anaphor-sidebar-max-width:16rem]">
            <Controls side={side} setSide={setSide} resizable={resizable} setResizable={setResizable} reset={() => { setSide("left"); setResizable(false); setOpen(true); setSelected("Overview"); }} />
            <Navigation selected={selected} onSelect={setSelected} />
            <SidebarInset><WorkspaceCard>
              <WorkspaceCardHeader className="gap-2"><SidebarTrigger target="desktop" aria-label="Toggle playground sidebar" className="hidden md:grid" /><SidebarTrigger target="mobile" aria-label="Open playground sidebar" className="md:hidden" /><SidebarInsetContent>{selected}</SidebarInsetContent></WorkspaceCardHeader>
              <WorkspaceCardBody className="p-4 text-small text-muted-foreground"><SidebarInsetContent>{selected === "Overview" ? "Your workspace at a glance." : selected === "Projects" ? "Keep your projects in one place." : "Recent updates across your workspace."}</SidebarInsetContent></WorkspaceCardBody>
            </WorkspaceCard></SidebarInset>
          </SidebarProvider>
        </WorkspaceShell>
      </CatalogExample>
    </div>
  </Section>;
}
