"use client";

import { Check, Copy } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button } from "./button";
import { cn } from "../lib/utils";

const iconStyles = cn(
  // Layout
  "absolute inset-0 size-4",
  // Motion
  "transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
  // Reduced motion
  "motion-reduce:transform-none motion-reduce:transition-opacity",
);

type CardCopyButtonProps = Omit<ComponentProps<"button">, "children" | "onClick"> & {
  value: string;
  "aria-label": string;
};

function CardCopyButton({ value, className, disabled, "aria-label": label, ...props }: CardCopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "copied" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);
  const mounted = useRef(false);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; window.clearTimeout(timer.current); };
  }, []);

  async function copy() {
    if (pending.current) return;
    pending.current = true;
    window.clearTimeout(timer.current);
    setStatus("pending");
    try {
      await navigator.clipboard.writeText(value);
      if (mounted.current) {
        setStatus("copied");
        timer.current = window.setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      if (mounted.current) setStatus("error");
    } finally {
      pending.current = false;
    }
  }

  return <>
    <Button loading={false} nativeButton={true} shape="square" {...props} type="button" iconOnly size="sm" tone="neutral" variant="ghost" disabled={disabled} aria-busy={status === "pending" || undefined} aria-label={label} title={status === "copied" ? "Copied!" : label} onClick={copy} className={className}>
      <span className="relative size-4" aria-hidden="true">
        <Copy className={cn(iconStyles, status === "copied" && "scale-90 opacity-0")} />
        <Check className={cn(iconStyles, status === "copied" ? "scale-100 opacity-100" : "scale-90 opacity-0")} />
      </span>
    </Button>
    <span role="status" className="sr-only">{status === "copied" ? "Copied to clipboard." : status === "error" ? "Could not copy. Try again or copy the text manually." : ""}</span>
  </>;
}

export { CardCopyButton, type CardCopyButtonProps };
