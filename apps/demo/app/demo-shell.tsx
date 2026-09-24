"use client";

import {
  CommandPalette,
  Kbd,
  KbdGroup,
  Text,
  useShortcut,
  ContentSections,
  useContentSections,
  Button,
  ButtonLabel,
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarFooter,
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
import { useState, type ReactNode } from "react";

type NavItem = { id: string; label: string; href: Route; icon: Icon };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Foundations",
    items: [
      { id: "purpose", label: "Introduction", href: "/#purpose", icon: House },
      { id: "principles", label: "Principles", href: "/#principles", icon: CursorClick },
      { id: "color", label: "Color", href: "/#color", icon: Palette },
      { id: "typography", label: "Typography", href: "/#typography", icon: TextAa },
      { id: "motion", label: "Motion", href: "/#motion", icon: CursorClick },
    ],
  },
  {
    label: "Components",
    items: [
      { id: "button", label: "Button", href: "/#button", icon: Rectangle },
      { id: "card", label: "Card", href: "/#card", icon: SlidersHorizontal },
      { id: "badge", label: "Badge", href: "/#badge", icon: Tag },
      { id: "node-edge-graphs", label: "Node-edge graphs", href: "/#node-edge-graphs", icon: ShareNetwork },
      { id: "input", label: "Input", href: "/#input", icon: Textbox },
      { id: "slider", label: "Slider", href: "/#slider", icon: SlidersHorizontal },
      { id: "checkbox", label: "Checkbox", href: "/#checkbox", icon: CheckSquare },
      { id: "dropdown-menu", label: "Dropdown menu", href: "/#dropdown-menu", icon: ListDashes },
      { id: "popover", label: "Popover", href: "/#popover", icon: Rectangle },
      { id: "kbd", label: "Kbd", href: "/#kbd", icon: Keyboard },
      { id: "command-palette", label: "Command palette", href: "/#command-palette", icon: MagnifyingGlass },
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

function DemoSidebar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const { activeId } = useContentSections();
  const { setMobileOpen } = useSidebar();
  const closeMobile = () => setMobileOpen(false, true);

  return (
    <Sidebar aria-label="Component manual navigation">
      <SidebarHeader className="gap-3">
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
        <Button onClick={onSearch} aria-haspopup="dialog" iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral" className="w-full justify-start [&>[data-slot=button-content]]:w-full">
          <MagnifyingGlass aria-hidden="true" /><ButtonLabel>Search manual</ButtonLabel>
          <KbdGroup aria-label="Command or Control K" className="ms-auto"><Kbd>Mod</Kbd><Kbd>K</Kbd></KbdGroup>
        </Button>
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

      <SidebarFooter><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />Registry healthy</span><span className="font-mono">v0.1</span></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function ManualNavigation() {
  const [open, setOpen] = useState(false);
  const { setMobileOpen } = useSidebar();
  const router = useRouter();
  useShortcut("Mod+K", () => setOpen(true), { allowInInputs: true });
  return <>
    <DemoSidebar onSearch={() => setOpen(true)} />
    <CommandPalette open={open} onOpenChange={setOpen} title="Search the manual" placeholder="Find a component or foundation…"
      items={groups.flatMap(group => group.items.map(item => ({ ...item, group: group.label, icon: <item.icon aria-hidden="true" /> })))}
      onSelect={item => { setMobileOpen(false, true); router.push(item.href); }} />
  </>;
}

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ContentSections defaultScope enabled={pathname === "/"} className="contents [--manual-header-height:calc(var(--spacing)*14)] [--anaphor-section-offset:calc(var(--manual-header-height)+var(--spacing)*8)]">
      <SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}>
        <a href="#content" className="fixed start-3 top-3 z-[var(--anaphor-z-a11y)] -translate-y-[200%] bg-foreground px-3 py-2 text-ui text-background focus-visible:translate-y-0">Skip to content</a>
        <ManualNavigation />
        <SidebarInset>
          <header className="sticky top-0 z-[var(--anaphor-z-navigation)] flex h-[var(--manual-header-height)] items-center gap-3 border-b border-border bg-[color-mix(in_oklch,var(--anaphor-background)_88%,transparent)] px-4 backdrop-blur-md">
            <SidebarTrigger target="mobile" className="md:hidden" />
            <SidebarTrigger target="desktop" className="hidden md:grid" />
            <span className="h-4 w-px bg-border" />
            <p className="flex items-center gap-2 text-small"><span className="text-muted-foreground">{pathname.startsWith("/studies") ? "Studies" : "Library"}</span><b className="font-normal text-border">/</b><strong className="font-medium">{pathname === "/studies/signal" ? "Signal" : pathname === "/studies/field-notes" ? "Field Notes" : pathname === "/studies" ? "Overview" : "Components"}</strong></p>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ContentSections>
  );
}
