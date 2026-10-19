"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

export function TableFluidHover({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<{ top: number; left: number; radius: string; height: number; width: number } | null>(null);
  const reducedMotion = useReducedMotion();
  function track(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const container = ref.current;
    const row = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-fluid-row]") : null;
    if (!container || !row || !container.contains(row)) { setHighlight(null); return; }
    const rect = row.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    const top = rect.top - bounds.top;
    const left = rect.left - bounds.left;
    const radius = getComputedStyle(row).borderRadius;
    setHighlight(current => current?.top === top && current.left === left && current.radius === radius && current.height === rect.height && current.width === rect.width ? current : { top, left, radius, height: rect.height, width: rect.width });
  }
  return <div ref={ref} className="relative isolate" onPointerMove={track} onPointerLeave={() => setHighlight(null)} onPointerDown={() => setHighlight(null)} onKeyDown={() => setHighlight(null)}>
    {highlight && <motion.div aria-hidden="true" data-slot="table-hover" className="pointer-events-none absolute left-0 top-0 -z-10 bg-muted/60"
      initial={false} animate={{ x: highlight.left, y: highlight.top }} style={{ borderRadius: highlight.radius, height: highlight.height, width: highlight.width }}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.08, bounce: 0 }} />}
    {children}
  </div>;
}
