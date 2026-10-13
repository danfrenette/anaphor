import type { ReactNode } from "react";
import Link from "next/link";
import { PrivateQueries } from "@/features/tours/private-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private tour · Anaphor", robots: { index: false, follow: false } };
export default function TourLayout({ children }: { children: ReactNode }) {
  return <PrivateQueries><div className="mx-auto max-w-editorial px-page-inset py-12">
    <a href="#tour-content" className="sr-only focus:not-sr-only">Skip to tour</a>
    <Link href="/" className="mb-12 inline-block text-sm underline underline-offset-4">Anaphor reference manual</Link>
    <main id="tour-content" className="mx-auto max-w-reading">{children}</main>
  </div></PrivateQueries>;
}
