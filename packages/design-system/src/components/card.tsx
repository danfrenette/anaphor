import { cn } from "../lib/utils";
import type { ComponentProps } from "react";

type CardProps = ComponentProps<"div"> & { variant?: "default" | "showcase" };

function Card({ className, variant = "default", ...props }: CardProps) {
  return <div data-slot="card" data-variant={variant} className={cn("w-full min-w-0 text-foreground", variant === "default" ? "rounded-card bg-muted [&>[data-card-section]+[data-card-section]]:pt-0" : "anaphor-card-showcase", className)} {...props} />;
}

function CardPreview({ className, children, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-preview" className={cn("anaphor-card-preview", className)} {...props}><div data-slot="card-preview-surface">{children}</div></div>;
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" data-card-section="" className={cn("grid grid-cols-[minmax(0,1fr)] gap-2 p-6 has-[[data-slot=card-action]]:grid-cols-[minmax(0,1fr)_auto]", className)} {...props} />;
}

type CardTitleProps = ComponentProps<"h3"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

function CardTitle({ as: Heading = "h3", className, ...props }: CardTitleProps) {
  return <Heading data-slot="card-title" className={cn("col-start-1 text-body font-medium", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("col-start-1 text-ui text-pretty text-muted-foreground", className)} {...props} />;
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
