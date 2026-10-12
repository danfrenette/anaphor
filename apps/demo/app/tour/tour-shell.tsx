import { Text, ThemeToggle, WorkspaceCard, WorkspaceShell, WorkspaceTopBar } from "@anaphor/system";
import type { ReactNode } from "react";

export function TourShell({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <WorkspaceShell>
      <a href="#content" className="fixed start-3 top-3 z-[var(--anaphor-z-a11y)] -translate-y-[200%] bg-foreground px-3 py-2 text-ui text-background focus-visible:translate-y-0">Skip to content</a>
      <WorkspaceTopBar>
        <div className="col-start-2 flex min-w-0 items-center justify-between gap-3 px-2">
          {label ? <Text as="p" variant="label">{label}</Text> : <span />}
          <ThemeToggle />
        </div>
      </WorkspaceTopBar>
      <WorkspaceCard>{children}</WorkspaceCard>
    </WorkspaceShell>
  );
}
