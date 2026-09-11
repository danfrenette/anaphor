"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";
import { useRef, useState } from "react";
import type { ComponentProps, PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from "react";

const itemStyles =
  "relative z-10 flex min-h-9 cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-ui text-foreground outline-none data-disabled:pointer-events-none data-disabled:text-muted-foreground data-highlighted:bg-[color-mix(in_oklch,var(--anaphor-brand)_14%,var(--anaphor-foreground))] data-inset:ps-9 data-[variant=destructive]:text-danger-foreground data-[variant=destructive]:data-highlighted:bg-[color-mix(in_oklch,var(--anaphor-danger)_14%,var(--anaphor-foreground))] pointer-coarse:min-h-11 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0";

const fluidHoverFade = { type: "spring", duration: 0.08, bounce: 0 } as const;
const fluidHoverTravel = { type: "spring", duration: 0.16, bounce: 0 } as const;

type FluidHighlight = {
  height: number;
  top: number;
  variant: "default" | "destructive";
};

const Menu: typeof MenuPrimitive.Root = MenuPrimitive.Root;
const MenuPortal: typeof MenuPrimitive.Portal = MenuPrimitive.Portal;

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props): ReactElement {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      data-stable-anchor=""
      className={className}
      {...props}
    />
  );
}

function MenuItems({ children }: { children: ReactNode }): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLElement | null>(null);
  const [highlight, setHighlight] = useState<FluidHighlight | null>(null);
  const reducedMotion = useReducedMotion();

  function clearHighlight() {
    activeItemRef.current = null;
    setHighlight(null);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (
      !container ||
      event.pointerType !== "mouse" ||
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      clearHighlight();
      return;
    }

    const structuralElements = container.querySelectorAll<HTMLElement>(
      '[data-slot="menu-group-label"], [data-slot="menu-separator"]',
    );
    const overStructure = [...structuralElements].some((element) => {
      const rect = element.getBoundingClientRect();
      return event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    if (overStructure) {
      clearHighlight();
      return;
    }

    const items = [...container.querySelectorAll<HTMLElement>('[data-slot="menu-item"]:not([data-disabled])')];
    let nearest: HTMLElement | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const distance = event.clientY < rect.top
        ? rect.top - event.clientY
        : event.clientY > rect.bottom
          ? event.clientY - rect.bottom
          : 0;
      if (distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    }

    if (!nearest || nearest === activeItemRef.current) return;
    activeItemRef.current = nearest;
    const containerRect = container.getBoundingClientRect();
    const itemRect = nearest.getBoundingClientRect();
    setHighlight({
      height: itemRect.height,
      top: itemRect.top - containerRect.top + container.scrollTop,
      variant: nearest.dataset.variant === "destructive" ? "destructive" : "default",
    });
  }

  return (
    <div
      ref={containerRef}
      data-fluid-hover={highlight ? "" : undefined}
      data-slot="menu-items"
      className="relative max-h-[var(--available-height)] overflow-y-auto"
      onPointerEnter={handlePointerMove}
      onPointerLeave={clearHighlight}
      onPointerMove={handlePointerMove}
    >
      <AnimatePresence initial={false}>
        {highlight ? (
          <motion.div
            key="fluid-highlight"
            aria-hidden="true"
            data-slot="menu-fluid-highlight"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-0 rounded-md",
              highlight.variant === "destructive"
                ? "bg-[color-mix(in_oklch,var(--anaphor-danger)_14%,var(--anaphor-foreground))]"
                : "bg-[color-mix(in_oklch,var(--anaphor-brand)_14%,var(--anaphor-foreground))]",
            )}
            initial={{ opacity: 0, transform: `translate3d(0, ${highlight.top}px, 0)` }}
            animate={{ opacity: 1, transform: `translate3d(0, ${highlight.top}px, 0)` }}
            exit={{ opacity: 0, transition: { duration: 0.06 } }}
            style={{ height: highlight.height }}
            transition={{
              opacity: fluidHoverFade,
              transform: reducedMotion ? { duration: 0 } : fluidHoverTravel,
            }}
          />
        ) : null}
      </AnimatePresence>
      {children}
    </div>
  );
}

type MenuPopupProps = MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  anchor?: MenuPrimitive.Positioner.Props["anchor"];
  portalProps?: MenuPrimitive.Portal.Props;
  side?: MenuPrimitive.Positioner.Props["side"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
};

function MenuPopup({
  align = "center",
  alignOffset,
  anchor,
  children,
  className,
  portalProps,
  side = "bottom",
  sideOffset = 6,
  ...props
}: MenuPopupProps): ReactElement {
  return (
    <MenuPortal {...portalProps}>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50"
        data-slot="menu-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menu-popup"
          className={(state) =>
            cn(
              "min-w-52 origin-[var(--transform-origin)] rounded-control border border-[color-mix(in_oklch,var(--anaphor-input-border)_72%,var(--anaphor-background))] bg-muted p-1.5 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--anaphor-input-border)_35%,transparent),0_8px_24px_-12px_oklch(0_0_0/0.32),0_18px_48px_-24px_oklch(0_0_0/0.22)] outline-none",
              typeof className === "function" ? className(state) : className,
            )
          }
          {...props}
        >
          <MenuItems>{children}</MenuItems>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPortal>
  );
}

function MenuGroup(props: MenuPrimitive.Group.Props): ReactElement {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />;
}

type MenuItemProps = MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
};

function MenuItem({ className, inset, variant = "default", ...props }: MenuItemProps): ReactElement {
  return (
    <MenuPrimitive.Item
      data-inset={inset || undefined}
      data-slot="menu-item"
      data-variant={variant}
      className={(state) => cn(itemStyles, typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

type MenuGroupLabelProps = MenuPrimitive.GroupLabel.Props & { inset?: boolean };

function MenuGroupLabel({ className, inset, ...props }: MenuGroupLabelProps): ReactElement {
  return (
    <MenuPrimitive.GroupLabel
      data-inset={inset || undefined}
      data-slot="menu-group-label"
      className={(state) =>
        cn(
          "px-3 pt-2 pb-1 text-label tracking-[0.08em] text-muted-foreground uppercase data-inset:ps-9",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props): ReactElement {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={(state) => cn("mx-2 my-1 h-px bg-border", typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

function MenuShortcut({ className, ...props }: ComponentProps<"kbd">): ReactElement {
  return (
    <kbd
      data-slot="menu-shortcut"
      className={cn("ms-auto font-mono text-label tracking-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
  type MenuGroupLabelProps,
  type MenuItemProps,
  type MenuPopupProps,
};
