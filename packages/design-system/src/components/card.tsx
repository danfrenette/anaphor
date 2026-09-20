import { Text } from "./text";
import { cn } from "../lib/utils";
import type { ComponentProps } from "react";

type CardProps = ComponentProps<"div"> & { variant: "default" | "showcase" };

const cardShadow = "shadow-card";

function Card({ className, variant, ...props }: CardProps) {
  return <div data-slot="card" data-variant={variant} className={cn(
    "w-full min-w-0 text-foreground",
    variant === "default"
      ? cn("rounded-card bg-muted [&>[data-card-section]+[data-card-section]]:pt-0", cardShadow)
      : "[&>[data-card-section]]:mt-4 [&>[data-card-section]]:p-0 [&>[data-slot=card-header]]:gap-1",
    className,
  )} {...props} />;
}

function CardPreview({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-preview"
      className={cn("rounded-[calc(var(--radius-card)+5px)] bg-background p-1", cardShadow, className)}
      {...props}
    >
      <div
        data-slot="card-preview-surface"
        className={cn(
          // Layout and surface
          "relative grid min-w-0 overflow-hidden rounded-card border bg-background",
          // Border treatment
          "border-[color-mix(in_oklch,var(--anaphor-input-border)_65%,var(--anaphor-background))]",
          // Sizing
          "[aspect-ratio:var(--card-preview-ratio,4/5)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" data-card-section="" className={cn("grid grid-cols-[minmax(0,1fr)] gap-2 p-6 has-[[data-slot=card-action]]:grid-cols-[minmax(0,1fr)_auto]", className)} {...props} />;
}

type CardTitleProps = ComponentProps<"h3"> & {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  variant: "heading" | "label";
};

function CardTitle({ as: Heading, variant, className, ...props }: CardTitleProps) {
  return <Text as={Heading} variant={variant === "label" ? "label" : "subheading"} data-slot="card-title" className={cn("col-start-1", variant === "label" && "text-muted-foreground", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <Text as="p" variant="description" data-slot="card-description" className={cn("col-start-1 max-w-none text-ui text-muted-foreground", className)} {...props} />;
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("col-start-2 row-start-1 row-span-2 self-start justify-self-end", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" data-card-section="" className={cn("p-6 text-body", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" data-card-section="" className={cn("flex flex-wrap items-center gap-3 p-6", className)} {...props} />;
}

export { Card, CardPreview, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, type CardProps, type CardTitleProps };
