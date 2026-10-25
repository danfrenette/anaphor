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
    "[--button-padding:0.5rem] px-[var(--button-padding)] text-small pointer-coarse:[--button-size:2.75rem]",
  ),
  sm: cn(
    // Dimensions
    "[--button-size:2rem] [--button-icon-size:1rem] [--button-gap:0.5rem]",
    // Padding, typography, and coarse-pointer target
    "[--button-padding:0.625rem] px-[var(--button-padding)] text-ui pointer-coarse:[--button-size:2.75rem]",
  ),
  md: cn(
    // Dimensions
    "[--button-size:2.5rem] [--button-icon-size:1rem] [--button-gap:0.5rem]",
    // Padding, typography, and coarse-pointer target
    "[--button-padding:0.875rem] px-[var(--button-padding)] text-body pointer-coarse:[--button-size:2.75rem]",
  ),
  lg: cn(
    // Dimensions
    "[--button-size:3rem] [--button-icon-size:1rem] [--button-gap:0.5rem]",
    // Padding and typography
    "[--button-padding:1rem] px-[var(--button-padding)] text-body",
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
  "motion-safe:transition-[background-color,border-color,color,transform,scale] motion-safe:duration-[var(--anaphor-button-duration,125ms)] motion-safe:ease-in-out",
  "motion-safe:active:not-data-disabled:scale-[var(--anaphor-button-press-scale,0.97)]",
  // Forced colors
  "forced-colors:border-[ButtonText] forced-colors:data-muted:border-[GrayText] forced-colors:data-muted:bg-[ButtonFace] forced-colors:data-muted:text-[GrayText]",
);

const toneStyles = {
  accent: cn(
    "[--button-tone:var(--anaphor-brand)] [--button-ink:color-mix(in_oklch,var(--anaphor-brand)_65%,var(--anaphor-font-secondary))]",
    "[--button-solid-ink:light-dark(var(--anaphor-background),var(--anaphor-font-secondary))] [--button-hover-target:var(--anaphor-font-secondary)]",
    "[--button-solid-hover:94%] [--button-solid-active:88%]",
    "[--button-outline-border:var(--button-ink)] [--button-subtle-hover:color-mix(in_oklch,var(--button-tone)_26%,var(--anaphor-background))] [--button-subtle-active:color-mix(in_oklch,var(--button-tone)_38%,var(--anaphor-background))]",
  ),
  neutral: cn(
    "[--button-tone:var(--anaphor-font-secondary)] [--button-ink:var(--anaphor-font-secondary)]",
    "[--button-solid-ink:var(--anaphor-background)] [--button-hover-target:var(--anaphor-font-tertiary)]",
    "[--button-solid-hover:90%] [--button-solid-active:80%]",
    "[--button-outline-border:var(--anaphor-input-border)] [--button-subtle-hover:var(--anaphor-input-disabled)] [--button-subtle-active:color-mix(in_oklch,var(--anaphor-input-disabled)_85%,var(--anaphor-font-secondary))]",
  ),
  danger: cn(
    "[--button-tone:var(--anaphor-danger)] [--button-ink:var(--anaphor-danger-text)]",
    "[--button-solid-ink:light-dark(var(--anaphor-background),var(--anaphor-font-secondary))] [--button-hover-target:black]",
    "[--button-solid-hover:88%] [--button-solid-active:88%]",
    "[--button-outline-border:var(--button-ink)] [--button-subtle-hover:color-mix(in_oklch,var(--button-tone)_26%,var(--anaphor-background))] [--button-subtle-active:color-mix(in_oklch,var(--button-tone)_38%,var(--anaphor-background))]",
  ),
} as const;

const variantStyles = {
  solid: cn(
    "bg-[var(--button-tone)] text-[var(--button-solid-ink)]",
    "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--button-tone)_var(--button-solid-hover),var(--button-hover-target))]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--button-tone)_var(--button-solid-active),var(--button-hover-target))]",
  ),
  outline: cn(
    "border-[var(--button-outline-border)] text-[var(--button-ink)]",
    "hover:not-data-disabled:bg-[var(--button-subtle-hover)]",
    "active:not-data-disabled:bg-[var(--button-subtle-active)]",
  ),
  ghost: cn(
    "text-[var(--button-ink)]",
    "hover:not-data-disabled:bg-[var(--button-subtle-hover)]",
    "active:not-data-disabled:bg-[var(--button-subtle-active)]",
  ),
  soft: cn(
    "bg-[color-mix(in_oklch,var(--button-tone)_16%,var(--anaphor-background))] text-[var(--button-ink)]",
    "hover:not-data-disabled:bg-[color-mix(in_oklch,var(--button-tone)_23%,var(--anaphor-background))]",
    "active:not-data-disabled:bg-[color-mix(in_oklch,var(--button-tone)_29%,var(--anaphor-background))]",
  ),
} as const;

type ButtonProps = Omit<ButtonPrimitive.Props, "nativeButton" | "type"> & {
  iconOnly: boolean;
  loading: boolean;
  shape: "square" | "round";
  size: keyof typeof sizeStyles;
  children?: ReactNode;
  variant: keyof typeof variantStyles;
  tone: keyof typeof toneStyles;
} & (
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
          // SVG siblings at the label's edges get optical padding; loaders stay separate.
          !iconOnly && cn(
            "ps-[var(--button-padding-start,var(--button-padding))] pe-[var(--button-padding-end,var(--button-padding))]",
            "[&:has(>[data-slot=button-content]>svg:first-child)]:[--button-padding-start:calc(var(--button-padding)-2px)]",
            "[&:has(>[data-slot=button-content]>svg:last-child)]:[--button-padding-end:calc(var(--button-padding)-2px)]",
            "[&:has(>[data-slot=button-content]>svg+span[data-slot=hold-button-overlay]:last-child)]:[--button-padding-end:calc(var(--button-padding)-2px)]",
          ),
          iconOnly && "size-[var(--button-size)] min-w-0 shrink-0 px-0",
          shape === "round" && "rounded-full",
          toneStyles[tone],
          variantStyles[variant],
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
        data-slot="button-loader-container"
        className={cn(
          // Layout and visibility
          "pointer-events-none inline-flex w-[var(--button-icon-size)] shrink-0 items-center justify-center opacity-0",
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
