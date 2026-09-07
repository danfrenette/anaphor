"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

function Field({ className, ...props }: ComponentProps<typeof FieldPrimitive.Root>) {
  return <FieldPrimitive.Root data-slot="field" className={(state) => cn("grid gap-2", typeof className === "function" ? className(state) : className)} {...props} />;
}

function FieldLabel({ className, ...props }: ComponentProps<typeof FieldPrimitive.Label>) {
  return <FieldPrimitive.Label data-slot="field-label" className={(state) => cn("text-ui", typeof className === "function" ? className(state) : className)} {...props} />;
}

function FieldDescription({ className, ...props }: ComponentProps<typeof FieldPrimitive.Description>) {
  return <FieldPrimitive.Description data-slot="field-description" className={(state) => cn("text-ui text-muted-foreground", typeof className === "function" ? className(state) : className)} {...props} />;
}

function FieldError({ className, ...props }: ComponentProps<typeof FieldPrimitive.Error>) {
  return <FieldPrimitive.Error data-slot="field-error" className={(state) => cn("text-ui text-danger-foreground", typeof className === "function" ? className(state) : className)} {...props} />;
}

export { Field, FieldLabel, FieldDescription, FieldError };
