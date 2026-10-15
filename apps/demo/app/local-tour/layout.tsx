import type { ReactNode } from "react";
import { TourShell } from "@/features/tours/tour-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Local tour · Anaphor", robots: { index: false, follow: false } };
export default function LocalTourLayout({ children }: { children: ReactNode }) {
  return <TourShell>{children}</TourShell>;
}
