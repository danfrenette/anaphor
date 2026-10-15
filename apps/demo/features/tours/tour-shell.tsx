import type { ReactNode } from "react";
import Link from "next/link";

export function TourShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-editorial px-page-inset py-12">
    <a href="#tour-content" className="sr-only focus:not-sr-only">Skip to tour</a>
    <Link href="/" className="mb-12 inline-block text-ui underline underline-offset-4">Anaphor reference manual</Link>
    <main id="tour-content" className="min-w-0">{children}</main>
  </div>;
}
