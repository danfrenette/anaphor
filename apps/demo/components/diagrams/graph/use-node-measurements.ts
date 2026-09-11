"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Box } from "./graph-context";

function useNodeMeasurements() {
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const [boxes, setBoxes] = useState(new Map<string, Box>());
  const observer = useRef<ResizeObserver | null>(null);
  const measure = useCallback(() => {
    if (!root.current) return;
    const origin = root.current.getBoundingClientRect();
    const next = new Map<string, Box>();
    nodes.current.forEach((element, id) => {
      const box = element.getBoundingClientRect();
      next.set(id, { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height });
    });
    setBoxes(next);
  }, []);
  const register = useCallback((id: string, element: HTMLElement | null) => {
    const previous = nodes.current.get(id);
    if (previous) observer.current?.unobserve(previous);
    if (element) {
      nodes.current.set(id, element);
      observer.current?.observe(element);
    } else {
      nodes.current.delete(id);
    }
    measure();
  }, [measure]);
  useLayoutEffect(() => {
    const resize = new ResizeObserver(measure);
    observer.current = resize;
    if (root.current) resize.observe(root.current);
    nodes.current.forEach(node => resize.observe(node));
    measure();
    window.addEventListener('resize', measure);
    const container = root.current;
    container?.addEventListener('scroll', measure, true);
    return () => {
      resize.disconnect();
      observer.current = null;
      window.removeEventListener('resize', measure);
      container?.removeEventListener('scroll', measure, true);
    };
  }, [measure]);
  return { root, boxes, register };
}

export { useNodeMeasurements };
