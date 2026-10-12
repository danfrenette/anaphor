import type { ReactNode } from "react";
import { DemoShell } from "../demo-shell";
import { PlaygroundHost } from "../playground-host";

export default function ManualLayout({ children }: { children: ReactNode }) {
  return <DemoShell><PlaygroundHost>{children}</PlaygroundHost></DemoShell>;
}
