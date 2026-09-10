"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from "react";

// Preserve the reference's trigger-anchored reveal without animating layout dimensions.
const easeOut = [0.23, 1, 0.32, 1] as const;
const collapsed = "inset(calc(100% - 44px) 0px 0px calc(100% - 44px) round 12px)";
const expanded = "inset(0px 0px 0px 0px round 12px)";

type MorphSurfaceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Focus within the open content or a pointer held on the surface. */
  onInteractionChange?: (interacting: boolean) => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function MorphSurface({ open, onOpenChange, onInteractionChange, title, icon, children }: MorphSurfaceProps) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [instant, setInstant] = useState(false);
  const changeOpen = useEffectEvent((value: boolean) => onOpenChange(value));
  const reportInteraction = useEffectEvent((value: boolean) => onInteractionChange?.(value));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const document = element.ownerDocument;
    const window = document.defaultView!;
    const pointers = new Set<number>();
    let interacting = false;
    let disposed = false;
    const update = () => {
      if (disposed) return;
      const next = pointers.size > 0 || Boolean(open && content.current?.contains(document.activeElement));
      if (next !== interacting) { interacting = next; reportInteraction(next); }
    };
    const focus = () => queueMicrotask(update);
    const press = (event: PointerEvent) => {
      if (event.target instanceof window.Node && element.contains(event.target)) {
        pointers.add(event.pointerId);
        update();
      }
    };
    const release = (event: PointerEvent) => { pointers.delete(event.pointerId); update(); };
    const blur = () => { pointers.clear(); update(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || !open) return;
      if (event.target instanceof window.Node && content.current?.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        setInstant(true);
        changeOpen(false);
      }
    };
    // DOM ownership includes children portaled here from another React tree.
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
    if (open) content.current?.focus();
    else if (wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Allow time to read the entrance; get out of the way quickly on dismissal.
  const duration = instant ? 0 : reducedMotion ? 0.2 : open ? 0.25 : 0.15;
  const reveal = { duration: reducedMotion ? 0 : duration, ease: easeOut };
  const fade = { duration, ease: easeOut };

  return (
    <div ref={root} className="relative size-11 drop-shadow-lg">
      <button
        ref={trigger}
        type="button"
        aria-label={`Open ${title}`}
        aria-expanded={open}
        aria-controls={id}
        tabIndex={open ? -1 : 0}
        aria-hidden={open || undefined}
        className="absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-card bg-muted text-foreground -outline-offset-4"
        style={{ visibility: open ? "hidden" : "visible" }}
        onClick={(event) => { setInstant(event.detail === 0); onOpenChange(true); }}
      >
        {!open && <motion.span aria-hidden="true" layoutId={reducedMotion || instant ? undefined : `${id}-dot`} transition={reveal} className="flex size-5 items-center justify-center rounded-full bg-primary text-background [&>svg]:size-3.5">{icon}</motion.span>}
      </button>
      <motion.div
        ref={content}
        id={id}
        role="region"
        aria-label={title}
        aria-hidden={!open || undefined}
        inert={!open}
        tabIndex={-1}
        className="absolute right-0 bottom-0 flex max-h-[calc(100dvh-2rem)] flex-col rounded-card bg-muted text-foreground outline-none"
        style={{ width: "min(360px, calc(100vw - 32px))", pointerEvents: open ? "auto" : "none", transformOrigin: "bottom right" }}
        initial={false}
        animate={{ clipPath: open || reducedMotion ? expanded : collapsed, opacity: open ? 1 : 0 }}
        transition={{ clipPath: reveal, opacity: fade }}
      >
        <div className="flex shrink-0 items-center gap-3 p-4">
          {open ? <motion.span aria-hidden="true" layoutId={reducedMotion || instant ? undefined : `${id}-dot`} transition={reveal} className="size-2 shrink-0 rounded-full bg-primary" /> : <span className="size-2 shrink-0" />}
          <h2 className="min-w-0 flex-1 font-sans text-label uppercase">{title}</h2>
          <button
            type="button"
            aria-label="Close controls"
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background/70 hover:bg-background active:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={(event) => { setInstant(event.detail === 0); onOpenChange(false); }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none size-5">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 pb-4">{children}</div>
      </motion.div>
    </div>
  );
}

export { MorphSurface, type MorphSurfaceProps };
