"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Adapted from the Devouring Details Morph Surface prototype.
const surfaceSpring = { type: "spring", stiffness: 550, damping: 45, mass: 0.7 } as const;
const dotSpring = { type: "spring", stiffness: 350, damping: 35 } as const;

type MorphSurfaceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function MorphSurface({ open, onOpenChange, title, icon, children }: MorphSurfaceProps) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [height, setHeight] = useState(44);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const resize = () => setWidth(Math.min(360, window.innerWidth - 32));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useLayoutEffect(() => {
    if (content.current) content.current.inert = !open;
    if (!open || !content.current) return;
    const element = content.current;
    const resize = () => setHeight(element.getBoundingClientRect().height);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (open) content.current?.focus();
    else if (wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const spring = reducedMotion ? { duration: 0 } : surfaceSpring;
  const dotTransition = reducedMotion ? { duration: 0 } : dotSpring;

  return (
    <motion.div
      className="relative overflow-hidden bg-muted text-foreground shadow-lg"
      initial={false}
      animate={{ width: open ? width : 44, height: open ? height : 44, borderRadius: 12 }}
      transition={{ ...spring, delay: !open && !reducedMotion ? 0.08 : 0 }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          onOpenChange(false);
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`Open ${title}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        tabIndex={open ? -1 : 0}
        aria-hidden={open || undefined}
        className="absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-card -outline-offset-4"
        style={{ pointerEvents: open ? "none" : "auto" }}
        onClick={() => onOpenChange(true)}
      >
        {!open && <motion.span aria-hidden="true" layoutId={reducedMotion ? undefined : `${id}-dot`} transition={dotTransition} className="flex size-5 items-center justify-center rounded-full bg-primary text-background [&>svg]:size-3.5">{icon}</motion.span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            id={id}
            ref={content}
            role="region"
            aria-label={title}
            tabIndex={-1}
            className="absolute right-0 bottom-0 flex max-h-[calc(100dvh-2rem)] flex-col outline-none"
            style={{ width }}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <div className="flex shrink-0 items-center gap-3 p-4">
              <motion.span aria-hidden="true" layoutId={reducedMotion ? undefined : `${id}-dot`} transition={dotTransition} className="size-2 shrink-0 rounded-full bg-primary" />
              <h2 className="min-w-0 flex-1 font-mono text-label uppercase">{title}</h2>
              <button type="button" aria-label="Close controls" className="flex size-11 shrink-0 items-center justify-center rounded-md text-body" onClick={() => onOpenChange(false)}>×</button>
            </div>
            <motion.div key={title} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={spring} className="min-h-0 overflow-y-auto px-4 pb-4">{children}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { MorphSurface, type MorphSurfaceProps };
