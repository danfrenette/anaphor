"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react";
import { useRef, type ComponentProps, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../lib/utils";

type PaintSession = {
  pointerId: number;
  origin: HTMLElement;
  checked: boolean;
  x: number;
  y: number;
  painted: Set<HTMLElement>;
  dragging: boolean;
  released: boolean;
};

function CheckboxGroup({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, ...props }: ComponentProps<"div">) {
  const groupRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<PaintSession | null>(null);

  function checkboxAt(target: EventTarget | null) {
    const group = groupRef.current;
    if (!(target instanceof Element) || !group) return null;
    const field = target.closest('[data-slot="field"]');
    const checkbox = field?.querySelector<HTMLElement>('[data-slot="checkbox"]');
    return checkbox && group.contains(checkbox) && !checkbox.hasAttribute("data-disabled") && !checkbox.hasAttribute("data-readonly") ? checkbox : null;
  }

  function paint(checkbox: HTMLElement, session: PaintSession) {
    if (session.painted.has(checkbox)) return;
    session.painted.add(checkbox);
    if ((checkbox.getAttribute("aria-checked") === "true") !== session.checked) checkbox.click();
  }

  function end() {
    const session = sessionRef.current;
    if (!session) return;
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    session.released = true;
    if (session.dragging) window.setTimeout(() => {
      if (sessionRef.current === session) sessionRef.current = null;
    }, 0);
    else sessionRef.current = null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    onPointerDown?.(event);
    // Touch keeps its native scrolling and assistive-technology gestures.
    if (event.defaultPrevented || (event.pointerType !== "mouse" && event.pointerType !== "pen") || event.button !== 0) return;
    const origin = checkboxAt(event.target);
    if (!origin) return;
    sessionRef.current = {
      pointerId: event.pointerId, origin, checked: origin.getAttribute("aria-checked") !== "true",
      x: event.clientX, y: event.clientY, painted: new Set(), dragging: false, released: false,
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    onPointerMove?.(event);
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId || !(event.buttons & 1)) return;
    if (!session.dragging) {
      if (Math.hypot(event.clientX - session.x, event.clientY - session.y) < 5) return;
      session.dragging = true;
      session.origin.focus();
      paint(session.origin, session);
    }
    const checkbox = checkboxAt(document.elementFromPoint(event.clientX, event.clientY));
    if (checkbox) paint(checkbox, session);
    event.preventDefault();
  }

  return <div {...props} data-slot="checkbox-group" ref={groupRef}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={(event) => { onPointerUp?.(event); end(); }}
    onPointerCancel={(event) => { onPointerCancel?.(event); end(); }}
    onClickCapture={(event) => {
      onClickCapture?.(event);
      if (sessionRef.current?.dragging && sessionRef.current.released && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    }}
  />;
}

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={(state) => cn(
        // Layout
        "relative inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 border-muted-foreground align-middle",
        // Accessibility
        "outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
        // Validation and disabled states
        "data-invalid:border-danger-foreground data-invalid:focus-visible:outline-danger-foreground",
        "data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-[var(--anaphor-input-disabled)]",
        // Motion and forced colors
        "motion-safe:transition-colors motion-safe:duration-150 forced-colors:border-[ButtonText]",
        typeof className === "function" ? className(state) : className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        data-slot="checkbox-indicator"
        className={cn(
          // Layout and surface
          "absolute -inset-0.5 flex items-center justify-center rounded-[6px] bg-primary text-[var(--anaphor-checkbox-mark)]",
          // Disabled and validation states
          "data-disabled:bg-[var(--anaphor-input-disabled)] data-disabled:text-muted-foreground",
          "data-invalid:inset-ring-2 data-invalid:inset-ring-danger-foreground data-unchecked:opacity-0",
          // Forced colors
          "forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
        )}
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? <MinusIcon size={16} weight="bold" aria-hidden="true" /> : <CheckIcon size={16} weight="bold" aria-hidden="true" />}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, CheckboxGroup, CheckboxPrimitive };
