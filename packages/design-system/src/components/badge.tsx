import { cn } from "#lib/utils";
import type { ComponentProps } from "react";

const sizes = {
  sm: "min-h-5 px-1.5 text-small [&>svg]:size-3",
  md: "min-h-6 px-2 text-small [&>svg]:size-3",
  lg: "min-h-7 px-2.5 text-ui [&>svg]:size-3.5",
} as const;

const variants = {
  solid: "bg-foreground text-background",
  soft: "bg-muted text-foreground",
  outline: "border-border bg-background text-foreground",
} as const;

type BadgeProps = ComponentProps<"span"> & {
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  shape?: "square" | "round";
};

function Badge({ className, size = "md", variant = "soft", shape = "square", ...props }: BadgeProps) {
  return <span data-slot="badge" data-size={size} data-variant={variant} data-shape={shape} className={cn(
    "inline-flex max-w-full items-center justify-center gap-1 rounded-md border border-transparent align-middle font-medium [overflow-wrap:anywhere] [&>svg]:shrink-0",
    sizes[size], variants[variant], shape === "round" && "rounded-full", className,
  )} {...props} />;
}

export { Badge, type BadgeProps };
