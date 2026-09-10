"use client";

import { createContext, useContext, useState, useRef, useCallback, type ReactNode, type RefObject } from "react";

const initial = { lightness: 0.6217, chroma: 0.185, hue: 39.44 };
type Color = typeof initial;
const PaletteContext = createContext<{
  color: Color; setColor: (color: Color) => void;
  selected: number; setSelected: (index: number) => void;
  position: RefObject<number | null>; remember: (value: number) => void;
  reset: () => void;
} | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState(initial);
  const [selected, setSelected] = useState(3);
  const position = useRef<number | null>(null);
  const remember = useCallback((value: number) => { position.current = value; }, []);
  return <PaletteContext.Provider value={{ color, setColor, selected, setSelected, position, remember, reset: () => { setColor(initial); setSelected(3); } }}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  const value = useContext(PaletteContext);
  if (!value) throw new Error("Palette requires PaletteProvider");
  return value;
}

export function swatchColor(color: Color, index: number) {
  const lightness = Math.max(0.08, Math.min(0.97, color.lightness + (index - 3) * 0.1));
  const chroma = color.chroma * (1 - Math.abs(index - 3) / 4);
  return `oklch(${lightness.toFixed(4)} ${chroma.toFixed(4)} ${color.hue.toFixed(2)})`;
}
