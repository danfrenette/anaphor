"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "../lib/utils";

const Popover: typeof PopoverPrimitive.Root = PopoverPrimitive.Root;
const PopoverClose: typeof PopoverPrimitive.Close = PopoverPrimitive.Close;

function PopoverTrigger<Payload>(props: PopoverPrimitive.Trigger.Props<Payload>): ReactElement {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" data-stable-anchor="" {...props} />;
}

type PopoverPopupProps = PopoverPrimitive.Popup.Props & {
  align: NonNullable<PopoverPrimitive.Positioner.Props["align"]>;
  side: NonNullable<PopoverPrimitive.Positioner.Props["side"]>;
  sideOffset: NonNullable<PopoverPrimitive.Positioner.Props["sideOffset"]>;
  portalProps?: PopoverPrimitive.Portal.Props;
  positionerProps?: Omit<PopoverPrimitive.Positioner.Props, "align" | "side" | "sideOffset" | "children">;
};

function PopoverPopup({ align, side, sideOffset, portalProps, positionerProps, className, ...props }: PopoverPopupProps): ReactElement {
  return (
    <PopoverPrimitive.Portal {...portalProps}>
      <PopoverPrimitive.Positioner
        {...positionerProps}
        align={align}
        side={side}
        sideOffset={sideOffset}
        data-slot="popover-positioner"
        className={(state) => cn("z-[var(--anaphor-z-overlay)]", typeof positionerProps?.className === "function" ? positionerProps.className(state) : positionerProps?.className)}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-popup"
          className={(state) => cn(
            "w-80 max-w-[min(var(--available-width),calc(100vw-2rem))] origin-[var(--transform-origin)] rounded-control border bg-muted text-foreground outline-none",
            "border-[color-mix(in_oklch,var(--anaphor-input-border)_72%,var(--anaphor-background))] shadow-[var(--anaphor-shadow-menu)]",
            typeof className === "function" ? className(state) : className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverBody({ className, ...props }: ComponentProps<"div">): ReactElement {
  return <div data-slot="popover-body" className={cn("max-h-[calc(var(--available-height)-2px)] overflow-y-auto overscroll-contain rounded-[inherit] p-4", className)} {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props): ReactElement {
  return <PopoverPrimitive.Title data-slot="popover-title" className={(state) => cn("font-sans text-ui font-medium", typeof className === "function" ? className(state) : className)} {...props} />;
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props): ReactElement {
  return <PopoverPrimitive.Description data-slot="popover-description" className={(state) => cn("mt-1 text-small text-pretty text-muted-foreground", typeof className === "function" ? className(state) : className)} {...props} />;
}

export { Popover, PopoverBody, PopoverClose, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger, type PopoverPopupProps };
