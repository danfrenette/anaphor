import { cn } from "#lib/utils";
import type { ComponentProps } from "react";

function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("w-full min-w-0 rounded-card bg-muted text-foreground [&>[data-card-section]+[data-card-section]]:pt-0", className)} {...props} />;
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
  return <p data-slot="card-description" className={cn("col-start-1 text-ui text-muted-foreground", className)} {...props} />;
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

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, type CardTitleProps };
