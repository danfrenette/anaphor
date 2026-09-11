import type { Metadata } from "next";
import { RocailleStudy } from "./rocaille-study";

export const metadata: Metadata = { title: "Studies — Anaphor" };

export default function StudiesPage() {
  return <RocailleStudy />;
}
