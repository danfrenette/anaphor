"use client";

import { MorphSurface } from "@anaphor/system";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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
  const [interacting, setInteracting] = useState(false);
  const register = useCallback((playground: Playground) => {
    setPlaygrounds((current) => [...current, playground]);
    return () => setPlaygrounds((current) => current.filter((entry) => entry !== playground));
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (interacting) return;
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
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [playgrounds, interacting]);

  return (
    <ControlsContext value={{ register, activeId: active?.sectionId, target }}>
      {children}
      {active && (
        <div className="contents md:fixed md:right-4 md:bottom-4 md:z-[var(--anaphor-z-floating)] md:block">
          <MorphSurface onInteractionChange={setInteracting} open={open} onOpenChange={setOpen} icon={<SlidersHorizontal />} title={`${active.title} controls`}>
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
    <button className="mt-4 min-h-11 rounded-md px-2 text-label uppercase" type="button" onClick={onReset}>Reset controls</button>
  </>, target);
}
