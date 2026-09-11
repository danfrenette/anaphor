"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

import type { AttachmentSide, Endpoint } from "./graph-context";

const origins = {
  left: ['0%', '50%'], right: ['100%', '50%'],
  top: ['50%', '0%'], bottom: ['50%', '100%'],
} satisfies Record<AttachmentSide, [string, string]>;

function useArrivalLights() {
  const glows = useRef(new Map<Element, Animation>());
  const clearGlows = useCallback(() => {
    glows.current.forEach(animation => animation.cancel());
    glows.current.clear();
  }, []);
  useLayoutEffect(() => clearGlows, [clearGlows]);
  const illuminate = useCallback((endpoint: Endpoint | undefined, nodeLight: HTMLSpanElement | undefined, reduce: boolean) => {
    if (endpoint && nodeLight) {
      const [x, y] = origins[endpoint.side];
      nodeLight.style.setProperty("--light-x", x);
      nodeLight.style.setProperty("--light-y", y);
    }
    const targets = [endpoint?.element, nodeLight];
    for (const target of targets) {
      if (!target) continue;
      glows.current.get(target)?.cancel();
      const animation = target.animate([
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.08 },
        { opacity: 0.65, offset: 0.3 },
        { opacity: 0, offset: 1 },
      ], { duration: reduce ? 200 : 1100, easing: 'linear' });
      glows.current.set(target, animation);
      animation.onfinish = () => {
        if (glows.current.get(target) === animation) glows.current.delete(target);
      };
    }
  }, []);
  return { clearGlows, illuminate };
}

export { useArrivalLights };
