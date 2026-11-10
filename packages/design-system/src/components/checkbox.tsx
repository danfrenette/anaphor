"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, type ComponentProps, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../lib/utils";

type PaintSession = {
  pointerId: number;
  group: HTMLElement;
  origin: HTMLElement;
  checked: boolean;
  x: number;
  y: number;
  painted: Set<HTMLElement>;
  dragging: boolean;
  released: boolean;
  releaseListeners: AbortController;
};

function checkboxAt(group: HTMLElement, target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const field = target.closest('[data-slot="field"]');
  const checkbox = field?.querySelector<HTMLElement>('[data-slot="checkbox"]');
  return checkbox && group.contains(checkbox) && !checkbox.hasAttribute("data-disabled") && !checkbox.hasAttribute("data-readonly") ? checkbox : null;
}

function paint(checkbox: HTMLElement, session: PaintSession) {
  if (session.painted.has(checkbox)) return;
  session.painted.add(checkbox);
  if ((checkbox.getAttribute("aria-checked") === "true") !== session.checked) checkbox.click();
}

/** Spread the handlers onto an existing container of Checkbox fields. */
function useCheckboxPaint() {
  const sessionRef = useRef<PaintSession | null>(null);

  useEffect(() => () => {
    sessionRef.current?.releaseListeners.abort();
    sessionRef.current = null;
  }, []);

  function end(event: Pick<PointerEvent, "pointerId">) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId || session.released) return;
    session.releaseListeners.abort();
    if (!session.dragging) {
      sessionRef.current = null;
      return;
    }
    session.released = true;
    window.setTimeout(() => {
      if (sessionRef.current === session) sessionRef.current = null;
    }, 0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    // Touch keeps its native scrolling and assistive-technology gestures.
    if (event.defaultPrevented || (event.pointerType !== "mouse" && event.pointerType !== "pen") || event.button !== 0) return;
    const group = event.currentTarget;
    const origin = checkboxAt(group, event.target);
    if (!origin) return;
    sessionRef.current?.releaseListeners.abort();
    const releaseListeners = new AbortController();
    sessionRef.current = {
      pointerId: event.pointerId, group, origin, checked: origin.getAttribute("aria-checked") !== "true",
      x: event.clientX, y: event.clientY, painted: new Set(), dragging: false, released: false, releaseListeners,
    };
    window.addEventListener("pointerup", end, { signal: releaseListeners.signal });
    window.addEventListener("pointercancel", end, { signal: releaseListeners.signal });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const session = sessionRef.current;
    if (!session || session.group !== event.currentTarget || session.released || session.pointerId !== event.pointerId || !(event.buttons & 1)) return;
    if (!session.dragging) {
      if (Math.hypot(event.clientX - session.x, event.clientY - session.y) < 5) return;
      session.dragging = true;
      session.origin.focus();
      paint(session.origin, session);
    }
    const checkbox = checkboxAt(session.group, document.elementFromPoint(event.clientX, event.clientY));
    if (checkbox) paint(checkbox, session);
    event.preventDefault();
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLElement>) {
    const session = sessionRef.current;
    if (session?.dragging && session.released && session.group === event.currentTarget && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: end,
    onPointerCancel: end,
    onClickCapture: handleClickCapture,
  };
}

function CheckboxGroup({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, ...props }: ComponentProps<"div">) {
  const paint = useCheckboxPaint();
  return <div data-slot="checkbox-group" {...props}
    onPointerDown={(event) => { onPointerDown?.(event); paint.onPointerDown(event); }}
    onPointerMove={(event) => { onPointerMove?.(event); paint.onPointerMove(event); }}
    onPointerUp={(event) => { onPointerUp?.(event); paint.onPointerUp(event); }}
    onPointerCancel={(event) => { onPointerCancel?.(event); paint.onPointerCancel(event); }}
    onClickCapture={(event) => { onClickCapture?.(event); paint.onClickCapture(event); }}
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
        "touch-manipulation before:absolute before:-inset-3.5 before:bg-transparent before:content-[''] outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
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

export { Checkbox, CheckboxGroup, CheckboxPrimitive, useCheckboxPaint };
