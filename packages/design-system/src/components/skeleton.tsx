import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

type SkeletonVariant = "pulse" | "sheen" | "static";
type SkeletonProps = Omit<ComponentProps<"div">, "children"> & { variant: SkeletonVariant };
type SkeletonRegionProps = ComponentProps<"div"> & {
  isLoading: boolean;
  variant: SkeletonVariant;
  label: string;
};
type SkeletonTextProps = Omit<ComponentProps<"span">, "children"> & { children: string | number };

/** The small, decorative shape primitive follows shadcn/ui's Skeleton API. */
function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return <div {...props} data-slot="skeleton" data-variant={variant} aria-hidden="true" className={cn("anaphor-skeleton rounded-[4px]", className)} />;
}

/** Use representative content: normal CSS continues to own all geometry. */
function SkeletonRegion({ children, className, isLoading, variant, label, ...props }: SkeletonRegionProps) {
  return <div {...props} data-slot="skeleton-region" data-loading={isLoading} data-variant={variant} className={className}>
    <div aria-busy={isLoading}>
      <div inert={isLoading || undefined} aria-hidden={isLoading || undefined}>{children}</div>
    </div>
    <span role="status" className="sr-only">{isLoading ? label : ""}</span>
  </div>;
}

/** Inline fragments preserve actual wrapping, font metrics, and line lengths. */
function SkeletonText({ className, ...props }: SkeletonTextProps) {
  return <span {...props} data-slot="skeleton-text" className={cn("anaphor-skeleton-text rounded-[4px]", className)} />;
}

/** Wrap media or a compact control; its real content continues to reserve space. */
function SkeletonBox({ children, className, ...props }: ComponentProps<"div">) {
  return <div {...props} data-slot="skeleton-box" className={cn("anaphor-skeleton-box rounded-[4px]", className)}>
    <div data-slot="skeleton-box-content">{children}</div>
  </div>;
}

export { Skeleton, SkeletonRegion, SkeletonText, SkeletonBox, type SkeletonProps, type SkeletonRegionProps, type SkeletonTextProps, type SkeletonVariant };
