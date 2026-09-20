import type { ComponentProps, ReactElement } from "react";
import { cn } from "../lib/utils";

function Kbd({ className, ...props }: ComponentProps<"kbd">): ReactElement {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        // Layout and surface
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 whitespace-nowrap rounded-sm bg-background px-1",
        // Typography
        "font-mono text-label leading-none font-normal text-muted-foreground",
        // Elevation
        "shadow-[inset_0_0_0_1px_var(--anaphor-input-border),0_1px_0_color-mix(in_oklch,var(--anaphor-input-border)_70%,transparent)]",
        // Icon treatment
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: ComponentProps<"kbd">): ReactElement {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1 whitespace-nowrap", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
