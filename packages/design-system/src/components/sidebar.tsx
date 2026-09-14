"use client";

import { useRender } from "@base-ui/react/use-render";
import { SidebarSimple, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { cn } from "../lib/utils";
import { fluidHoverFade, sidebarHoverTravel, sidebarSelectionTravel, spring } from "../lib/motion";
import {
  AdaptiveSurfaceBackdrop,
  AdaptiveSurfaceClose,
  AdaptiveSurfacePopup,
  AdaptiveSurfacePortal,
  AdaptiveSurfaceProvider,
} from "./adaptive-surface";

type SidebarContextValue = {
  desktopOpen: boolean;
  mobileTriggerRef: React.RefObject<HTMLButtonElement | null>;
  mobileOpen: boolean;
  motionEnabled: boolean;
  prepareMotion: (animate: boolean) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  resizable: boolean;
  setMobileOpen: (open: boolean, animate: boolean) => void;
  toggleDesktop: (animate: boolean) => void;
  toggleMobile: (animate: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

type SidebarProviderProps = ComponentProps<"div"> & {
  shortcut: string | null;
  resizable: boolean;
} & (
  | { mode: "controlled"; open: boolean; onOpenChange: (open: boolean) => void; defaultOpen?: never }
  | { mode: "uncontrolled"; defaultOpen: boolean; onOpenChange?: (open: boolean) => void; open?: never }
);

function SidebarProvider({
  children,
  className,
  defaultOpen,
  mode,
  onOpenChange,
  open,
  shortcut,
  resizable,
  style,
  ...props
}: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const [mobileOpen, setMobileOpenState] = useState(false);
  const [motionEnabled, prepareMotion] = useState(true);
  const desktopOpen = mode === "controlled" ? open : internalOpen;
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const setDesktopOpen = useCallback((next: boolean) => {
    if (mode === "uncontrolled") setInternalOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange, mode]);

  const setMobileOpen = useCallback((nextOpen: boolean, animate: boolean) => {
    prepareMotion(animate);
    setMobileOpenState(nextOpen);
  }, [prepareMotion]);

  const toggleDesktop = useCallback((animate: boolean) => {
    prepareMotion(animate);
    setDesktopOpen(!desktopOpen);
  }, [desktopOpen, prepareMotion, setDesktopOpen]);

  const toggleMobile = useCallback((animate: boolean) => {
    prepareMotion(animate);
    setMobileOpenState((current) => !current);
  }, [prepareMotion]);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === shortcut.toLowerCase()) {
        event.preventDefault();
        toggleDesktop(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut, toggleDesktop]);

  return (
    <AdaptiveSurfaceProvider
      mobileQuery="(max-width: 47.999rem)"
      desktopOpen={desktopOpen}
      mobileOpen={mobileOpen}
      onDesktopOpenChange={setDesktopOpen}
      onMobileOpenChange={(nextOpen, eventDetails) => {
        const animate = !(eventDetails?.event instanceof KeyboardEvent);
        setMobileOpen(nextOpen, animate);
      }}
    >
      <SidebarContext value={{ desktopOpen, mobileOpen, mobileTriggerRef, motionEnabled, prepareMotion, rootRef, resizable, setMobileOpen, toggleDesktop, toggleMobile }}>
        <div
          ref={rootRef}
          data-desktop-open={desktopOpen}
          data-mobile-open={mobileOpen}
          data-motion={motionEnabled ? "animate" : "instant"}
          data-slot="sidebar-provider"
          data-resizable={resizable}
          className={cn(
            "group/sidebar grid min-h-svh grid-cols-[var(--anaphor-sidebar-current-width)_minmax(0,1fr)] overflow-x-clip [--anaphor-sidebar-motion-duration:var(--anaphor-sidebar-exit-duration)] motion-safe:transition-[grid-template-columns] motion-safe:duration-[var(--anaphor-sidebar-motion-duration)] motion-safe:ease-[var(--anaphor-ease-out)] max-md:block",
            desktopOpen
              ? "[--anaphor-sidebar-motion-duration:var(--anaphor-sidebar-duration)]"
              : "md:grid-cols-[0_minmax(0,1fr)]",
            className,
            "[--anaphor-sidebar-current-width:clamp(var(--anaphor-sidebar-min-width),var(--anaphor-sidebar-drag-width,var(--anaphor-sidebar-width)),var(--anaphor-sidebar-max-width))] data-[motion=instant]:[--anaphor-sidebar-motion-duration:0ms] data-resizing:transition-none",
          )}
          style={style}
          {...props}
        >
          {children}
        </div>
      </SidebarContext>
    </AdaptiveSurfaceProvider>
  );
}

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("Sidebar parts must be rendered inside SidebarProvider");
  return context;
}

function Sidebar({ className, style, ...props }: ComponentProps<"aside">) {
  const { desktopOpen, mobileOpen, mobileTriggerRef, motionEnabled } = useSidebar();
  return (
    <AdaptiveSurfacePortal>
      <SidebarScrim />
      <AdaptiveSurfacePopup
        finalFocus={mobileTriggerRef}
        render={
          <aside
            data-slot="sidebar"
            data-motion={motionEnabled ? "animate" : "instant"}
            className={cn(
              "invisible fixed inset-y-0 start-0 z-[var(--anaphor-z-overlay)] flex h-svh w-[min(var(--anaphor-sidebar-mobile-width),calc(100vw-var(--spacing-12)))] [transform:translate3d(-100%,0,0)] flex-col border-e border-border bg-muted text-muted-foreground will-change-transform [--anaphor-sidebar-motion-duration:var(--anaphor-sidebar-exit-duration)] motion-safe:transition-[transform,visibility] motion-safe:duration-[var(--anaphor-sidebar-motion-duration)] motion-safe:ease-[var(--anaphor-ease-out)] data-starting-style:[transform:translate3d(-100%,0,0)] md:sticky md:w-[var(--anaphor-sidebar-current-width)]",
              mobileOpen && "visible [transform:translate3d(0,0,0)] [--anaphor-sidebar-motion-duration:var(--anaphor-sidebar-duration)]",
              desktopOpen ? "md:visible md:[transform:translate3d(0,0,0)] md:[--anaphor-sidebar-motion-duration:var(--anaphor-sidebar-duration)]" : "md:invisible md:[transform:translate3d(-100%,0,0)]",
              className,
              "data-[motion=instant]:[--anaphor-sidebar-motion-duration:0ms] md:data-[motion=instant]:[--anaphor-sidebar-motion-duration:0ms]",
            )}
            style={style}
            {...props}
          />
        }
      />
    </AdaptiveSurfacePortal>
  );
}

function SidebarHeader({ className, ...props }: ComponentProps<"header">) {
  return <header data-slot="sidebar-header" className={cn("flex shrink-0 flex-col gap-1 border-b border-border p-3", className)} {...props} />;
}

function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sidebar-content" className={cn("min-h-0 flex-1 overflow-y-auto p-3 [mask-image:linear-gradient(to_bottom,transparent,#000_var(--spacing-2),#000_calc(100%_-_var(--spacing-2)),transparent)]", className)} {...props} />;
}

function SidebarGroup({ className, ...props }: ComponentProps<"section">) {
  return <section data-slot="sidebar-group" className={cn("mt-5 first:mt-0", className)} {...props} />;
}

function SidebarGroupLabel({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sidebar-group-label" className={cn("flex min-h-8 items-center justify-between px-2 text-label text-muted-foreground", className)} {...props} />;
}

type FluidHighlight = { height: number; initialTop: number; key: number; top: number };
type SelectionHighlight = { height: number; top: number };

function SidebarMenu({ className, onPointerEnter, onPointerLeave, onPointerMove, ...props }: ComponentProps<"ul">) {
  const containerRef = useRef<HTMLUListElement>(null);
  const activeItemRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const highlightKeyRef = useRef(0);
  const [highlight, setHighlight] = useState<FluidHighlight | null>(null);
  const [selection, setSelection] = useState<SelectionHighlight | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function measureSelection() {
      if (!container) return;
      const selected = container.querySelector<HTMLElement>('[data-slot="sidebar-menu-button"][data-active]');
      if (!selected) {
        setSelection(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      const next = {
        height: selectedRect.height,
        top: selectedRect.top - containerRect.top + container.scrollTop,
      };
      setSelection((current) => current?.height === next.height && current.top === next.top ? current : next);
    }
    measureSelection();
    const resize = new ResizeObserver(measureSelection);
    resize.observe(container);
    const mutations = new MutationObserver(measureSelection);
    mutations.observe(container, { attributes: true, attributeFilter: ["data-active"], childList: true, subtree: true });
    return () => {
      resize.disconnect();
      mutations.disconnect();
    };
  }, [props.children]);

  function clearHighlight() {
    activeItemRef.current = null;
    setHighlight(null);
  }

  function updateHighlight(clientY: number) {
    const container = containerRef.current;
    if (!container) {
      clearHighlight();
      return;
    }
    const items = [...container.querySelectorAll<HTMLElement>('[data-slot="sidebar-menu-button"]')];
    let nearest: HTMLElement | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const distance = clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
      if (distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    }
    if (!nearest) {
      clearHighlight();
      return;
    }
    if (nearest === activeItemRef.current) return;
    activeItemRef.current = nearest;
    const containerRect = container.getBoundingClientRect();
    const itemRect = nearest.getBoundingClientRect();
    const top = itemRect.top - containerRect.top + container.scrollTop;
    const selected = container.querySelector<HTMLElement>('[data-slot="sidebar-menu-button"][data-active]');
    const selectedRect = selected?.getBoundingClientRect();
    const selectedTop = selectedRect ? selectedRect.top - containerRect.top + container.scrollTop : top;
    setHighlight((current) => ({
      height: itemRect.height,
      initialTop: current?.top ?? selectedTop,
      key: current?.key ?? ++highlightKeyRef.current,
      top,
    }));
  }

  function scheduleHighlight(event: ReactPointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      clearHighlight();
      return;
    }
    const clientY = event.clientY;
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      updateHighlight(clientY);
    });
  }

  useEffect(() => () => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  return (
    <ul
      ref={containerRef}
      data-slot="sidebar-menu"
      className={cn("relative isolate m-0 list-none p-0", className)}
      onPointerEnter={(event) => { scheduleHighlight(event); onPointerEnter?.(event); }}
      onPointerLeave={(event) => {
        if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        clearHighlight();
        onPointerLeave?.(event);
      }}
      onPointerMove={(event) => { scheduleHighlight(event); onPointerMove?.(event); }}
      {...props}
    >
      <AnimatePresence initial={false}>
        {selection ? (
          <motion.span
            key="sidebar-selection"
            aria-hidden="true"
            data-slot="sidebar-menu-selection"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-md bg-[color-mix(in_oklch,var(--anaphor-font-secondary)_10%,transparent)]"
            initial={false}
            animate={{ transform: `translate3d(0,${selection.top}px,0)` }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            style={{ height: selection.height }}
            transition={{ transform: reducedMotion ? { duration: 0 } : sidebarSelectionTravel }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {highlight ? (
          <motion.span
            key={highlight.key}
            aria-hidden="true"
            data-slot="sidebar-menu-hover"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-md bg-[color-mix(in_oklch,var(--anaphor-font-secondary)_5%,transparent)]"
            initial={{ opacity: 0, transform: `translate3d(0,${highlight.initialTop}px,0)` }}
            animate={{ opacity: 1, transform: `translate3d(0,${highlight.top}px,0)` }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            style={{ height: highlight.height }}
            transition={{ opacity: fluidHoverFade, transform: reducedMotion ? { duration: 0 } : sidebarHoverTravel }}
          />
        ) : null}
      </AnimatePresence>
      {props.children}
    </ul>
  );
}

function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("relative z-10", className)} {...props} />;
}

type SidebarMenuButtonProps = useRender.ComponentProps<"button"> & { isActive: boolean };

function SidebarMenuButton({ className, isActive, render, ...props }: SidebarMenuButtonProps): ReactElement {
  return useRender({
    defaultTagName: "button",
    render,
    state: { active: isActive },
    props: {
      ...props,
      "aria-current": isActive ? "page" : undefined,
      className: cn(
        "relative isolate flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-start text-ui text-muted-foreground no-underline outline-none transition-[color,font-variation-settings] duration-[var(--anaphor-menu-duration)] ease-linear data-active:font-semibold data-active:text-foreground pointer-coarse:min-h-11 [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      ),
      "data-slot": "sidebar-menu-button",
    },
  });
}

function SidebarFooter({ className, ...props }: ComponentProps<"footer">) {
  return <footer data-slot="sidebar-footer" className={cn("flex min-h-14 shrink-0 items-center justify-between border-t border-border px-5 text-label text-muted-foreground", className)} {...props} />;
}

type SidebarTriggerProps = ComponentProps<"button"> & { target: "desktop" | "mobile" };

function SidebarTrigger({ children, className, onClick, target, ...props }: SidebarTriggerProps) {
  const { desktopOpen, mobileOpen, mobileTriggerRef, toggleDesktop, toggleMobile } = useSidebar();
  const expanded = target === "mobile" ? mobileOpen : desktopOpen;
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-expanded={expanded}
      aria-haspopup={target === "mobile" ? "dialog" : undefined}
      aria-label={expanded ? "Collapse sidebar" : "Open sidebar"}
      className={cn("grid size-9 place-items-center rounded-md border-0 bg-transparent text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[var(--anaphor-ease-out)] hover:bg-muted hover:text-foreground active:scale-[0.97] [&>svg]:size-4", className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const animate = event.detail !== 0;
        if (target === "desktop") toggleDesktop(animate);
        else {
          mobileTriggerRef.current = event.currentTarget;
          toggleMobile(animate);
        }
      }}
      {...props}
    >
      {children ?? <SidebarSimple aria-hidden="true" />}
    </button>
  );
}

function SidebarRail({ className, onClick, onKeyDown, onPointerCancel, onPointerDown, onPointerMove, onPointerUp, ...props }: ComponentProps<"button">) {
  const { resizable, rootRef, toggleDesktop } = useSidebar();
  const drag = useRef({ startX: 0, startWidth: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  if (!resizable) return null;

  function start(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const root = rootRef.current;
    const sidebar = root?.querySelector<HTMLElement>('[data-slot="sidebar"]');
    if (!root || !sidebar) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startWidth: sidebar.getBoundingClientRect().width, moved: false };
    setDragging(true);
    root.dataset.resizing = "";
  }

  function move(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > 3) drag.current.moved = true;
    rootRef.current?.style.setProperty("--anaphor-sidebar-drag-width", `${drag.current.startWidth + distance}px`);
  }

  function finish(event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    if (rootRef.current) delete rootRef.current.dataset.resizing;
    if (!cancelled && !drag.current.moved) toggleDesktop(true);
  }

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Adjust or collapse sidebar"
      title="Drag to resize · click to collapse"
      className={cn("absolute inset-y-0 -end-2 z-10 hidden w-4 cursor-ew-resize touch-none border-0 bg-transparent md:block focus-visible:outline-2 focus-visible:outline-ring after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-border after:transition-[background-color,transform] after:duration-150 hover:after:scale-x-200 hover:after:bg-primary", dragging && "after:scale-x-200 after:bg-primary", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && event.detail === 0) toggleDesktop(false);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
        const root = rootRef.current;
        const sidebar = root?.querySelector<HTMLElement>('[data-slot="sidebar"]');
        if (!root || !sidebar) return;
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 16 : -16;
        root.style.setProperty("--anaphor-sidebar-drag-width", `${sidebar.getBoundingClientRect().width + delta}px`);
      }}
      onPointerDown={(event) => { start(event); onPointerDown?.(event); }}
      onPointerMove={(event) => { move(event); onPointerMove?.(event); }}
      onPointerUp={(event) => { finish(event); onPointerUp?.(event); }}
      onPointerCancel={(event) => { finish(event, true); onPointerCancel?.(event); }}
      {...props}
    />
  );
}

function SidebarScrim({ className, ...props }: ComponentProps<typeof AdaptiveSurfaceBackdrop>) {
  const { mobileOpen, motionEnabled } = useSidebar();
  return (
    <AdaptiveSurfaceBackdrop
      data-slot="sidebar-scrim"
      data-motion={motionEnabled ? "animate" : "instant"}
      className={cn("pointer-events-none fixed inset-0 z-[var(--anaphor-z-backdrop)] bg-black/35 opacity-0 transition-opacity duration-200 ease-[var(--anaphor-ease-out)] data-[motion=instant]:duration-0 data-open:pointer-events-auto data-ending-style:opacity-0 data-starting-style:opacity-0 md:hidden", mobileOpen && "opacity-100", className)}
      {...props}
    />
  );
}

function SidebarClose({ children, className, ...props }: ComponentProps<"button">) {
  return (
    <AdaptiveSurfaceClose
      render={<button type="button" />}
      data-slot="sidebar-close"
      aria-label="Close sidebar"
      className={cn("grid size-9 place-items-center rounded-md border-0 bg-transparent text-muted-foreground transition-colors duration-150 ease hover:bg-muted hover:text-foreground active:scale-[0.97] md:hidden [&>svg]:size-4", className)}
      {...props}
    >
      {children ?? <X aria-hidden="true" />}
    </AdaptiveSurfaceClose>
  );
}

function SidebarInset({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("min-w-0 bg-background", className)} {...props} />;
}

export {
  Sidebar,
  SidebarContent,
  SidebarClose,
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
  type SidebarMenuButtonProps,
  type SidebarProviderProps,
  type SidebarTriggerProps,
};
