"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Spinner } from "@phosphor-icons/react/dist/ssr";
import { cn } from "#lib/utils";
import type { ComponentProps, ReactNode } from "react";

const sizeStyles = {
  xs: "[--button-size:1.75rem] [--button-icon-size:0.875rem] [--button-gap:0.375rem] px-2 text-small pointer-coarse:[--button-size:2.75rem]",
  sm: "[--button-size:2rem] [--button-icon-size:1rem] [--button-gap:0.5rem] px-2.5 text-ui pointer-coarse:[--button-size:2.75rem]",
  md: "[--button-size:2.5rem] [--button-icon-size:1rem] [--button-gap:0.5rem] px-3.5 text-body pointer-coarse:[--button-size:2.75rem]",
  lg: "[--button-size:3rem] [--button-icon-size:1rem] [--button-gap:0.5rem] px-4 text-body",
} as const;

const baseStyles =
  "relative inline-flex min-h-[var(--button-size)] min-w-max items-center justify-center rounded-[var(--dl-button-radius,var(--radius-control))] border border-transparent font-sans font-medium whitespace-nowrap select-none touch-manipulation data-disabled:cursor-not-allowed data-muted:border-transparent data-muted:bg-[var(--dl-input-disabled)] data-muted:text-[var(--dl-font-tertiary)] motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-[var(--dl-button-duration,125ms)] motion-safe:ease-in-out motion-safe:active:not-data-disabled:scale-[var(--dl-button-press-scale,0.97)] forced-colors:data-muted:border-[GrayText] forced-colors:data-muted:bg-[ButtonFace] forced-colors:data-muted:text-[GrayText] forced-colors:border-[ButtonText]";

const variantStyles = {
  "accent-solid": "bg-[var(--dl-brand)] text-primary-foreground hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_94%,var(--dl-font-secondary))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_88%,var(--dl-font-secondary))]",
  "accent-outline": "border-current text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_38%,var(--dl-background))]",
  "accent-ghost": "text-[color-mix(in_oklch,var(--dl-brand)_65%,var(--dl-font-secondary))] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_26%,var(--dl-background))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-brand)_38%,var(--dl-background))]",
  "neutral-solid": "bg-[var(--dl-font-secondary)] text-[var(--dl-background)] hover:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-font-secondary)_90%,var(--dl-font-tertiary))] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-font-secondary)_80%,var(--dl-font-tertiary))]",
  "neutral-outline": "border-[var(--dl-input-border)] text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-input-disabled)_85%,var(--dl-font-secondary))]",
  "neutral-ghost": "text-[var(--dl-font-secondary)] hover:not-data-disabled:bg-[var(--dl-input-disabled)] active:not-data-disabled:bg-[color-mix(in_oklch,var(--dl-input-disabled)_85%,var(--dl-font-secondary))]",
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
  nativeButton = true,
  shape = "square",
  size = "md",
  tone = "accent",
  type = nativeButton ? "button" : undefined,
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
          "pointer-events-none inline-flex shrink-0 items-center justify-center w-[var(--button-icon-size)] opacity-0 motion-safe:transition-[margin,opacity] motion-safe:duration-200 motion-safe:ease-out",
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
          "inline-flex items-center justify-center gap-[var(--button-gap)] [&>svg]:block [&>svg]:size-[var(--button-icon-size)] [&>svg]:shrink-0",
          iconOnly && "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
          iconOnly && loading && "opacity-0",
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
