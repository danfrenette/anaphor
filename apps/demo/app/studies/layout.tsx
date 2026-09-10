import type { ReactNode } from "react";
import { StudyProvider } from "./study-context";
import "./studies.css";
import { PaletteProvider } from "./palette-context";

export default function StudiesLayout({ children }: { children: ReactNode }) {
  return <StudyProvider><PaletteProvider>{children}</PaletteProvider></StudyProvider>;
}
