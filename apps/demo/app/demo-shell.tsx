"use client";

import { SourceOutline } from "./source-outline";

import {
  CommandPalette,
  Kbd,
  KbdGroup,
  Text,
  useShortcut,
  ContentSections,
  useContentSections,
  BottomBar,
  BottomBarAction,
  BottomBarGroup,
  BottomBarStatus,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  WorkspaceShell,
  WorkspaceTopBar,
  WorkspaceCard,
  WorkspaceCardHeader,
  WorkspaceCardBody,
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  ThemeToggle,
  useSidebar,
} from "@anaphor/system";
import {
  CheckSquare,
  CursorClick,
  House,
  Keyboard,
  ListDashes,
  MagnifyingGlass,
  Palette,
  Question,
  Rectangle,
  ShareNetwork,
  SlidersHorizontal,
  Tag,
  TextAa,
  Textbox,
  type Icon,
} from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnaphorMark } from "../components/anaphor-mark";

type SidebarPlacement = "left" | "right";
const SidebarPlacementContext = createContext<{ placement: SidebarPlacement; setPlacement: (placement: SidebarPlacement) => void } | null>(null);
export function useSidebarPlacement() {
  const context = useContext(SidebarPlacementContext);
  if (!context) throw new Error("Sidebar placement controls require DemoShell");
  return context;
}

type NavItem = { id: string; label: string; href: Route; icon: Icon };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Foundations",
    items: [
      { id: "purpose", label: "Introduction", href: "/#purpose", icon: House },
      { id: "principles", label: "Principles", href: "/#principles", icon: CursorClick },
      { id: "foundations", label: "Token reference", href: "/foundations", icon: Palette },
      { id: "color", label: "Color", href: "/#color", icon: Palette },
      { id: "typography", label: "Typography", href: "/#typography", icon: TextAa },
      { id: "typography-specimen", label: "Typography specimen", href: "/typography", icon: TextAa },
      { id: "motion", label: "Motion", href: "/#motion", icon: CursorClick },
    ],
  },
  {
    label: "Components",
    items: [
      { id: "workspace-shell", label: "Workspace shell", href: "/#workspace-shell", icon: Rectangle },
      { id: "button", label: "Button", href: "/#button", icon: Rectangle },
      { id: "collapsible", label: "Collapsible", href: "/#collapsible", icon: ListDashes },
      { id: "sidebar", label: "Sidebar", href: "/#sidebar", icon: ListDashes },
      { id: "card", label: "Card", href: "/#card", icon: SlidersHorizontal },
      { id: "badge", label: "Badge", href: "/#badge", icon: Tag },
      { id: "node-edge-graphs", label: "Node-edge graphs", href: "/#node-edge-graphs", icon: ShareNetwork },
      { id: "skeleton", label: "Skeleton", href: "/#skeleton", icon: Rectangle },
      { id: "input", label: "Input", href: "/#input", icon: Textbox },
      { id: "slider", label: "Slider", href: "/#slider", icon: SlidersHorizontal },
      { id: "checkbox", label: "Checkbox", href: "/#checkbox", icon: CheckSquare },
      { id: "dropdown-menu", label: "Dropdown menu", href: "/#dropdown-menu", icon: ListDashes },
      { id: "popover", label: "Popover", href: "/#popover", icon: Rectangle },
      { id: "tooltip", label: "Tooltip", href: "/#tooltip", icon: Rectangle },
      { id: "data-table", label: "Data table", href: "/#data-table", icon: ListDashes },
      { id: "kbd", label: "Kbd", href: "/#kbd", icon: Keyboard },
      { id: "tabs", label: "Tabs", href: "/#tabs", icon: Rectangle },
      { id: "command-palette", label: "Command palette", href: "/#command-palette", icon: MagnifyingGlass },
      { id: "bottom-bar", label: "Bottom bar", href: "/#bottom-bar", icon: Rectangle },
    ],
  },
  {
    label: "Carousels",
    items: [{ id: "carousels", label: "Rail and Deck", href: "/carousels", icon: Rectangle }],
  },
  {
    label: "Studies",
    items: [
      { id: "studies", label: "Overview", href: "/studies", icon: Palette },
      { id: "signal", label: "Signal", href: "/studies/signal", icon: ShareNetwork },
      { id: "field-notes", label: "Field Notes", href: "/studies/field-notes", icon: TextAa },
    ],
  },
];

