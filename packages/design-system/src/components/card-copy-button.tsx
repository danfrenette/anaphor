"use client";

import { Check, Copy } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button } from "./button";
import { cn } from "#lib/utils";

type CardCopyButtonProps = Omit<ComponentProps<"button">, "children" | "onClick"> & {
  value: string;
};

function CardCopyButton({ value, className, disabled, "aria-label": label = "Copy to clipboard", ...props }: CardCopyButtonProps) {
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
    <Button {...props} type="button" iconOnly size="sm" tone="neutral" variant="ghost" disabled={disabled} aria-busy={status === "pending" || undefined} aria-label={label} title={status === "copied" ? "Copied!" : label} onClick={copy} className={cn("dl-card-copy", className)} data-copied={status === "copied" || undefined}>
      <span className="dl-card-copy-icons" aria-hidden="true"><Copy /><Check /></span>
    </Button>
    <span role="status" className="sr-only">{status === "copied" ? "Copied to clipboard." : status === "error" ? "Could not copy. Try again or copy the text manually." : ""}</span>
  </>;
}

export { CardCopyButton, type CardCopyButtonProps };
