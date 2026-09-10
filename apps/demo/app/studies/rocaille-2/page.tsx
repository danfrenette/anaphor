import type { Metadata } from "next";
import { RocailleStudy } from "../rocaille-study";
export const metadata: Metadata = { title: "Rocaille 2 — Anaphor studies" };
export default function RocaillePage() { return <RocailleStudy expanded />; }
