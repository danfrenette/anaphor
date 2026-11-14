import type { ComponentProps, ReactElement } from "react";
import { cn } from "../lib/utils";

function WorkspaceShell({ className, ...props }: ComponentProps<"div">): ReactElement {
  return (
    <div
      data-slot="workspace-shell"
      className={cn(
        "fixed inset-0 grid h-svh min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)_auto] overflow-clip bg-muted text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function WorkspaceTopBar({ className, ...props }: ComponentProps<"header">): ReactElement {
  return (
    <header
      data-slot="workspace-top-bar"
      className={cn("col-start-1 col-end-4 row-start-1 grid min-h-12 grid-cols-subgrid items-center", className)}
      {...props}
    />
  );
}

function WorkspaceCard({ className, ...props }: ComponentProps<"div">): ReactElement {
  return (
    <div
      data-slot="workspace-card"
      className={cn("col-start-2 row-start-2 m-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-clip rounded-card bg-background shadow-card max-md:m-0 max-md:rounded-none max-md:shadow-none", className)}
      {...props}
    />
  );
}

function WorkspaceCardHeader({ children, className, ...props }: ComponentProps<"div">): ReactElement {
  return <div data-slot="workspace-card-header" className={cn("relative flex min-h-14 shrink-0 items-center gap-3 border-border px-4 pb-px", className)} {...props}>
    {children}
    <span aria-hidden="true" data-slot="workspace-card-divider" className="pointer-events-none absolute inset-x-0 bottom-0 origin-left border-b border-inherit" />
  </div>;
}

function WorkspaceCardBody({ className, ...props }: ComponentProps<"div">): ReactElement {
  return <div data-slot="workspace-card-body" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)} {...props} />;
}

export { WorkspaceShell, WorkspaceTopBar, WorkspaceCard, WorkspaceCardHeader, WorkspaceCardBody };
