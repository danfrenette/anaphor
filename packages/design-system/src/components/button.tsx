"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "#lib/utils";
import type { ComponentProps, ReactNode } from "react";

const sizeStyles = {
  xs: "min-h-7 gap-1.5 px-2 text-small pointer-coarse:min-h-11",
  sm: "min-h-8 gap-2 px-2.5 text-ui pointer-coarse:min-h-11",
  md: "min-h-10 gap-2 px-3.5 text-body pointer-coarse:min-h-11",
  lg: "min-h-12 gap-2 px-4 text-body",
} as const;

const contentStyles = {
  xs: "gap-1.5 [&>svg]:size-3.5",
  sm: "gap-2 [&>svg]:size-4",
  md: "gap-2 [&>svg]:size-4",
  lg: "gap-2 [&>svg]:size-4",
} as const;

const loaderStyles = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-4",
  lg: "size-4",
} as const;

const baseStyles =
  "relative inline-flex min-w-max items-center justify-center rounded-[var(--dl-button-radius,var(--radius-control))] border border-transparent font-sans font-medium whitespace-nowrap select-none touch-manipulation data-disabled:cursor-not-allowed data-disabled:border-transparent data-disabled:bg-[var(--dl-input-disabled)] data-disabled:text-[var(--dl-font-tertiary)] motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-[var(--dl-button-duration,125ms)] motion-safe:ease-in-out motion-safe:active:not-data-disabled:scale-[var(--dl-button-press-scale,0.97)] forced-colors:data-disabled:border-[GrayText] forced-colors:data-disabled:bg-[ButtonFace] forced-colors:data-disabled:text-[GrayText] forced-colors:border-[ButtonText]";

const variantStyles = {
  "accent-solid": "bg-[var(--dl-brand)] text-primary-foreground hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_94%,var(--dl-font-secondary))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_88%,var(--dl-font-secondary))]",
  "accent-soft": "bg-[color-mix(in_oklch,var(--dl-brand)_18%,var(--dl-background))] text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))]",
  "accent-outline": "border-current text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))]",
  "accent-ghost": "text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))]",
  "neutral-solid": "bg-[var(--dl-font-secondary)] text-[var(--dl-background)] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-font-secondary)_90%,var(--dl-font-tertiary))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-font-secondary)_80%,var(--dl-font-tertiary))]",
  "neutral-soft": "bg-[var(--dl-foreground)] text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)]",
  "neutral-outline": "border-[var(--dl-input-border)] text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)]",
  "neutral-ghost": "text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)]",
} as const;

type ButtonProps = ButtonPrimitive.Props & {
  loading?: boolean;
  shape?: "square" | "round";
  size?: "xs" | "sm" | "md" | "lg";
  tone?: "accent" | "neutral";
  variant?: "solid" | "soft" | "outline" | "ghost";
  children?: ReactNode;
};

function Button({
  children,
  className,
  disabled,
  focusableWhenDisabled,
  loading = false,
  shape = "square",
  size = "md",
  tone = "accent",
  type = "button",
  variant = "solid",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={(state) =>
        cn(
          baseStyles,
          sizeStyles[size],
          shape === "round" && "rounded-full",
          variantStyles[`${tone}-${variant}`],
          typeof className === "function" ? className(state) : className,
        )
      }
      data-slot="button"
      data-disabled={disabled || loading || undefined}
      data-loading={loading || undefined}
      data-shape={shape}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          data-slot="button-loader"
          className={cn(
            "pointer-events-none shrink-0 rounded-full border-[1.5px] border-current border-r-transparent motion-safe:animate-spin",
            loaderStyles[size],
          )}
          aria-hidden="true"
        />
      ) : null}
      <span
        data-slot="button-content"
        className={cn(
          "inline-flex items-center justify-center [&>svg]:block [&>svg]:shrink-0",
          contentStyles[size],
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
      className={cn("relative -top-[1px]", className)}
    />
  );
}

export { Button, ButtonLabel, type ButtonProps };
