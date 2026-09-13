import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoShell } from "./demo-shell";

export const metadata: Metadata = {
  title: "Anaphor",
  description: "An executable reference manual for interface decisions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><DemoShell>{children}</DemoShell></body>
    </html>
  );
}
