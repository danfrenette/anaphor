"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Text } from "./text";

type MorphSurfaceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInteractionChange?: (interacting: boolean) => void;
  title: string;
  icon?: ReactNode;
  /** Persistent actions below the expanding content. */
  bar?: (props: { panelId: string }) => ReactNode;
  /** Changes fade the new view in while the shell measures its height. */
  viewKey?: string;
  wide?: boolean;
  /** Tab interfaces keep focus on their selected tab. */
  focusOnOpen?: boolean;
  /** Disable spatial motion for keyboard activation. */
  animate?: boolean;
  children: ReactNode;
};

function MorphSurface({ open, onOpenChange, onInteractionChange, title, icon, bar, viewKey = title, wide = false, focusOnOpen = true, animate = true, children }: MorphSurfaceProps) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const instant = reducedMotion || !animate;
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const measured = useRef<HTMLDivElement>(null);
  const persistentBar = useRef<HTMLDivElement>(null);
  const barContent = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [height, setHeight] = useState(0);
  const [barHeight, setBarHeight] = useState(56);
  const [barWidth, setBarWidth] = useState<number | null>(null);
  const changeOpen = useEffectEvent(onOpenChange);
  const reportInteraction = useEffectEvent((value: boolean) => onInteractionChange?.(value));
  const surfaceStyle: CSSProperties & Record<`--${string}`, string> = {
    "--surface-width": wide ? "560px" : "360px",
    "--surface-bar-height": `${barHeight}px`,
    "--surface-bar-width": barWidth === null ? "max-content" : `${barWidth}px`,
  };

  useEffect(() => {
    const element = measured.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = persistentBar.current;
    const actions = barContent.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setBarHeight(element.getBoundingClientRect().height);
      if (actions) setBarWidth(actions.getBoundingClientRect().width + 12);
    });
    observer.observe(element);
    if (actions) observer.observe(actions);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Portaled popups remain owned by their triggers inside this surface.
    const containsPopup = (target: Node) =>
      [...element.querySelectorAll("[aria-controls]")].some(trigger =>
        trigger.getAttribute("aria-controls")?.split(/\s+/).some(id => document.getElementById(id)?.contains(target)));
    const contains = (target: Node) => element.contains(target) || containsPopup(target);
    const pointers = new Set<number>();
    let interacting = false;
    let disposed = false;
    const update = () => {
      if (disposed) return;
      const focused = document.activeElement;
      const next = pointers.size > 0 || Boolean(open && focused && focused !== content.current && (content.current?.contains(focused) || (!element.contains(focused) && containsPopup(focused))));
      if (next !== interacting) { interacting = next; reportInteraction(next); }
    };
    const focus = () => queueMicrotask(update);
    const press = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (contains(event.target)) { pointers.add(event.pointerId); update(); }
      else if (open) changeOpen(false);
    };
    const release = (event: PointerEvent) => { pointers.delete(event.pointerId); update(); };
    const blur = () => { pointers.clear(); update(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || !open || !(event.target instanceof Node) || !contains(event.target)) return;
      event.preventDefault();
      changeOpen(false);
      returnFocus.current?.focus();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", focus);
    document.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", blur);
    update();
    return () => {
      disposed = true;
      document.removeEventListener("keydown", escape);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", focus);
      document.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", blur);
      if (interacting) reportInteraction(false);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      if (document.activeElement instanceof HTMLElement && root.current?.contains(document.activeElement)) returnFocus.current = document.activeElement;
      if (focusOnOpen) content.current?.focus({ preventScroll: true });
    } else if (content.current?.contains(document.activeElement)) {
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [open, focusOnOpen]);

  return <div ref={root} data-slot="morph-surface" data-open={open || undefined}
    style={surfaceStyle}
    className={cn("fixed [--surface-gutter:var(--anaphor-page-gutter)] md:[--surface-gutter:1rem] right-[max(var(--surface-gutter),env(safe-area-inset-right))] bottom-[max(var(--surface-gutter),env(safe-area-inset-bottom))] z-[var(--anaphor-z-floating)] max-w-[calc(100vw-max(var(--surface-gutter),env(safe-area-inset-left))-max(var(--surface-gutter),env(safe-area-inset-right)))] max-h-[min(45dvh,320px)] md:max-h-none flex flex-col overflow-hidden rounded-[24px] bg-muted text-foreground shadow-card",
      instant ? "transition-none" : "transition-[width] ease-[cubic-bezier(0.65,0,0.35,1)]",
      open ? "duration-[270ms]" : "duration-200",
      open ? "w-[calc(100vw-max(var(--surface-gutter),env(safe-area-inset-left))-max(var(--surface-gutter),env(safe-area-inset-right)))] md:w-[var(--surface-width)]" : bar ? "w-[var(--surface-bar-width)]" : "w-[304px]")}>
    <div ref={persistentBar} className={cn("flex shrink-0 justify-end p-1.5", open && "border-t border-border")} onFocusCapture={event => {
      if (event.target instanceof HTMLButtonElement && event.target.hasAttribute("aria-controls")) returnFocus.current = event.target;
    }}>
      {bar ? <div ref={barContent} className="w-max">{bar({ panelId: id })}</div> : <button type="button" aria-label={`Open ${title}`} aria-expanded={open} aria-controls={id}
        onClick={() => onOpenChange(!open)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-ui focus-visible:outline-2 focus-visible:outline-ring">{icon}{title}</button>}
    </div>
    <motion.div initial={false} animate={{ height: open ? height : 0 }} transition={{ duration: instant ? 0 : open ? 0.27 : 0.2, ease: [0.65, 0, 0.35, 1] }}
      className={cn("order-first min-h-0 overflow-hidden", bar && !open && barWidth === null && "w-0")} inert={!open} aria-hidden={!open || undefined}>
      <div ref={measured} className="w-[calc(100vw-max(var(--surface-gutter),env(safe-area-inset-left))-max(var(--surface-gutter),env(safe-area-inset-right)))] max-h-[max(0px,calc(min(45dvh,320px)-var(--surface-bar-height)))] md:w-[min(var(--surface-width),calc(100vw-2rem))] md:max-h-none">
        <div ref={content} id={id} role="region" aria-label={title} tabIndex={-1} className="flex max-h-[inherit] min-h-0 flex-col outline-none">
          <div className="flex shrink-0 items-center gap-3 px-5 pt-3 pb-1">
            <Text as="h2" variant="heading" className="min-w-0 flex-1">{title}</Text>
            <button type="button" aria-label="Close controls" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => { onOpenChange(false); returnFocus.current?.focus(); }}>
              <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <motion.div key={viewKey} initial={false} animate={{ opacity: instant ? 1 : [0, 1], y: instant ? 0 : [4, 0] }} transition={{ duration: instant ? 0 : 0.2 }}
            className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-2 pb-4 md:max-h-[min(55dvh,calc(100dvh-10rem),32rem)]">
            {children}
          </motion.div>
        </div>
      </div>
    </motion.div>

  </div>;
}

export { MorphSurface, type MorphSurfaceProps };
