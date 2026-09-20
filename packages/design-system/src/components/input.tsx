"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

const sizeStyles = {
  sm: "h-8 px-2.5 pointer-coarse:h-11",
  md: "h-10 px-3.5 pointer-coarse:h-11",
  lg: "h-12 px-4",
} as const;

type InputProps = Omit<ComponentProps<typeof InputPrimitive>, "size"> & {
  size: keyof typeof sizeStyles | number;
};

function Input({ className, size, ...props }: InputProps) {
  return (
    <InputPrimitive
      data-slot="input"
      size={typeof size === "number" ? size : undefined}
      className={(state) => cn(
        // Layout and surface
        "w-full min-w-0 rounded-control border border-border bg-background",
        // Typography
        "font-sans text-base text-foreground placeholder:text-muted-foreground",
        // Focus and validation states
        "focus:border-ring focus:outline-2 focus:outline-offset-2 focus:outline-ring",
        "aria-invalid:border-danger aria-invalid:focus:outline-danger",
        // Disabled state
        "disabled:cursor-not-allowed disabled:bg-[var(--anaphor-input-disabled)] disabled:text-muted-foreground",
        // Motion and forced colors
        "motion-safe:transition-[border-color,background-color,outline-color] motion-safe:duration-150",
        "forced-colors:border-[ButtonText] forced-colors:disabled:text-[GrayText]",
        // Size
        sizeStyles[typeof size === "number" ? "md" : size],
        typeof className === "function" ? className(state) : className,
      )}
      {...props}
    />
  );
}

export { Input, type InputProps };
