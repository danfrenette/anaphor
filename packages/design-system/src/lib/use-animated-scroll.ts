"use client";

import { animate } from "motion";
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export type ScrollTransition = {
  offset: number;
  duration: number;
  ease: [number, number, number, number];
};

type ScrollRequest = {
  element: HTMLElement;
  offset: number;
  controls?: ReturnType<typeof animate>;
};

const destination = ({ element, offset }: ScrollRequest, container: HTMLElement | null) => Math.max(0, Math.min(
  container
    ? container.scrollTop + element.getBoundingClientRect().top - container.getBoundingClientRect().top - offset
    : window.scrollY + element.getBoundingClientRect().top - offset,
  container ? container.scrollHeight - container.clientHeight : document.documentElement.scrollHeight - window.innerHeight,
));

/** Interruptible scrolling. The caller owns destination selection and focus. */
export function useAnimatedScroll(onScroll: () => void, scrollContainerRef?: RefObject<HTMLElement | null>) {
  const request = useRef<ScrollRequest | null>(null);
  const notify = useRef(onScroll);
  useLayoutEffect(() => { notify.current = onScroll; }, [onScroll]);

  const stop = useCallback(() => {
    const previous = request.current;
    request.current = null;
    previous?.controls?.stop();
  }, []);
  const isScrolling = useCallback(() => request.current !== null, []);
  const scrollTo = useCallback((element: HTMLElement, { offset, duration, ease }: ScrollTransition) => {
    stop();
    const container = scrollContainerRef?.current ?? null;
    const position = () => container?.scrollTop ?? window.scrollY;
    const moveTo = (top: number) => {
      if (container) container.scrollTo({ top, behavior: "instant" });
      else window.scrollTo({ top, behavior: "instant" });
    };
    const current: ScrollRequest = { element, offset };
    const top = destination(current, container);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || duration <= 0 || top === position()) {
      moveTo(top);
      return;
    }
    request.current = current;
    current.controls = animate(position(), top, {
      duration, ease,
      onUpdate: (value) => {
        if (request.current === current) moveTo(value);
      },
      onComplete: () => {
        if (request.current !== current) return;
        if (element.isConnected) moveTo(destination(current, container));
        request.current = null;
        notify.current();
      },
    });
  }, [scrollContainerRef, stop]);

  useEffect(() => {
    const container = scrollContainerRef?.current ?? null;
    const interrupt = () => { stop(); notify.current(); };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      const current = request.current;
      if (!reduce.matches || !current) return;
      stop();
      if (current.element.isConnected) {
        const top = destination(current, container);
        if (container) container.scrollTo({ top, behavior: "instant" });
        else window.scrollTo({ top, behavior: "instant" });
      }
      notify.current();
    };
    const scrollTarget = container ?? window;
    const observeScroll = () => { if (!request.current) notify.current(); };
    scrollTarget.addEventListener("scroll", observeScroll, { passive: true });
    const events = ["wheel", "touchstart", "pointerdown", "hashchange", "resize"] as const;
    for (const event of events) window.addEventListener(event, interrupt, { passive: true });
    reduce.addEventListener("change", settle);
    return () => {
      stop(); scrollTarget.removeEventListener("scroll", observeScroll);
      for (const event of events) window.removeEventListener(event, interrupt);
      reduce.removeEventListener("change", settle);
    };
  }, [scrollContainerRef, stop]);

  return { scrollTo, stop, isScrolling };
}
