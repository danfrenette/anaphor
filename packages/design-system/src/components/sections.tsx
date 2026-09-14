"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { useShortcut, type ShortcutBinding } from "../lib/shortcut";
import { useAnimatedScroll } from "../lib/use-animated-scroll";
import { cn } from "../lib/utils";

export type SectionBindings = {
  next: ShortcutBinding | null;
  previous: ShortcutBinding | null;
  first: ShortcutBinding | null;
  last: ShortcutBinding | null;
};

export type ContentSectionsProps = Omit<ComponentProps<"div">, "ref"> & {
  enabled?: boolean;
  defaultScope?: boolean;
  bindings?: Partial<SectionBindings>;
  /** Space above each destination, in pixels (for a sticky header). */
  scrollOffset?: number;
  onActiveChange?: (id: string | null) => void;
};

type ContentSectionsValue = {
  activeId: string | null;
  goTo: (id: string) => void;
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
  register: (id: string, element: HTMLElement) => () => void;
};
const ContentSectionsContext = createContext<ContentSectionsValue | null>(null);

export function useContentSections(): Omit<ContentSectionsValue, "register"> {
  const context = useContext(ContentSectionsContext);
  if (!context) throw new Error("useContentSections must be used within ContentSections.");
  return context;
}

export function ContentSections({ children, enabled = true, defaultScope = false, bindings, scrollOffset = 0, onActiveChange, style, ...props }: ContentSectionsProps) {
  const root = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, HTMLElement>());
  const active = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const notify = useRef(onActiveChange);
  useEffect(() => { notify.current = onActiveChange; }, [onActiveChange]);

  const ordered = useCallback(() => [...elements.current.entries()]
    .filter(([, element]) => element.isConnected && !element.closest('[hidden], [inert]') && element.getClientRects().length > 0)
    .sort(([, a], [, b]) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1), []);
  const select = useCallback((id: string | null) => {
    if (active.current === id) return;
    active.current = id;
    setActiveId(id);
    notify.current?.(id);
  }, []);
  const updateVisible = useCallback(() => {
    const entries = ordered();
    let current: string | null = entries[0]?.[0] ?? null;
    for (const [id, element] of entries) {
      if (element.getBoundingClientRect().top <= scrollOffset + 1) current = id;
    }
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) current = entries.at(-1)?.[0] ?? null;
    select(current);
  }, [ordered, scrollOffset, select]);
  const { scrollTo, stop, isScrolling } = useAnimatedScroll(updateVisible);
  const register = useCallback((id: string, element: HTMLElement) => {
    if (elements.current.has(id)) throw new Error(`Duplicate Section id: ${id}`);
    elements.current.set(id, element);
    return () => { elements.current.delete(id); };
  }, []);
  const goTo = useCallback((id: string) => {
    const element = ordered().find(([key]) => key === id)?.[1];
    if (!element) return;
    stop();
    select(id);
    element.focus({ preventScroll: true });
    const css = getComputedStyle(root.current!);
    const time = css.getPropertyValue("--anaphor-section-duration").trim();
    const duration = parseFloat(time) / (time.endsWith("ms") ? 1000 : 1);
    const curve = css.getPropertyValue("--anaphor-ease-in-out").match(/[\d.]+/g)?.map(Number);
    const [x1, y1, x2, y2] = curve ?? [];
    scrollTo(element, {
      offset: scrollOffset,
      duration: Number.isFinite(duration) && x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined ? duration : 0,
      ease: [x1 ?? 0, y1 ?? 0, x2 ?? 1, y2 ?? 1],
    });
  }, [ordered, scrollOffset, select, stop, scrollTo]);
  const move = useCallback((direction: number) => {
    const entries = ordered();
    const index = Math.max(0, entries.findIndex(([id]) => id === active.current));
    const destination = entries[Math.max(0, Math.min(entries.length - 1, index + direction))];
    if (destination) goTo(destination[0]);
  }, [goTo, ordered]);
  const next = useCallback(() => move(1), [move]);
  const previous = useCallback(() => move(-1), [move]);
  const first = useCallback(() => { const entry = ordered()[0]; if (entry) goTo(entry[0]); }, [goTo, ordered]);
  const last = useCallback(() => { const entry = ordered().at(-1); if (entry) goTo(entry[0]); }, [goTo, ordered]);
  const options = {
    enabled, scope: root, defaultScope,
    when: (event: KeyboardEvent) => {
      const group = event.target instanceof Element ? event.target.closest('[data-slot="sections"]') : null;
      return group === root.current || (!group && defaultScope);
    },
  };
  useShortcut(bindings?.next === undefined ? "J" : bindings.next, next, { ...options, repeat: true });
  useShortcut(bindings?.previous === undefined ? "K" : bindings.previous, previous, { ...options, repeat: true });
  useShortcut(bindings?.first === undefined ? ["G", "G"] : bindings.first, first, options);
  useShortcut(bindings?.last === undefined ? "Shift+G" : bindings.last, last, options);

  useEffect(() => {
    const reconcile = () => {
      if (isScrolling()) {
        if (ordered().some(([id]) => id === active.current)) return;
        stop();
      }
      updateVisible();
    };
    const resize = new ResizeObserver(reconcile);
    const observe = () => {
      resize.disconnect();
      for (const element of elements.current.values()) resize.observe(element);
      reconcile();
    };
    const mutations = new MutationObserver(observe);
    if (root.current) mutations.observe(root.current, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "inert"] });
    observe();
    return () => { resize.disconnect(); mutations.disconnect(); };
  }, [isScrolling, ordered, stop, updateVisible]);

  const sectionStyle: CSSProperties & { "--anaphor-section-offset": string } = { "--anaphor-section-offset": `${scrollOffset}px`, ...style };
  return <ContentSectionsContext value={{ activeId, goTo, next, previous, first, last, register }}>
    <div {...props} ref={root} data-slot="sections" style={sectionStyle}>{children}</div>
  </ContentSectionsContext>;
}

export type SectionProps = Omit<ComponentProps<"section">, "ref" | "tabIndex"> & { id: string; as?: "section" | "header" };
export function Section({ id, as: Tag = "section", className, ...props }: SectionProps) {
  const context = useContext(ContentSectionsContext);
  if (!context) throw new Error("Section must be used within ContentSections.");
  const { register, activeId } = context;
  const ref = useCallback((element: HTMLElement | null) => {
    if (element) return register(id, element);
  }, [id, register]);
  return <Tag {...props} id={id} ref={ref} tabIndex={-1} data-slot="section" data-active={activeId === id ? "" : undefined} className={cn("scroll-mt-[var(--anaphor-section-offset)]", className)} />;
}
