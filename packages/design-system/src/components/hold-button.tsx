"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "../lib/utils";

type HoldButtonProps = Omit<
  ComponentProps<"button">,
  "children" | "onClick" | "onPointerDown" | "onPointerUp" | "onPointerCancel" |
  "onPointerLeave" | "onKeyDown" | "onKeyUp" | "onBlur" | "style" | "type"
> & {
  children: ReactNode;
  duration: number;
  onHoldComplete: () => void;
  shape: ButtonProps["shape"];
  size: ButtonProps["size"];
  style?: ComponentProps<"button">["style"];
};

function HoldButton({
  children,
  className,
  disabled,
  duration,
  onHoldComplete,
  shape,
  size,
  style,
  ...props
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressed = useRef(false);
  const holdStyle = { ...style, "--hold-duration": `${duration}ms` };

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!disabled || timer.current === null) return;
    clearTimeout(timer.current);
    timer.current = null;
    pressed.current = false;
    setHolding(false);
  }, [disabled]);

  function cancelHold() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    pressed.current = false;
    setHolding(false);
  }

  function startHold() {
    if (disabled || pressed.current) return;
    pressed.current = true;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onHoldComplete();
    }, duration);
  }

  return (
    <Button
      {...props}
      nativeButton={true}
      type="button"
      iconOnly={false}
      loading={false}
      variant="destructive-soft"
      shape={shape}
      size={size}
      disabled={disabled}
      className={cn("overflow-hidden touch-none", className)}
      data-hold-button=""
      data-holding={holding || undefined}
      style={holdStyle}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold();
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onBlur={cancelHold}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        startHold();
      }}
      onKeyUp={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        cancelHold();
      }}
    >
      {children}
      <span data-slot="hold-button-overlay" aria-hidden="true">{children}</span>
    </Button>
  );
}

export { HoldButton, type HoldButtonProps };
