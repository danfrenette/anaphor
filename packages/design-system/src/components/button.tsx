"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "#lib/utils";
import type { ComponentProps, ReactNode } from "react";

const sizeStyles = {
  xs: "[--button-size:1.75rem] [--button-icon-size:0.875rem] gap-1.5 px-2 text-small pointer-coarse:[--button-size:2.75rem]",
  sm: "[--button-size:2rem] [--button-icon-size:1rem] gap-2 px-2.5 text-ui pointer-coarse:[--button-size:2.75rem]",
  md: "[--button-size:2.5rem] [--button-icon-size:1rem] gap-2 px-3.5 text-body pointer-coarse:[--button-size:2.75rem]",
  lg: "[--button-size:3rem] [--button-icon-size:1rem] gap-2 px-4 text-body",
} as const;

const baseStyles =
  "relative inline-flex min-h-[var(--button-size)] min-w-max items-center justify-center rounded-[var(--dl-button-radius,var(--radius-control))] border border-transparent font-sans font-medium whitespace-nowrap select-none touch-manipulation data-disabled:cursor-not-allowed data-disabled:border-transparent data-disabled:bg-[var(--dl-input-disabled)] data-disabled:text-[var(--dl-font-tertiary)] motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-[var(--dl-button-duration,125ms)] motion-safe:ease-in-out motion-safe:active:not-data-disabled:scale-[var(--dl-button-press-scale,0.97)] forced-colors:data-disabled:border-[GrayText] forced-colors:data-disabled:bg-[ButtonFace] forced-colors:data-disabled:text-[GrayText] forced-colors:border-[ButtonText]";

const variantStyles = {
  "accent-solid": "bg-[var(--dl-brand)] text-primary-foreground hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_94%,var(--dl-font-secondary))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_88%,var(--dl-font-secondary))]",
  "accent-outline": "border-current text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))]",
  "accent-ghost": "text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))]",
  "neutral-solid": "bg-[var(--dl-font-secondary)] text-[var(--dl-background)] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-font-secondary)_90%,var(--dl-font-tertiary))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-font-secondary)_80%,var(--dl-font-tertiary))]",
  "neutral-outline": "border-[var(--dl-input-border)] text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)]",
  "neutral-ghost": "text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)]",
} as const;

const destructiveStyles =
  "bg-danger text-background dark:text-foreground hover:not-data-disabled:bg-[var(--dl-danger-text)] active:not-data-disabled:bg-[var(--dl-danger-text)]";

type ButtonProps = ButtonPrimitive.Props & {
  iconOnly?: boolean;
  loading?: boolean;
  shape?: "square" | "round";
  size?: keyof typeof sizeStyles;
  tone?: "accent" | "neutral";
  variant?: "solid" | "destructive" | "outline" | "ghost";
  children?: ReactNode;
};

function Button({
  children,
  className,
  disabled,
  focusableWhenDisabled,
  iconOnly = false,
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
          iconOnly && "size-[var(--button-size)] min-w-0 shrink-0 px-0",
          shape === "round" && "rounded-full",
          variant === "destructive" ? destructiveStyles : variantStyles[`${tone}-${variant}`],
          typeof className === "function" ? className(state) : className,
        )
      }
      data-slot="button"
      data-disabled={disabled || loading || undefined}
      data-loading={loading || undefined}
      data-icon-only={iconOnly || undefined}
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
            "pointer-events-none size-[var(--button-icon-size)] shrink-0 rounded-full border-[1.5px] border-current border-r-transparent motion-safe:animate-spin",
            iconOnly && "absolute",
          )}
          aria-hidden="true"
        />
      ) : null}
      <span
        data-slot="button-content"
        className={cn(
          "inline-flex items-center justify-center gap-[inherit] [&>svg]:block [&>svg]:size-[var(--button-icon-size)] [&>svg]:shrink-0",
          iconOnly && loading && "invisible",
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
