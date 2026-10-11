"use client";

import { animate, type AnimationPlaybackControls } from "motion/react";
import { useLayoutEffect, useRef, type RefObject } from "react";

type Frame = { element: HTMLElement; x: number; width: number; pixelScale: number; transformX: number };
type Geometry = { card: Frame; panels: Frame[]; content: Frame[] };
type Options = {
  rootRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  open: boolean;
  side: "left" | "right" | "both";
  duration: number;
  ease: [number, number, number, number];
};

// The grid adopts the destination layout once. Only surface transforms change
// between frames; the card's children counter-scale so text never stretches.
function useWorkspaceSidebarMotion({ rootRef, enabled, open, side, duration, ease }: Options) {
  const previous = useRef<{ open: boolean; side: Options["side"]; geometry: Geometry } | null>(null);
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const pendingFrame = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) {
      previous.current = null;
      return;
    }
    const owned = (element: HTMLElement) => element.closest('[data-slot="sidebar-provider"]') === root;
    const inset = [...root.querySelectorAll<HTMLElement>('[data-slot="sidebar-inset"]')].find(owned);
    const card = inset?.querySelector<HTMLElement>('[data-slot="workspace-card"]');
    if (!card) return;
    const panels = [...root.querySelectorAll<HTMLElement>('[data-slot="sidebar"]')].filter(owned);
    const content = [...root.querySelectorAll<HTMLElement>('[data-slot="sidebar-inset-content"]')].filter(owned);
    const children = [...card.children].filter((element): element is HTMLElement => element instanceof HTMLElement);
    const measure = (element: HTMLElement): Frame => {
      const rect = element.getBoundingClientRect();
      const transform = getComputedStyle(element).transform;
      // DOM rects include page zoom, while transform distances use CSS pixels.
      return { element, x: rect.x, width: rect.width, pixelScale: element.offsetWidth ? rect.width / element.offsetWidth : 1, transformX: !transform || transform === "none" ? 0 : new DOMMatrix(transform).m41 };
    };
    const measureGeometry = (): Geometry => ({ card: measure(card), panels: panels.map(measure), content: content.map(measure) });
    const target = measureGeometry();
    if (!target.card.width) return;
    const childOffsets = new Map(children.map(child => [child, measure(child).x - target.card.x]));
    const contentParents = new Map(content.map(element => [element, [...content].reverse().find(parent => parent !== element && parent.contains(element))]));
    const before = previous.current;
    const saved = new Map([...new Set([card, ...panels, ...content, ...children])].map(element => [element, {
      transform: element.style.transform,
      transformOrigin: element.style.transformOrigin,
      visibility: element.style.visibility,
    }]));
    const restore = () => {
      for (const [element, style] of saved) Object.assign(element.style, style);
    };
    const remember = () => { previous.current = { open, side, geometry: measureGeometry() }; };
    const canAnimate = before && before.side === side && before.open !== open && duration > 0 && before.geometry.card.element === card && target.card.width > 0;
    if (canAnimate) {
      const from = before.geometry;
      const interpolate = (a: number, b: number, progress: number) => a + (b - a) * progress;
      const startFor = (frames: Frame[], frame: Frame) => frames.find(previous => previous.element === frame.element) ?? frame;
      const render = (progress: number) => {
        const x = interpolate(from.card.x, target.card.x, progress);
        const width = interpolate(from.card.width, target.card.width, progress);
        const scale = width / target.card.width;
        const displacement = x - target.card.x;
        card.style.transformOrigin = "0 0";
        card.style.transform = `translate3d(${displacement / target.card.pixelScale}px,0,0) scaleX(${scale})`;
        for (const child of children) {
          child.style.transformOrigin = "0 0";
          const offset = childOffsets.get(child) ?? 0;
          child.style.transform = `translate3d(${offset * (1 / scale - 1) / target.card.pixelScale}px,0,0) scaleX(${1 / scale})`;
        }
        const panelFrames = target.panels.map(frame => {
          const start = startFor(from.panels, frame);
          const x = interpolate(start.x, frame.x, progress);
          frame.element.style.transform = `translate3d(${frame.transformX + (x - frame.x) / frame.pixelScale}px,0,0)`;
          // Closed panels are inert immediately, but remain painted during exit.
          if (frame.width > 0) frame.element.style.visibility = "visible";
          return { ...frame, x };
        });
        const contentDisplacements = new Map<HTMLElement, number>();
        const contentFrames = target.content.map(frame => {
          const start = startFor(from.content, frame);
          const x = interpolate(start.x, frame.x, progress);
          const insideCard = card.contains(frame.element);
          const parent = contentParents.get(frame.element);
          const inherited = parent ? contentDisplacements.get(parent) ?? 0 : insideCard ? displacement : 0;
          const translation = x - frame.x - inherited;
          contentDisplacements.set(frame.element, x - frame.x);
          const isCardChild = frame.element.parentElement === card;
          frame.element.style.transformOrigin = "0 0";
          frame.element.style.transform = isCardChild
            ? `translate3d(${(translation + (frame.x - target.card.x) * (1 - scale)) / scale / frame.pixelScale}px,0,0) scaleX(${1 / scale})`
            : `translate3d(${translation / frame.pixelScale}px,0,0)`;
          return { ...frame, x };
        });
        previous.current = { open, side, geometry: { card: { ...target.card, x, width }, panels: panelFrames, content: contentFrames } };
      };
      render(0);
      // Start the clock at the next paint, after the rest of React's commit.
      // Otherwise a busy commit can consume the exit before it is visible.
      pendingFrame.current = requestAnimationFrame(() => {
        pendingFrame.current = null;
        animation.current = animate(0, 1, {
          startTime: performance.now(), duration, ease, onUpdate: render,
          onComplete: () => { animation.current = null; restore(); remember(); },
        });
      });
    } else {
      remember();
    }

    const observer = new ResizeObserver(() => { if (!animation.current) remember(); });
    observer.observe(card);
    for (const panel of panels) observer.observe(panel);
    const cancelPending = () => {
      if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
      pendingFrame.current = null;
    };
    const settle = () => {
      cancelPending();
      animation.current?.stop();
      animation.current = null;
      restore();
      remember();
    };
    // A direction change can move rails without changing their width, so the
    // resize observer alone cannot keep the next transition's origin current.
    const directionObserver = new MutationObserver(settle);
    for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
      directionObserver.observe(ancestor, { attributes: true, attributeFilter: ["dir"] });
    }
    window.addEventListener("resize", settle);
    return () => {
      cancelPending();
      observer.disconnect();
      directionObserver.disconnect();
      window.removeEventListener("resize", settle);
      animation.current?.stop();
      animation.current = null;
      restore();
    };
  }, [rootRef, enabled, open, side, duration, ease]);
}

export { useWorkspaceSidebarMotion };
