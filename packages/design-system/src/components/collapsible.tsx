"use client";

import { Collapsible as Primitive } from "@base-ui/react/collapsible";
import { createContext, useContext, useMemo, useLayoutEffect, useRef, useState, type ComponentProps, type Ref, type RefObject } from "react";
import { cn } from "../lib/utils";

type CollapsibleProps = ComponentProps<typeof Primitive.Root>;
type CollapsibleTriggerProps = ComponentProps<typeof Primitive.Trigger>;
type CollapsibleContentProps = ComponentProps<typeof Primitive.Panel>;

type FocusContext = { open: boolean; trigger: RefObject<HTMLButtonElement | null>; panel: RefObject<HTMLDivElement | null> };
const Context = createContext<FocusContext | null>(null);

function Collapsible({ open: controlledOpen, defaultOpen = false, onOpenChange, onFocusCapture, onBlurCapture, ...props }: CollapsibleProps) {
  const [uncontrolledOpen, setOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusInside = useRef(false);
  useLayoutEffect(() => {
    if (!open && focusInside.current) {
      const active = trigger.current?.ownerDocument.activeElement;
      if (active === trigger.current?.ownerDocument.body || (active && panel.current?.contains(active))) {
        trigger.current?.focus();
      }
      focusInside.current = false;
    }
  }, [open]);
  return <Context value={{ open, trigger, panel }}><Primitive.Root data-slot="collapsible" {...props} open={open}
    onOpenChange={(nextOpen, details) => {
      onOpenChange?.(nextOpen, details);
      if (!details.isCanceled) setOpen(nextOpen);
    }}
    onFocusCapture={event => {
      focusInside.current = panel.current?.contains(event.target) ?? false;
      onFocusCapture?.(event);
    }}
    onBlurCapture={event => {
      if (event.relatedTarget instanceof Node && !panel.current?.contains(event.relatedTarget)) focusInside.current = false;
      onBlurCapture?.(event);
    }}
  /></Context>;
}

function mergePartRefs<T>(internalRef: RefObject<T | null>, externalRef: Ref<T> | undefined) {
  return (node: T | null) => {
    internalRef.current = node;
    const cleanup = typeof externalRef === "function" ? externalRef(node) : undefined;
    if (externalRef && typeof externalRef !== "function") externalRef.current = node;
    return () => {
      internalRef.current = null;
      if (typeof cleanup === "function") cleanup();
      else if (typeof externalRef === "function") externalRef(null);
      else if (externalRef) externalRef.current = null;
    };
  };
}

function CollapsibleTrigger({ className, ref, ...props }: CollapsibleTriggerProps) {
  const { trigger: triggerRef } = useContext(Context)!;
  const mergedRef = useMemo(() => mergePartRefs(triggerRef, ref), [triggerRef, ref]);
  return <Primitive.Trigger ref={mergedRef} data-slot="collapsible-trigger" className={state => cn(
    "flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-2 text-start text-ui text-foreground not-data-disabled:hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:cursor-not-allowed data-disabled:text-muted-foreground data-disabled:bg-[var(--anaphor-input-disabled)] pointer-coarse:min-h-11",
    "[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:transition-transform [&>svg]:duration-[var(--anaphor-motion-duration-standard)] data-panel-open:[&>svg]:rotate-90 motion-reduce:[&>svg]:transition-none motion-reduce:[&>svg]:duration-0",
    typeof className === "function" ? className(state) : className,
  )} {...props} />;
}

function CollapsibleContent({ className, ref, hiddenUntilFound = true, ...props }: CollapsibleContentProps) {
  const { panel: panelRef, open } = useContext(Context)!;
  const mergedRef = useMemo(() => mergePartRefs(panelRef, ref), [panelRef, ref]);
  // Inert subtrees are excluded from browser Find; native hidden-until-found handles closed panels.
  return <Primitive.Panel ref={mergedRef} hiddenUntilFound={hiddenUntilFound} inert={!open && !hiddenUntilFound || undefined} aria-hidden={!open || undefined} data-slot="collapsible-content" className={state => cn(
    "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-[var(--anaphor-motion-duration-standard)] ease-[var(--anaphor-ease-out)] data-starting-style:h-0 data-ending-style:h-0 data-ending-style:invisible motion-reduce:transition-none motion-reduce:duration-0",
    typeof className === "function" ? className(state) : className,
  )} {...props} />;
}

const CollapsiblePanel = CollapsibleContent;
export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsiblePanel, type CollapsibleProps, type CollapsibleTriggerProps, type CollapsibleContentProps };