function DemoSidebar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const { activeId } = useContentSections();
  const { setMobileOpen } = useSidebar();
  const closeMobile = () => setMobileOpen(false, true);

  return (
    <Sidebar aria-label="Component manual navigation">
      <SidebarHeader className="border-0 px-3 pb-5 pt-3">
        <div className="flex min-h-11 items-center gap-2">
          <Link href="/" onNavigate={closeMobile} aria-label="Anaphor home" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md px-2 text-foreground no-underline motion-safe:transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-ring">
            <AnaphorMark className="size-9 shrink-0" />
            <Text as="span" variant="ui" className="min-w-0 font-semibold tracking-tight">Anaphor</Text>
          </Link>
          <button type="button" aria-label="Search manual" onClick={() => { closeMobile(); onSearch(); }} className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-ring md:hidden"><MagnifyingGlass aria-hidden="true" className="size-4" /></button>
          <SidebarClose className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-0">
        <nav aria-label="Manual index">
          {groups.map((group) => (
            <SidebarGroup key={group.label} className="mt-6">
              <SidebarGroupLabel className="mb-1 font-medium">{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map(({ id, label, href, icon: ItemIcon }) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton isActive={pathname === "/" ? id === activeId : pathname === href} render={<Link href={href} onNavigate={closeMobile} />}>
                      <ItemIcon aria-hidden="true" /><span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
        <SourceOutline />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

function ManualPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setMobileOpen } = useSidebar();
  const router = useRouter();
  return <CommandPalette open={open} onOpenChange={onOpenChange} title="Search the manual" placeholder="Find a component or foundation…"
      items={groups.flatMap(group => group.items.map(item => ({ ...item, group: group.label, icon: <item.icon aria-hidden="true" /> })))}
      onSelect={item => { setMobileOpen(false, true); router.push(item.href); }} />;
}

function ManualBreadcrumb() {
  const pathname = usePathname();
  const { activeId } = useContentSections();
  const current = pathname === "/"
    ? groups.flatMap(group => group.items.map(item => ({ group: group.label, label: item.label, id: item.id, href: item.href }))).find(({ id }) => id === activeId)
      ?? { group: "Foundations", label: "Introduction" }
    : groups.flatMap(group => group.items.map(item => ({ group: group.label, label: item.label, href: item.href }))).find(({ href }) => href === pathname);
  const group = current?.group ?? "Manual";
  const label = current?.label ?? "Overview";

  return <p className="flex items-center gap-2 text-small"><span className="text-muted-foreground">{group}</span><b className="font-normal text-border">/</b><strong className="font-medium">{label}</strong></p>;
}

function ManualTopBar({ placement }: { placement: SidebarPlacement }) {
  const { desktopOpen } = useSidebar();
  const triggerInRail = desktopOpen && placement !== "right";
  return <WorkspaceTopBar>
    {triggerInRail && <div className="col-start-1 hidden items-center px-2 md:flex"><SidebarTrigger target="desktop" /></div>}
    <div className="col-start-2 flex min-w-0 items-center gap-2 px-2">
      <SidebarTrigger target="mobile" className="md:hidden" />
      {!triggerInRail && <SidebarTrigger target="desktop" className="hidden md:grid" />}
      <TabsList aria-label="Workspace views" className="min-w-0 bg-transparent p-0">
        <TabsTab value="manual" className="min-w-0 max-w-64 px-4">Reference manual</TabsTab>
      </TabsList>
    </div>
  </WorkspaceTopBar>;
}

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarSide, setSidebarSide] = useState<SidebarPlacement>("left");
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useShortcut("Mod+K", () => setSearchOpen(true), { allowInInputs: true });
  useEffect(() => {
    shellRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  return (
    <SidebarPlacementContext value={{ placement: sidebarSide, setPlacement: setSidebarSide }}>
      <ContentSections defaultScope enabled={pathname === "/"} scrollContainerRef={scrollContainerRef} className="contents [--anaphor-section-offset:calc(var(--spacing)*8)]">
        <Tabs defaultValue="manual" className="contents">
          <WorkspaceShell ref={shellRef} data-app-shell="">
            <SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false} side={sidebarSide} layout="workspace">
              <a href="#content" className="fixed start-3 top-3 z-[var(--anaphor-z-a11y)] -translate-y-[200%] bg-foreground px-3 py-2 text-ui text-background focus-visible:translate-y-0">Skip to content</a>
              <ManualTopBar placement={sidebarSide} />
              <DemoSidebar onSearch={() => setSearchOpen(true)} />
              <SidebarInset>
                <WorkspaceCard>
                  <WorkspaceCardHeader><ManualBreadcrumb /></WorkspaceCardHeader>
                  <WorkspaceCardBody ref={scrollContainerRef}>
                    <TabsPanel value="manual" className="block">{children}</TabsPanel>
                  </WorkspaceCardBody>
                </WorkspaceCard>
              </SidebarInset>
              <BottomBar appearance="integrated" aria-label="Manual utilities">
                <BottomBarGroup>
                  <BottomBarAction render={<a href="https://github.com/danfrenette/anaphor#readme" target="_blank" rel="noreferrer" />} aria-label="Help and documentation">
                    <Question aria-hidden="true" /><span className="hidden sm:inline">Help</span>
                  </BottomBarAction>
                  <BottomBarStatus className="hidden md:inline">Source registry · <span className="font-mono">v0.1</span></BottomBarStatus>
                </BottomBarGroup>
                <BottomBarGroup>
                  <BottomBarAction onClick={() => setSearchOpen(true)} aria-label="Search manual" aria-haspopup="dialog">
                    <MagnifyingGlass aria-hidden="true" /><span className="hidden sm:inline">Search</span>
                    <KbdGroup aria-hidden="true" className="ms-2 hidden lg:inline-flex"><Kbd>Mod</Kbd><Kbd>K</Kbd></KbdGroup>
                  </BottomBarAction>
                  <ThemeToggle className="min-h-10 min-w-10 rounded-sm px-2 text-small pointer-coarse:min-h-11 pointer-coarse:min-w-11" title="Switch theme"><span className="hidden sm:inline">Theme</span></ThemeToggle>
                </BottomBarGroup>
              </BottomBar>
              <ManualPalette open={searchOpen} onOpenChange={setSearchOpen} />
            </SidebarProvider>
          </WorkspaceShell>
        </Tabs>
      </ContentSections>
    </SidebarPlacementContext>
  );
}
