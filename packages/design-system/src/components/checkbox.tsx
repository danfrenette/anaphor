"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react";
import { cn } from "#lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={(state) => cn(
        "relative inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 border-muted-foreground align-middle outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring data-invalid:border-danger-foreground data-invalid:focus-visible:outline-danger-foreground data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-[var(--dl-input-disabled)] motion-safe:transition-colors motion-safe:duration-150 forced-colors:border-[ButtonText]",
        typeof className === "function" ? className(state) : className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        data-slot="checkbox-indicator"
        className="absolute -inset-0.5 flex items-center justify-center rounded-[6px] bg-primary text-[var(--dl-checkbox-mark)] data-disabled:bg-[var(--dl-input-disabled)] data-disabled:text-muted-foreground data-invalid:inset-ring-2 data-invalid:inset-ring-danger-foreground data-unchecked:opacity-0 motion-safe:transition-opacity motion-safe:duration-150 motion-safe:data-checked:animate-[dl-checkbox-enter_150ms_cubic-bezier(0.4,0,0.2,1)] motion-safe:data-indeterminate:animate-[dl-checkbox-enter_150ms_cubic-bezier(0.4,0,0.2,1)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? <MinusIcon size={16} weight="bold" aria-hidden="true" /> : <CheckIcon size={16} weight="bold" aria-hidden="true" />}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, CheckboxPrimitive };
