"use client";

import { Button, type ButtonProps } from "./button";
import { cn } from "../lib/utils";

type TagButtonProps = Omit<
  Extract<ButtonProps, { nativeButton: true }>,
  "nativeButton" | "type" | "render" | "shape" | "iconOnly"
>;

function TagButton({ className, ...props }: TagButtonProps) {
  return (
    <Button
      {...props}
      nativeButton={true}
      type="button"
      shape="round"
      iconOnly={false}
      data-slot="tag-button"
      className={(state) => cn(
        // Badge-like content bounds with Button's sizing and interaction states.
        "min-w-0 max-w-full py-1 align-middle whitespace-normal text-start [overflow-wrap:anywhere]",
        "[&>[data-slot=button-content]]:min-w-0 [&>[data-slot=button-content]]:max-w-full",
        "[&_[data-slot=button-label]]:min-w-0 [&_[data-slot=button-label]]:max-w-full",
        // Center the visible letterforms; compact leading keeps wrapped tags dense.
        "[&_[data-slot=button-label]]:top-0 [&_[data-slot=button-label]]:leading-tight [&_[data-slot=button-label]]:[text-box:trim-both_cap_alphabetic]",
        typeof className === "function" ? className(state) : className,
      )}
    />
  );
}

export { TagButton, type TagButtonProps };
