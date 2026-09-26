"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";
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
  tone: ButtonProps["tone"];
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
  tone,
  ...props
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const pressed = useRef(false);
  const animationStarted = useRef(false);
  const holdStyle = { ...style, "--hold-duration": `${duration}ms` };

  function cancelHold() {
    pressed.current = false;
    animationStarted.current = false;
    setHolding(false);
  }

  function startHold() {
    if (disabled || pressed.current) return;
    pressed.current = true;
    setHolding(true);
  }

  return (
    <Button
      {...props}
      nativeButton={true}
      type="button"
      iconOnly={false}
      loading={false}
      variant="soft"
      tone={tone}
      shape={shape}
      size={size}
      disabled={disabled}
      className={cn("overflow-hidden touch-none", className)}
      data-hold-button=""
      data-holding={holding && !disabled || undefined}
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
      <span
        data-slot="hold-button-overlay"
        aria-hidden="true"
        onAnimationStart={(event) => {
          if (event.target !== event.currentTarget) return;
          if (animationStarted.current) cancelHold();
          else animationStarted.current = true;
        }}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget || !pressed.current || !holding || disabled) return;
          setHolding(false);
          onHoldComplete();
        }}
      >{children}</span>
    </Button>
  );
}

export { HoldButton, type HoldButtonProps };
