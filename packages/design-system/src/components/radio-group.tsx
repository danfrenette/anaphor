"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { useRender } from "@base-ui/react/use-render";
import { type ComponentProps, useLayoutEffect, useState } from "react";
import { cn } from "../lib/utils";

type RadioGroupProps<Value = unknown> = RadioGroupPrimitive.Props<Value>;
type RadioProps<Value = unknown> = RadioPrimitive.Root.Props<Value>;

function RadioGroupElement({ elementProps, state, render }: {
  elementProps: ComponentProps<"div">;
  state: RadioGroupPrimitive.State;
  render: RadioGroupProps["render"];
}) {
  const [group, setGroup] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!group) return;
    // Base UI 1.9 can leave its roving tab stop on a disabled selected radio.
    // Repair only sequential focus through public roles/ARIA, keeping selection
    // and arrow navigation with Base UI. Observe dynamic disabled choices too.
    function repairEntryPoint() {
      if (!group) return;
      const enabled = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]')).filter(radio => radio.closest('[role="radiogroup"]') === group && radio.getAttribute("aria-disabled") !== "true" && !radio.hasAttribute("disabled"));
      const tabStops = enabled.filter(radio => radio.tabIndex === 0);
      const entry = enabled.find(radio => radio === document.activeElement)
        ?? enabled.find(radio => radio.getAttribute("aria-checked") === "true")
        ?? tabStops[0] ?? enabled[0];
      if (tabStops.length === 1) return;
      for (const radio of enabled) {
        const next = radio === entry ? 0 : -1;
        if (radio.tabIndex !== next) radio.tabIndex = next;
      }
    }
    repairEntryPoint();
    const observer = new MutationObserver(repairEntryPoint);
    observer.observe(group, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-disabled", "aria-checked", "disabled", "tabindex"] });
    return () => observer.disconnect();
  }, [group]);
  return useRender({ defaultTagName: "div", ref: setGroup, props: { ...elementProps }, render: typeof render === "function" ? props => render(props, state) : render });
}

function RadioGroup<Value>({ className, render, ...props }: RadioGroupProps<Value>) {
  return <RadioGroupPrimitive data-slot="radio-group" className={(state) => cn(
    "grid min-w-0 gap-2",
    typeof className === "function" ? className(state) : className,
  )} {...props} render={(elementProps, state) => <RadioGroupElement elementProps={elementProps} state={state} render={render} />} />;
}

function RadioElement({ elementProps, state, render }: {
  elementProps: ComponentProps<"span">;
  state: RadioPrimitive.Root.State;
  render: RadioProps["render"];
}) {
  // Base UI's composite can make a disabled selected item tabbable. Preserve
  // consumer rendering while removing that disabled item from sequential focus.
  return useRender({
    defaultTagName: "span",
    render: typeof render === "function" ? props => render(props, state) : render,
    props: { ...elementProps, tabIndex: state.disabled ? -1 : elementProps.tabIndex },
  });
}

function Radio<Value>({ className, render, ...props }: RadioProps<Value>) {
  return <RadioPrimitive.Root data-slot="radio" className={(state) => cn(
    // Layout
    "relative inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground align-middle",
    // Accessibility
    "touch-manipulation before:absolute before:-inset-3.5 before:bg-transparent before:content-[''] outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
    // Validation and disabled states
    "data-invalid:border-danger-foreground data-invalid:focus-visible:outline-danger-foreground",
    "data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-[var(--anaphor-input-disabled)]",
    // Motion and forced colors
    "motion-safe:transition-colors motion-safe:duration-150 forced-colors:border-[ButtonText]",
    typeof className === "function" ? className(state) : className,
  )} {...props} render={(elementProps, state) => <RadioElement elementProps={elementProps} state={state} render={render} />}>
    <RadioPrimitive.Indicator keepMounted data-slot="radio-indicator" className={cn(
      "absolute -inset-0.5 flex items-center justify-center rounded-full bg-primary text-[var(--anaphor-checkbox-mark)]",
      "data-disabled:bg-[var(--anaphor-input-disabled)] data-disabled:text-muted-foreground",
      "data-invalid:inset-ring-2 data-invalid:inset-ring-danger-foreground data-unchecked:opacity-0",
      "forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
    )}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Root>;
}

export { RadioGroup, Radio, type RadioGroupProps, type RadioProps };
