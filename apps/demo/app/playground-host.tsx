"use client";

import { MorphSurface } from "@design-language/system";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Playground = { sectionId: string; title: string };
type ControlsHost = {
  register: (playground: Playground) => () => void;
  activeId: string | undefined;
  target: HTMLDivElement | null;
};
const ControlsContext = createContext<ControlsHost | null>(null);

export function PlaygroundHost({ children }: { children: ReactNode }) {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [active, setActive] = useState<Playground>();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const register = useCallback((playground: Playground) => {
    setPlaygrounds((current) => [...current, playground]);
    return () => setPlaygrounds((current) => current.filter((entry) => entry !== playground));
  }, []);

  useEffect(() => {
    let frame = 0;
    let dragging = false;
    const update = () => {
      if (dragging || panel.current?.querySelector('[role="region"]')?.contains(document.activeElement)) return;
      const line = window.innerHeight / 3;
      setActive(playgrounds.find(({ sectionId }) => {
        const bounds = document.getElementById(sectionId)?.getBoundingClientRect();
        return bounds && bounds.top <= line && bounds.bottom > line;
      }));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    // Portal events follow the playground's React tree, so observe the DOM here.
    const press = (event: PointerEvent) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) dragging = true;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && event.target instanceof Node && panel.current?.querySelector('[role="region"]')?.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    };
    const release = () => { dragging = false; schedule(); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    document.addEventListener("keydown", escape);
    document.addEventListener("focusout", schedule);
    document.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("focusout", schedule);
      document.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [playgrounds]);

  return (
    <ControlsContext value={{ register, activeId: active?.sectionId, target }}>
      {children}
      {active && (
        <div ref={panel} className="fixed right-4 bottom-4 z-30">
          <MorphSurface open={open} onOpenChange={setOpen} icon={<SlidersHorizontal />} title={`${active.title} controls`}>
            <div ref={setTarget} />
          </MorphSurface>
        </div>
      )}
    </ControlsContext>
  );
}

export function PlaygroundControls({ sectionId, title, onReset, children }: Playground & { onReset: () => void; children: ReactNode }) {
  const host = useContext(ControlsContext);
  if (!host) throw new Error("PlaygroundControls must be inside PlaygroundHost");
  const { register, activeId, target } = host;
  useEffect(() => register({ sectionId, title }), [register, sectionId, title]);

  if (activeId !== sectionId || !target) return null;
  return createPortal(<>
    {children}
    <button className="mt-4 min-h-11 rounded-md px-2 font-mono text-label uppercase" type="button" onClick={onReset}>Reset controls</button>
  </>, target);
}
