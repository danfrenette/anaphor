"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "../lib/utils";

function BottomBar({ className, ...props }: ComponentProps<"footer">): ReactElement {
  return (
    <footer
      data-slot="bottom-bar"
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-4 border-t border-border bg-muted px-2 text-small text-muted-foreground",
        "pointer-coarse:min-h-12 [padding-inline-start:max(0.5rem,env(safe-area-inset-left))] [padding-inline-end:max(0.5rem,env(safe-area-inset-right))] [padding-bottom:env(safe-area-inset-bottom)]",
        className,
      )}
      {...props}
    />
  );
}

function BottomBarGroup({ className, ...props }: ComponentProps<"div">): ReactElement {
  return <div data-slot="bottom-bar-group" className={cn("flex min-w-0 items-center gap-1", className)} {...props} />;
}

function BottomBarStatus({ className, ...props }: ComponentProps<"span">): ReactElement {
  return <span data-slot="bottom-bar-status" className={cn("min-w-0 truncate px-2 text-small tabular-nums", className)} {...props} />;
}

type BottomBarActionProps = useRender.ComponentProps<"button">;

function BottomBarAction({ className, render, ...props }: BottomBarActionProps): ReactElement {
  return useRender({
    defaultTagName: "button",
    render,
    props: {
      type: render ? undefined : "button",
      ...props,
      "data-slot": "bottom-bar-action",
      className: cn(
        "inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-sm px-2 text-small font-medium text-muted-foreground no-underline",
        "whitespace-nowrap select-none touch-manipulation hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        "motion-safe:pointer-fine:active:scale-[0.96] motion-safe:transition-[color,background-color,transform] motion-safe:duration-150 motion-safe:ease-[var(--anaphor-ease-out)]",
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11 [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      ),
    },
  });
}

export { BottomBar, BottomBarAction, BottomBarGroup, BottomBarStatus, type BottomBarActionProps };
