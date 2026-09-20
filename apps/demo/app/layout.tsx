import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@anaphor/system";
import { PlaygroundHost } from "./playground-host";
import { DemoShell } from "./demo-shell";

export const metadata: Metadata = {
  title: "Anaphor",
  description: "An executable reference manual for interface decisions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><ThemeProvider><DemoShell><PlaygroundHost>{children}</PlaygroundHost></DemoShell></ThemeProvider></body>
    </html>
  );
}
