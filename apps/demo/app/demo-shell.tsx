"use client";

import {
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
  CaretRight,
  CheckSquare,
  CursorClick,
  House,
  ListDashes,
  MagnifyingGlass,
  Palette,
  Plus,
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
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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
      { id: "checkbox", label: "Checkbox", href: "/#checkbox", icon: CheckSquare },
      { id: "dropdown-menu", label: "Dropdown menu", href: "/#dropdown-menu", icon: ListDashes },
    ],
  },
];

const sectionIds = groups.flatMap((group) => group.items.map((item) => item.id));

function DemoSidebar() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("purpose");
  const { setMobileOpen } = useSidebar();
  const closeMobile = () => setMobileOpen(false, true);

  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = "purpose";
      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) current = id;
      }
      setActiveId(current);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [pathname]);

  return (
    <Sidebar aria-label="Component manual navigation">
      <SidebarHeader>
        <SidebarClose className="absolute end-3 top-3" />
        <Link href="/" onNavigate={closeMobile} className="grid min-h-11 grid-cols-[var(--spacing-7)_minmax(0,1fr)_var(--spacing-4)] items-center gap-2 rounded-md px-2 text-foreground no-underline hover:bg-background">
          <span className="grid size-7 place-items-center rounded-sm bg-foreground font-heading text-body text-background">a</span>
          <span className="min-w-0"><strong className="block text-small leading-tight">Anaphor</strong><small className="block text-label text-muted-foreground">Component manual</small></span>
          <CaretRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="sm" variant="ghost" tone="neutral" className="mt-1 w-full justify-start text-muted-foreground">
          <MagnifyingGlass aria-hidden="true" /><ButtonLabel>Search components</ButtonLabel><kbd className="ms-auto font-mono text-label">⌘K</kbd>
        </Button>
        <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="sm" variant="ghost" tone="neutral" className="w-full justify-start text-muted-foreground">
          <Plus aria-hidden="true" /><ButtonLabel>New component</ButtonLabel>
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
                    <SidebarMenuButton isActive={id === activeId} render={<Link href={href} onNavigate={closeMobile} />}>
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

export function DemoShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}>
      <a href="#content" className="fixed start-3 top-3 z-[var(--anaphor-z-a11y)] -translate-y-[200%] bg-foreground px-3 py-2 text-ui text-background focus-visible:translate-y-0">Skip to content</a>
      <DemoSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-[var(--anaphor-z-navigation)] flex h-14 items-center gap-3 border-b border-border bg-[color-mix(in_oklch,var(--anaphor-background)_88%,transparent)] px-4 backdrop-blur-md">
          <SidebarTrigger target="mobile" className="md:hidden" />
          <SidebarTrigger target="desktop" className="hidden md:grid" />
          <span className="h-4 w-px bg-border" />
          <p className="flex items-center gap-2 text-small"><span className="text-muted-foreground">Library</span><b className="font-normal text-border">/</b><strong className="font-medium">Components</strong></p>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
