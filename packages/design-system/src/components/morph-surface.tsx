"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react";
import { motionDelay, motionDuration, spring } from "../lib/motion";
import { cn } from "../lib/utils";
import {
  AdaptiveSurfaceClose,
  AdaptiveSurfacePopup,
  AdaptiveSurfacePortal,
  AdaptiveSurfaceProvider,
  AdaptiveSurfaceTrigger,
  useAdaptiveSurface,
} from "./adaptive-surface";
import { Text } from "./text";

// Preserve the reference's trigger-anchored reveal without animating layout dimensions.
const easeOut = [0.23, 1, 0.32, 1] as const;
const collapsed = "inset(calc(100% - 44px) 0px 0px calc(100% - 44px) round 12px)";
const expanded = "inset(0px 0px 0px 0px round 12px)";
const closeButtonStyles = cn(
  // Layout and surface
  "flex size-11 shrink-0 items-center justify-center rounded-md bg-background/70",
  // Interaction states
  "hover:bg-background active:bg-background",
  // Accessibility
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

type MorphSurfaceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Focus within the open content or a pointer held on the surface. */
  onInteractionChange?: (interacting: boolean) => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function MorphSurfaceContent({ open, onOpenChange, onInteractionChange, title, icon, children }: MorphSurfaceProps) {
  const id = useId();
  const { mobile } = useAdaptiveSurface();
  const reducedMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const changeOpen = useEffectEvent((value: boolean) => onOpenChange(value));
  const reportInteraction = useEffectEvent((value: boolean) => onInteractionChange?.(value));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const document = element.ownerDocument;
    const window = document.defaultView;
    if (!window) return;
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
      if (!(event.target instanceof window.Node)) return;
      const inside = element.contains(event.target) || content.current?.contains(event.target);
      if (inside) {
        pointers.add(event.pointerId);
        update();
      } else if (open && !mobile) {
        changeOpen(false);
      }
    };
    const release = (event: PointerEvent) => { pointers.delete(event.pointerId); update(); };
    const blur = () => { pointers.clear(); update(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || !open) return;
      if (event.target instanceof window.Node && content.current?.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
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
  }, [mobile, open]);

  useEffect(() => {
    if (open) content.current?.focus();
    else if (wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Allow time to read the entrance; get out of the way quickly on dismissal.
  const duration = open ? motionDuration.deliberate : motionDuration.standard;
  const reveal = reducedMotion
    ? { duration: 0 }
    : { duration, delay: open ? 0 : motionDelay.short, ease: easeOut };
  const fade = { duration, ease: easeOut };

  const header = (
    <div className="flex shrink-0 items-center gap-3 p-4">
      {open ? <motion.span aria-hidden="true" layoutId={reducedMotion ? undefined : `${id}-dot`} transition={spring.morph} className="size-2 shrink-0 rounded-full bg-primary" /> : <span className="size-2 shrink-0" />}
      <Text as="h2" variant="heading" className="min-w-0 flex-1">{title}</Text>
      {mobile ? (
        <AdaptiveSurfaceClose
          render={<button type="button" />}
          aria-label="Close controls"
          className={closeButtonStyles}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none size-5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </AdaptiveSurfaceClose>
      ) : (
        <button
          type="button"
          aria-label="Close controls"
          className={closeButtonStyles}
          onClick={() => onOpenChange(false)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none size-5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );

  const body = <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>;

  return (
    <div ref={root} className={cn(
      // Mobile position
      "fixed right-[var(--anaphor-page-gutter)] bottom-[var(--anaphor-page-gutter)] z-[var(--anaphor-z-floating)] size-11",
      // Desktop position and elevation
      "md:relative md:right-auto md:bottom-auto md:z-auto md:[filter:var(--anaphor-filter-shadow-card)]",
    )}>
      <AdaptiveSurfaceTrigger
        ref={trigger}
        type="button"
        aria-label={`Open ${title}`}
        aria-expanded={open}
        aria-controls={id}
        tabIndex={open ? -1 : 0}
        aria-hidden={open || undefined}
        className={cn(
          // Position and layout
          "absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-card",
          // Surface and accessibility
          "bg-muted text-foreground shadow-card -outline-offset-4 md:shadow-none",
        )}
        style={{ visibility: open ? "hidden" : "visible" }}
        onClick={() => {
          if (!mobile) onOpenChange(true);
        }}
      >
        {!open && <motion.span aria-hidden="true" layoutId={reducedMotion ? undefined : `${id}-dot`} transition={spring.morph} className="flex size-5 items-center justify-center rounded-full bg-primary text-background [&>svg]:size-3.5">{icon}</motion.span>}
      </AdaptiveSurfaceTrigger>
      <AdaptiveSurfacePortal keepMounted>
        <AdaptiveSurfacePopup
          finalFocus={trigger}
          initialFocus={content}
          render={
            mobile ? (
              <div
                ref={content}
                id={id}
                data-slot="morph-surface"
                aria-label={title}
                tabIndex={-1}
                className={cn(
                  // Position and interaction
                  "data-closed:pointer-events-none fixed inset-x-[var(--anaphor-page-gutter)] bottom-[var(--anaphor-page-gutter)] z-[var(--anaphor-z-floating)]",
                  // Layout and surface
                  "flex max-h-[min(45dvh,20rem)] w-auto flex-col rounded-card bg-muted text-foreground shadow-card outline-none",
                  // Motion
                  "[transition:transform_var(--anaphor-motion-duration-deliberate)_var(--anaphor-ease-out),opacity_var(--anaphor-motion-duration-deliberate)_var(--anaphor-ease-out)]",
                  // Exit state
                  "data-ending-style:[transform:translateY(calc(100%_+_var(--anaphor-page-gutter)))]",
                  "data-ending-style:[transition:transform_var(--anaphor-motion-duration-standard)_var(--anaphor-ease-out)_var(--anaphor-motion-delay-short),opacity_var(--anaphor-motion-duration-standard)_var(--anaphor-ease-out)]",
                  "data-ending-style:opacity-0",
                  // Entry state
                  "data-starting-style:[transform:translateY(calc(100%_+_var(--anaphor-page-gutter)))] data-starting-style:opacity-0",
                  // Reduced motion
                  "motion-reduce:[transition:opacity_var(--anaphor-motion-duration-standard)_var(--anaphor-ease-out)]",
                  "motion-reduce:data-ending-style:[transform:none] motion-reduce:data-ending-style:[transition:opacity_var(--anaphor-motion-duration-standard)_var(--anaphor-ease-out)]",
                  "motion-reduce:data-starting-style:[transform:none]",
                )}
              />
            ) : (
              <motion.div
                ref={content}
                id={id}
                data-slot="morph-surface"
                role="region"
                aria-label={title}
                aria-hidden={!open || undefined}
                inert={!open}
                tabIndex={-1}
                className={cn(
                  // Position and layout
                  "absolute right-0 bottom-0 flex max-h-[calc(100dvh-2rem)] w-[min(360px,calc(100vw-32px))] flex-col rounded-card",
                  // Surface and accessibility
                  "bg-muted text-foreground outline-none",
                )}
                style={{ pointerEvents: open ? "auto" : "none", transformOrigin: "bottom right" }}
                initial={false}
                animate={{ clipPath: open || reducedMotion ? expanded : collapsed, opacity: open ? 1 : 0 }}
                transition={{ clipPath: reveal, opacity: fade }}
              />
            )
          }
        >
          {header}
          {body}
        </AdaptiveSurfacePopup>
      </AdaptiveSurfacePortal>
    </div>
  );
}

function MorphSurface(props: MorphSurfaceProps) {
  return (
    <AdaptiveSurfaceProvider
      desktopOpen={props.open}
      mobileModal={false}
      mobileOpen={props.open}
      mobileQuery="(max-width: 47.999rem)"
      onDesktopOpenChange={props.onOpenChange}
      onMobileOpenChange={props.onOpenChange}
    >
      <MorphSurfaceContent {...props} />
    </AdaptiveSurfaceProvider>
  );
}

export { MorphSurface, type MorphSurfaceProps };
