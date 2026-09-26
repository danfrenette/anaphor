"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { createContext, useContext, useId, useState, type ReactElement } from "react";
import { cn } from "../lib/utils";

const TooltipContext = createContext<{ id: string; open: boolean } | null>(null);

function Tooltip<Payload>({ onOpenChange, ...props }: TooltipPrimitive.Root.Props<Payload>) {
  const id = useId();
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  return <TooltipContext value={{ id, open: props.open ?? open }}><TooltipPrimitive.Root {...props} onOpenChange={(next, details) => {
    onOpenChange?.(next, details);
    if (!details.isCanceled) setOpen(next);
  }} /></TooltipContext>;
}
const TooltipProvider = TooltipPrimitive.Provider;
const TooltipGroup = TooltipPrimitive.Provider;

function TooltipTrigger<Payload>(props: TooltipPrimitive.Trigger.Props<Payload>): ReactElement {
  const tooltip = useContext(TooltipContext);
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" data-stable-anchor="" {...props}
    aria-describedby={[props["aria-describedby"], tooltip?.open ? tooltip.id : undefined].filter(Boolean).join(" ") || undefined} />;
}

type TooltipPopupProps = TooltipPrimitive.Popup.Props & {
  side: NonNullable<TooltipPrimitive.Positioner.Props["side"]>;
  align: NonNullable<TooltipPrimitive.Positioner.Props["align"]>;
  sideOffset: NonNullable<TooltipPrimitive.Positioner.Props["sideOffset"]>;
  portalProps?: TooltipPrimitive.Portal.Props;
  positionerProps?: Omit<TooltipPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "children">;
};

function TooltipPopup({ side, align, sideOffset, portalProps, positionerProps, className, ...props }: TooltipPopupProps): ReactElement {
  const tooltip = useContext(TooltipContext);
  return <TooltipPrimitive.Portal {...portalProps}>
    <TooltipPrimitive.Positioner {...positionerProps} side={side} align={align} sideOffset={sideOffset}
      className={state => cn("z-[var(--anaphor-z-overlay)]", typeof positionerProps?.className === "function" ? positionerProps.className(state) : positionerProps?.className)}>
      <TooltipPrimitive.Popup id={tooltip?.id} role="tooltip" data-slot="tooltip-popup" className={state => cn(
        "max-w-[min(20rem,var(--available-width))] origin-[var(--transform-origin)] rounded-control border border-border bg-muted px-3 py-2 text-small text-pretty text-foreground shadow-[var(--anaphor-shadow-menu)] [overflow-wrap:anywhere]",
        typeof className === "function" ? className(state) : className,
      )} {...props} />
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>;
}

export { Tooltip, TooltipGroup, TooltipProvider, TooltipTrigger, TooltipPopup, type TooltipPopupProps };
