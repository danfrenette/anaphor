"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "../lib/utils";
import type { ComponentProps, ReactElement } from "react";

const itemStyles =
  "flex min-h-9 cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-ui text-foreground outline-none data-disabled:pointer-events-none data-disabled:text-muted-foreground data-highlighted:bg-[color-mix(in_oklch,var(--anaphor-brand)_14%,var(--anaphor-foreground))] data-inset:ps-9 data-[variant=destructive]:text-danger-foreground data-[variant=destructive]:data-highlighted:bg-[color-mix(in_oklch,var(--anaphor-danger)_14%,var(--anaphor-foreground))] pointer-coarse:min-h-11 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0";

const Menu: typeof MenuPrimitive.Root = MenuPrimitive.Root;
const MenuPortal: typeof MenuPrimitive.Portal = MenuPrimitive.Portal;

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props): ReactElement {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={className}
      {...props}
    />
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
          <div className="max-h-[var(--available-height)] overflow-y-auto">
            {children}
          </div>
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
