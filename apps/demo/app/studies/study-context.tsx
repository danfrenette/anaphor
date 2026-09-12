"use client";

import { createContext, useCallback, useContext, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";

type StudyContextValue = {
  dark: boolean;
  setDark: (value: boolean) => void;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  zoom: number;
  setZoom: (value: number) => void;
  revision: number;
  reset: () => void;
  clock: RefObject<number>;
  composition: RefObject<number | null>;
  setComposition: (value: number) => void;
  advance: (seconds: number) => void;
  background: {
    clock: RefObject<number>;
    composition: RefObject<number | null>;
    setComposition: (value: number) => void;
    advance: (seconds: number) => void;
  };
  reducedMotion: boolean;
};
const StudyContext = createContext<StudyContextValue | null>(null);
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotion = () => false;

// Keep the shader clock and controls across the preview/detail route transition.
export function StudyProvider({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const [dark, setDark] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [revision, setRevision] = useState(0);
  const clock = useRef(0);
  const composition = useRef<number | null>(null);
  const setComposition = useCallback((value: number) => { composition.current = value; }, []);
  const backgroundClock = useRef(0);
  const backgroundComposition = useRef<number | null>(null);
  const setBackgroundComposition = useCallback((value: number) => { backgroundComposition.current = value; }, []);
  const advanceBackground = useCallback((seconds: number) => { backgroundClock.current += seconds; }, []);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const advance = useCallback((seconds: number) => { clock.current += seconds; }, []);
  function reset() {
    clock.current = 0;
    setPlaying(false);
    setZoom(1);
    setRevision(value => value + 1);
  }
  return <StudyContext.Provider value={{ dark, setDark, playing, setPlaying, zoom, setZoom, revision, reset, clock, composition, setComposition, advance, reducedMotion, background: { clock: backgroundClock, composition: backgroundComposition, setComposition: setBackgroundComposition, advance: advanceBackground } }}>
    {bare ? children : <div className={dark ? "studies-root min-h-svh bg-background text-foreground dark" : "studies-root min-h-svh bg-background text-foreground"}>{children}</div>}
  </StudyContext.Provider>;
}
export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("Studies require StudyProvider");
  return context;
}
