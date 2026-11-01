import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

const labelStyles = "min-w-0 max-w-full px-2 py-1 font-sans text-small font-medium text-start [overflow-wrap:anywhere]";
const controlStyles = cn(
  // Compact desktop controls expand without overlapping on touch devices.
  labelStyles,
  "inline-flex min-h-7 min-w-7 items-center rounded-sm text-muted-foreground touch-manipulation pointer-coarse:min-h-11 pointer-coarse:min-w-11",
  "hover:bg-muted hover:text-foreground aria-current:text-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
);

type BreadcrumbProps = ComponentProps<"nav"> & { "aria-label": string };
type BreadcrumbLinkProps = ComponentProps<"a"> & { href: string };
type BreadcrumbButtonProps = Omit<ComponentProps<"button">, "type">;
type BreadcrumbCurrentProps = ComponentProps<"span"> & { "aria-current": "page" | "location" };

function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return <nav {...props} data-slot="breadcrumb" className={cn("min-w-0", className)} />;
}

function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return <ol {...props} data-slot="breadcrumb-list" className={cn("flex min-w-0 flex-wrap items-center gap-1", className)} />;
}

function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li {...props} data-slot="breadcrumb-item" className={cn("inline-flex min-w-0 max-w-full items-baseline gap-1", className)} />;
}

function BreadcrumbLink({ className, ...props }: BreadcrumbLinkProps) {
  return <a {...props} data-slot="breadcrumb-link" className={cn(controlStyles, className)} />;
}

function BreadcrumbButton({ className, ...props }: BreadcrumbButtonProps) {
  return <button {...props} type="button" data-slot="breadcrumb-button" className={cn(controlStyles, className)} />;
}

function BreadcrumbCurrent({ className, ...props }: BreadcrumbCurrentProps) {
  return <span {...props} data-slot="breadcrumb-current" className={cn(labelStyles, "text-foreground", className)} />;
}

function BreadcrumbSeparator({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} aria-hidden="true" data-slot="breadcrumb-separator" className={cn("shrink-0 select-none text-small text-border [&>svg]:size-3", className)} />;
}

export {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbButton,
  BreadcrumbCurrent, BreadcrumbSeparator,
  type BreadcrumbProps, type BreadcrumbLinkProps, type BreadcrumbButtonProps, type BreadcrumbCurrentProps,
};
