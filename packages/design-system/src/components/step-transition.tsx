"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

type StepTransitionProps = {
  /** Stable identity of the visible content. */
  value: string;
  /** Logical travel: next enters from the inline end, previous from the inline start. */
  direction: "forward" | "backward";
  dir?: "ltr" | "rtl";
  animate: boolean;
  children: ReactNode;
  className?: string;
};

const travel = {
  enter: (direction: number) => ({ x: `${110 * direction}%`, opacity: 0 }),
  active: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: `${-110 * direction}%`, opacity: 0 }),
};

/** Navigation and semantics belong to the consumer; this surface owns only the transition. */
function StepTransition({ value, direction, dir = "ltr", animate, children, className }: StepTransitionProps) {
  const reducedMotion = useReducedMotion();
  const instant = !animate || reducedMotion;
  const [height, setHeight] = useState<number | null>(null);
  const sign = (direction === "forward" ? 1 : -1) * (dir === "rtl" ? -1 : 1);
  return <motion.div dir={dir} data-slot="step-transition" className={cn("relative min-w-0 overflow-hidden", className)}
    initial={false} animate={{ height: height ?? "auto" }} transition={{ type: "spring", duration: instant ? 0 : 0.3, bounce: 0 }}>
    <AnimatePresence initial={false} mode="popLayout" custom={sign}>
      <StepContent key={value} direction={sign} instant={Boolean(instant)} onHeight={setHeight}>{children}</StepContent>
    </AnimatePresence>
  </motion.div>;
}

const StepContent = forwardRef<HTMLDivElement, { direction: number; instant: boolean; onHeight: (height: number) => void; children: ReactNode }>(
  function StepContent({ direction, instant, onHeight, children }, ref) {
    const present = useIsPresent();
    const measured = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
      const element = measured.current;
      if (!element || !present) return;
      const measure = () => onHeight(element.getBoundingClientRect().height);
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }, [present, onHeight]);
    return <motion.div ref={ref} custom={direction} variants={travel} initial={instant ? false : "enter"} animate="active" exit="exit"
      transition={{ type: "spring", duration: instant ? 0 : 0.3, bounce: 0 }} inert={!present || undefined} aria-hidden={!present || undefined}>
      <div ref={measured} className="flow-root">{children}</div>
    </motion.div>;
  },
);

export { StepTransition, type StepTransitionProps };
