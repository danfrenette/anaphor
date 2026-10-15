import type { ReactNode } from "react";
import { TourShell } from "@/features/tours/tour-shell";
import { PrivateQueries } from "@/features/tours/private-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private tour · Anaphor", robots: { index: false, follow: false } };
export default function TourLayout({ children }: { children: ReactNode }) {
  return <PrivateQueries><TourShell>{children}</TourShell></PrivateQueries>;
}
