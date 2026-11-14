"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Children, Fragment, isValidElement, useState } from "react";
import { cn } from "../lib/utils";
import type { ReactElement, ReactNode } from "react";

const tabStyles = cn(
  // Layout
  "relative inline-flex min-h-[var(--tabs-item-size)] flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-var(--spacing))] border border-transparent px-[var(--tabs-item-padding)]",
  // Typography
  "text-[length:var(--tabs-font-size)] leading-none font-medium whitespace-nowrap text-muted-foreground",
  // Orientation
  "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
  // Variant
  "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-2",
  // State
  "data-disabled:pointer-events-none data-disabled:opacity-45",
  // Accessibility and interaction
  "outline-none select-none touch-manipulation",
  // Icon treatment
  "[&>svg]:size-[var(--tabs-icon-size)] [&>svg]:shrink-0",
);

const activeTabStyles = cn(
  "text-foreground",
  // Line variant
  "after:absolute after:bg-foreground group-data-[variant=default]/tabs-list:after:hidden group-data-[variant=lifted]/tabs-list:after:hidden",
  // Horizontal and vertical indicator placement
  "group-data-[orientation=horizontal]/tabs:after:inset-x-2 group-data-[orientation=horizontal]/tabs:after:-bottom-1 group-data-[orientation=horizontal]/tabs:after:h-0.5",
  "group-data-[orientation=vertical]/tabs:after:inset-y-2 group-data-[orientation=vertical]/tabs:after:-end-1 group-data-[orientation=vertical]/tabs:after:w-0.5",
);

const sizeStyles = {
  sm: cn(
    "[--tabs-item-size:1.75rem] [--tabs-item-padding:0.5rem]",
    "[--tabs-font-size:var(--text-small)] [--tabs-icon-size:0.875rem]",
  ),
  md: cn(
    "[--tabs-item-size:2rem] [--tabs-item-padding:0.625rem]",
    "[--tabs-font-size:var(--text-ui)] [--tabs-icon-size:1rem]",
  ),
  lg: cn(
    "[--tabs-item-size:2.5rem] [--tabs-item-padding:0.875rem]",
    "[--tabs-font-size:var(--text-body)] [--tabs-icon-size:1rem]",
  ),
} as const;

type TabsProps = TabsPrimitive.Root.Props;
type TabsKeyDownEvent = Parameters<NonNullable<TabsProps["onKeyDownCapture"]>>[0];
type TabsPointerDownEvent = Parameters<NonNullable<TabsProps["onPointerDownCapture"]>>[0];

function Tabs({
  className,
  onKeyDownCapture,
  onPointerDownCapture,
  onPointerMoveCapture,
  orientation = "horizontal",
  ...props
}: TabsProps): ReactElement {
  const [input, setInput] = useState<"keyboard" | "pointer">("keyboard");

  function handleKeyDownCapture(event: TabsKeyDownEvent) {
    setInput("keyboard");
    onKeyDownCapture?.(event);
  }

  function handlePointerDownCapture(event: TabsPointerDownEvent) {
    setInput("pointer");
    onPointerDownCapture?.(event);
  }

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-tabs-input={input}
      orientation={orientation}
      className={(state) => cn(
        "group/tabs flex gap-2",
        "data-[orientation=horizontal]:flex-col",
        typeof className === "function" ? className(state) : className,
      )}
      onKeyDownCapture={handleKeyDownCapture}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={event => {
        if (event.pointerType === "mouse") setInput("pointer");
        onPointerMoveCapture?.(event);
      }}
      {...props}
    />
  );
}

type TabsListProps = TabsPrimitive.List.Props & {
  size?: keyof typeof sizeStyles;
  variant?: "default" | "lifted" | "line";
};

function TabsList({
  children,
  className,
  size = "md",
  variant = "default",
  ...props
}: TabsListProps): ReactElement {
  const visualTabs = collectVisualTabs(children);

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-size={size}
      data-variant={variant}
      className={(state) => cn(
        "group/tabs-list relative isolate inline-flex w-fit items-center rounded-control p-1",
        "group-data-[orientation=vertical]/tabs:flex-col",
        variant === "line"
          ? cn(
              "rounded-none border-border bg-transparent",
              "group-data-[orientation=horizontal]/tabs:border-b group-data-[orientation=vertical]/tabs:border-s",
            )
          : "bg-muted",
        variant === "lifted" && "[--tabs-lifted-shadow:var(--anaphor-shadow-upload-action)]",
        sizeStyles[size],
        typeof className === "function" ? className(state) : className,
      )}
      {...props}
    >
      {children}
      {visualTabs.length > 0 ? (
        <TabsPrimitive.Indicator
          aria-hidden="true"
          data-slot="tabs-indicator"
          renderBeforeHydration
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] flex items-center",
            "group-data-[orientation=vertical]/tabs:flex-col",
            variant === "default" && "bg-background",
          )}
        >
          {visualTabs}
        </TabsPrimitive.Indicator>
      ) : null}
    </TabsPrimitive.List>
  );
}

type TabsTabProps = TabsPrimitive.Tab.Props;

function TabsTab({ className, ...props }: TabsTabProps): ReactElement {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={(state) => cn(
        tabStyles,
        "z-0 hover:not-data-disabled:text-foreground hover:not-data-disabled:bg-background/50",
        "transition-[color,background-color] duration-150 ease-out group-data-[tabs-input=keyboard]/tabs:transition-none motion-reduce:transition-none",
        "focus-visible:z-[2] focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring data-active:focus-visible:text-foreground",
        typeof className === "function" ? className(state) : className,
      )}
      {...props}
    />
  );
}

type TabsPanelProps = TabsPrimitive.Panel.Props;

function TabsPanel({ className, ...props }: TabsPanelProps): ReactElement {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={(state) => cn(
        "flex-1 outline-none",
        typeof className === "function" ? className(state) : className,
      )}
      {...props}
    />
  );
}

function collectVisualTabs(children: ReactNode, path = ""): ReactElement[] {
  const tabs: ReactElement[] = [];

  Children.toArray(children).forEach((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;
    const key = `${path}${child.key}`;
    if (child.type === Fragment) {
      tabs.push(...collectVisualTabs(child.props.children, `${key}/`));
      return;
    }
    if (child.type !== TabsTab) return;
    if (!isValidElement<TabsTabProps>(child)) return;

    const props = child.props;
    tabs.push(
      <span
        key={key}
        data-disabled={props.disabled || undefined}
        data-slot="tabs-active-copy"
        className={cn(
          tabStyles,
          activeTabStyles,
          typeof props.className === "string" ? props.className : undefined,
        )}
      >
        {props.children}
      </span>,
    );
  });

  return tabs;
}

export {
  Tabs,
  TabsList,
  TabsPanel,
  TabsPrimitive,
  TabsTab,
  type TabsListProps,
  type TabsPanelProps,
  type TabsProps,
  type TabsTabProps,
};
