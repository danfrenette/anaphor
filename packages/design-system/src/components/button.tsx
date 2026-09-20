"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Spinner } from "@phosphor-icons/react/dist/ssr";
import { cn } from "../lib/utils";
import type { ComponentProps, ReactNode } from "react";

const sizeStyles = {
  xs: cn(
    // Dimensions
    "[--button-size:1.75rem] [--button-icon-size:0.875rem] [--button-gap:0.375rem]",
    // Padding, typography, and coarse-pointer target
    "px-2 text-small pointer-coarse:[--button-size:2.75rem]",
  ),
  sm: cn(
    // Dimensions
    "[--button-size:2rem] [--button-icon-size:1rem] [--button-gap:0.5rem]",
    // Padding, typography, and coarse-pointer target
    "px-2.5 text-ui pointer-coarse:[--button-size:2.75rem]",
  ),
  md: cn(
    // Dimensions
    "[--button-size:2.5rem] [--button-icon-size:1rem] [--button-gap:0.5rem]",
    // Padding, typography, and coarse-pointer target
    "px-3.5 text-body pointer-coarse:[--button-size:2.75rem]",
  ),
  lg: cn(
    // Dimensions
    "[--button-size:3rem] [--button-icon-size:1rem] [--button-gap:0.5rem]",
    // Padding and typography
    "px-4 text-body",
  ),
} as const;

const baseStyles = cn(
  // Layout
  "relative inline-flex min-h-[var(--button-size)] min-w-max items-center justify-center rounded-[var(--anaphor-button-radius,var(--radius-control))] border border-transparent",
  // Typography and interaction
  "font-sans font-medium whitespace-nowrap select-none touch-manipulation",
  // Disabled state
  "data-disabled:cursor-not-allowed data-muted:border-transparent data-muted:bg-[var(--anaphor-input-disabled)] data-muted:text-[var(--anaphor-font-tertiary)]",
  // Motion and active state
  "motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-[var(--anaphor-button-duration,125ms)] motion-safe:ease-in-out",
  "motion-safe:active:not-data-disabled:scale-[var(--anaphor-button-press-scale,0.97)]",
  // Forced colors
  "forced-colors:border-[ButtonText] forced-colors:data-muted:border-[GrayText] forced-colors:data-muted:bg-[ButtonFace] forced-colors:data-muted:text-[GrayText]",
);

const variantStyles = {
  "accent-solid": cn(
    // Base, hover, and active states
    "bg-[var(--anaphor-brand)] text-primary-foreground",
    "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-brand)_94%,var(--anaphor-font-secondary))]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-brand)_88%,var(--anaphor-font-secondary))]",
  ),
  "accent-outline": cn(
    // Base, hover, and active states
    "border-current text-[color-mix(in_oklch,var(--anaphor-brand)_65%,var(--anaphor-font-secondary))]",
    "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-brand)_26%,var(--anaphor-background))]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-brand)_38%,var(--anaphor-background))]",
  ),
  "accent-ghost": cn(
    // Base, hover, and active states
    "text-[color-mix(in_oklch,var(--anaphor-brand)_65%,var(--anaphor-font-secondary))]",
    "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-brand)_26%,var(--anaphor-background))]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-brand)_38%,var(--anaphor-background))]",
  ),
  "neutral-solid": cn(
    // Base, hover, and active states
    "bg-[var(--anaphor-font-secondary)] text-[var(--anaphor-background)]",
    "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-font-secondary)_90%,var(--anaphor-font-tertiary))]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-font-secondary)_80%,var(--anaphor-font-tertiary))]",
  ),
  "neutral-outline": cn(
    // Base, hover, and active states
    "border-[var(--anaphor-input-border)] text-[var(--anaphor-font-secondary)]",
    "hover:not-data-disabled:bg-[var(--anaphor-input-disabled)]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-input-disabled)_85%,var(--anaphor-font-secondary))]",
  ),
  "neutral-ghost": cn(
    // Base, hover, and active states
    "text-[var(--anaphor-font-secondary)]",
    "hover:not-data-disabled:bg-[var(--anaphor-input-disabled)]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-input-disabled)_85%,var(--anaphor-font-secondary))]",
  ),
} as const;

const destructiveStyles = cn(
  // Base, hover, and active states
  "bg-danger text-background dark:text-foreground",
  "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-danger)_88%,black)]",
  "active:not-data-disabled:bg-[color-mix(in_oklch,var(--anaphor-danger)_88%,black)]",
);

type ButtonProps = Omit<ButtonPrimitive.Props, "nativeButton" | "type"> & {
  iconOnly: boolean;
  loading: boolean;
  shape: "square" | "round";
  size: keyof typeof sizeStyles;
  children?: ReactNode;
} & (
  | { variant: "destructive"; tone?: never }
  | { variant: "solid" | "outline" | "ghost"; tone: "accent" | "neutral" }
) & (
  | { nativeButton: true; type: "button" | "submit" | "reset" }
  | { nativeButton: false; render: NonNullable<ButtonPrimitive.Props["render"]>; type?: never }
);

function Button({
  children,
  className,
  disabled,
  focusableWhenDisabled,
  iconOnly,
  loading,
  nativeButton,
  shape,
  size,
  tone,
  type,
  variant,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={(state) =>
        cn(
          baseStyles,
          sizeStyles[size],
          iconOnly && "size-[var(--button-size)] min-w-0 shrink-0 px-0",
          shape === "round" && "rounded-full",
          variant === "destructive" ? destructiveStyles : variantStyles[`${tone}-${variant}`],
          typeof className === "function" ? className(state) : className,
        )
      }
      data-slot="button"
      data-disabled={disabled || loading || undefined}
      data-loading={loading || undefined}
      data-muted={disabled || undefined}
      data-icon-only={iconOnly || undefined}
      data-shape={shape}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
      nativeButton={nativeButton}
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          // Layout and visibility
          "pointer-events-none inline-flex w-[var(--button-icon-size)] shrink-0 items-center justify-center opacity-0",
          // Motion
          "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-[var(--anaphor-ease-out)]",
          iconOnly
            ? "absolute"
            : "-ms-[var(--button-icon-size)] me-0",
          loading && "opacity-100",
          loading && !iconOnly && "ms-0 me-[var(--button-gap)]",
        )}
      >
        <Spinner
          data-slot="button-loader"
          aria-hidden="true"
          weight="regular"
          className={cn(
            "size-[var(--button-icon-size)] shrink-0",
            loading && "motion-safe:animate-spin",
          )}
        />
      </span>
      <span
        data-slot="button-content"
        className={cn(
          // Layout
          "inline-flex items-center justify-center gap-[var(--button-gap)]",
          // Loading state
          iconOnly && "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
          iconOnly && loading && "opacity-0",
          // Icon treatment
          "[&>svg]:block [&>svg]:size-[var(--button-icon-size)] [&>svg]:shrink-0",
        )}
      >
        {children}
      </span>
    </ButtonPrimitive>
  );
}

function ButtonLabel({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      {...props}
      data-slot="button-label"
      className={cn("relative -top-[0.5px]", className)}
    />
  );
}

export { Button, ButtonLabel, type ButtonProps };
