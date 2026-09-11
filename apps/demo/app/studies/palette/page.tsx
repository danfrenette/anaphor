import type { Metadata } from "next";
import { PaletteStudy } from "../palette-study";

export const metadata: Metadata = { title: "A palette, unfolded — Anaphor studies" };
export default function PalettePage() { return <PaletteStudy expanded />; }
