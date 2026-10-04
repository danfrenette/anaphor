"use client";

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
import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarPlacement = "left" | "right" | "both";
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
      { id: "button", label: "Button", href: "/#button", icon: Rectangle },
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
    label: "Studies",
    items: [
      { id: "studies", label: "Overview", href: "/studies", icon: Palette },
      { id: "signal", label: "Signal", href: "/studies/signal", icon: ShareNetwork },
      { id: "field-notes", label: "Field Notes", href: "/studies/field-notes", icon: TextAa },
    ],
  },
];

function DemoSidebar({ side }: { side?: "left" | "right" }) {
  const pathname = usePathname();
  const { activeId } = useContentSections();
  const { setMobileOpen } = useSidebar();
  const closeMobile = () => setMobileOpen(false, true);

  return (
    <Sidebar side={side} aria-label="Component manual navigation">
      <SidebarHeader>
        <div className="flex min-h-11 items-center gap-2">
          <Link href="/" onNavigate={closeMobile} aria-label="Anaphor home" className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 text-foreground no-underline">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-sm bg-foreground font-heading text-heading text-background">a</span>
            <span className="min-w-0">
              <Text as="span" variant="subheading" className="block">Anaphor</Text>
              <Text as="span" variant="caption" className="block">Reference manual</Text>
            </span>
          </Link>
          <SidebarClose className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Manual index">
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel><span>{group.label}</span><span className="font-mono">{String(group.items.length).padStart(2, "0")}</span></SidebarGroupLabel>
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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

function ManualOutline() {
  return <Sidebar side="right" aria-label="Page outline">
    <SidebarHeader><Text as="span" variant="subheading" className="px-2">On this page</Text></SidebarHeader>
    <SidebarContent><nav aria-label="Page outline"><SidebarMenu>
      {[["Introduction", "purpose"], ["Principles", "principles"], ["Color", "color"], ["Typography", "typography"], ["Motion", "motion"], ["Sidebar", "sidebar"]].map(([label, id]) => (
        <SidebarMenuItem key={id}><SidebarMenuButton isActive={false} render={<a href={`/#${id}`} />}>{label}</SidebarMenuButton></SidebarMenuItem>
      ))}
    </SidebarMenu></nav></SidebarContent>
    <SidebarRail />
  </Sidebar>;
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

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarSide, setSidebarSide] = useState<SidebarPlacement>("left");
  useShortcut("Mod+K", () => setSearchOpen(true), { allowInInputs: true });
  return (
    <SidebarPlacementContext value={{ placement: sidebarSide, setPlacement: setSidebarSide }}>
    <ContentSections defaultScope enabled={pathname === "/"} className="contents [--manual-header-height:calc(var(--spacing)*14)] [--anaphor-section-offset:calc(var(--manual-header-height)+var(--spacing)*8)]">
      <SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false} side={sidebarSide}>
        <a href="#content" className="fixed start-3 top-3 z-[var(--anaphor-z-a11y)] -translate-y-[200%] bg-foreground px-3 py-2 text-ui text-background focus-visible:translate-y-0">Skip to content</a>
        <DemoSidebar side={sidebarSide === "both" ? "left" : undefined} />
        {sidebarSide === "both" ? <ManualOutline /> : null}
        <SidebarInset className="pb-[calc(var(--anaphor-bottom-bar-height)+4rem)]">
          <header className="sticky top-0 z-[var(--anaphor-z-navigation)] flex h-[var(--manual-header-height)] items-center gap-3 border-b border-border bg-[color-mix(in_oklch,var(--anaphor-background)_88%,transparent)] px-4 backdrop-blur-md">
            <SidebarTrigger target="mobile" className="md:hidden" />
            <SidebarTrigger target="desktop" className="hidden md:grid" />
            <span className="h-4 w-px bg-border" />
            <ManualBreadcrumb />
          </header>
          {children}
        </SidebarInset>
        <BottomBar aria-label="Manual utilities" className="fixed inset-x-0 bottom-0 z-[var(--anaphor-z-navigation)]">
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
    </ContentSections>
    </SidebarPlacementContext>
  );
}
