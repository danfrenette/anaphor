"use client";

import { animate, scroll } from "motion";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

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

const destination = ({ element, offset }: ScrollRequest) => Math.max(0, Math.min(
  window.scrollY + element.getBoundingClientRect().top - offset,
  document.documentElement.scrollHeight - window.innerHeight,
));

/** Interruptible window scrolling. The caller owns destination selection and focus. */
export function useAnimatedScroll(onScroll: () => void) {
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
    const current: ScrollRequest = { element, offset };
    const top = destination(current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || duration <= 0 || top === window.scrollY) {
      window.scrollTo({ top, behavior: "instant" });
      return;
    }
    request.current = current;
    current.controls = animate(window.scrollY, top, {
      duration, ease,
      onUpdate: (value) => {
        if (request.current === current) window.scrollTo({ top: value, behavior: "instant" });
      },
      onComplete: () => {
        if (request.current !== current) return;
        if (element.isConnected) window.scrollTo({ top: destination(current), behavior: "instant" });
        request.current = null;
        notify.current();
      },
    });
  }, [stop]);

  useEffect(() => {
    const interrupt = () => { stop(); notify.current(); };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      const current = request.current;
      if (!reduce.matches || !current) return;
      stop();
      if (current.element.isConnected) window.scrollTo({ top: destination(current), behavior: "instant" });
      notify.current();
    };
    // The second parameter selects Motion's scroll-info observer, including resize updates.
    const unsubscribe = scroll((_progress, info) => { void info; if (!request.current) notify.current(); });
    const events = ["wheel", "touchstart", "pointerdown", "hashchange", "resize"] as const;
    for (const event of events) window.addEventListener(event, interrupt, { passive: true });
    reduce.addEventListener("change", settle);
    return () => {
      stop(); unsubscribe();
      for (const event of events) window.removeEventListener(event, interrupt);
      reduce.removeEventListener("change", settle);
    };
  }, [stop]);

  return { scrollTo, stop, isScrolling };
}
