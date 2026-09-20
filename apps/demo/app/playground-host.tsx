"use client";

import { MorphSurface, Tabs, TabsList, TabsTab, TabsPanel, ThemeToggle } from "@anaphor/system";
import { Code, SlidersHorizontal } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { usePathname } from "next/navigation";
import { ComponentCode, codeTitle } from "./component-code";

type Playground = { sectionId: string; title: string };
type ControlsHost = {
  register: (playground: Playground) => () => void;
  activeId: string | undefined;
  target: HTMLDivElement | null;
};
const ControlsContext = createContext<ControlsHost | null>(null);

export function PlaygroundHost({ children }: { children: ReactNode }) {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [sectionId, setSectionId] = useState<string>();
  const [keyboard, setKeyboard] = useState(false);
  const [view, setView] = useState<"controls" | "code" | null>(null);
  const pathname = usePathname();
  const active = playgrounds.find(item => item.sectionId === sectionId);
  const open = view === "code" || (view === "controls" && Boolean(active));
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
      const section = [...document.querySelectorAll<HTMLElement>('[data-slot="section"]')].find(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.top <= line && bounds.bottom > line;
      });
      setSectionId(section?.id);
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
  }, [playgrounds, interacting, pathname]);

  return (
    <ControlsContext value={{ register, activeId: active?.sectionId, target }}>
      {children}
      <Tabs value={open ? view : null} onValueChange={value => {
        if (value === "controls" || value === "code") setView(value);
      }} onKeyDownCapture={() => setKeyboard(true)} onPointerDownCapture={() => setKeyboard(false)}>
        <MorphSurface onInteractionChange={setInteracting} open={open} onOpenChange={value => { if (!value) setView(null); }}
          focusOnOpen={false} animate={!keyboard}
          title={view === "code" ? codeTitle(sectionId) : `${active?.title ?? "Component"} controls`}
          viewKey={`${view}-${sectionId ?? "setup"}`} wide={view === "code"}
          bar={() => <div role="group" aria-label="Manual tools" className="flex items-center">
            <ThemeToggle className="flex-1 rounded-[18px]" title="Switch theme"><span className="sr-only">Theme</span></ThemeToggle>
            <TabsList aria-label="Component tools" className="w-2/3 rounded-[18px] bg-transparent p-0 [--radius-control:22px] [--tabs-item-size:44px] [&>[data-slot=tabs-indicator]]:p-0">
              <TabsTab value="controls" aria-label={active ? `Open ${active.title} controls` : "Component controls unavailable"}
                disabled={!active} aria-expanded={open && view === "controls"}
                onClick={() => { if (open && view === "controls") setView(null); }}>
                <SlidersHorizontal aria-hidden="true" /><span className="sr-only">Controls</span>
              </TabsTab>
              <TabsTab value="code" aria-expanded={view === "code"}
                onClick={() => { if (view === "code") setView(null); }}>
                <Code aria-hidden="true" /><span className="sr-only">Code</span>
              </TabsTab>
            </TabsList>
          </div>}>
          <TabsPanel value="controls" keepMounted className="data-[hidden]:hidden"><div ref={setTarget} /></TabsPanel>
          <TabsPanel value="code" keepMounted className="data-[hidden]:hidden"><ComponentCode sectionId={sectionId} /></TabsPanel>
        </MorphSurface>
      </Tabs>
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
