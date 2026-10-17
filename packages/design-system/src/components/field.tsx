"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cn } from "../lib/utils";
import { CheckboxGroup } from "./checkbox";

type FieldProps = ComponentProps<typeof FieldPrimitive.Root> & {
  orientation: "vertical" | "horizontal";
};
type FieldItemProps = ComponentProps<typeof FieldPrimitive.Item> & {
  orientation: "vertical" | "horizontal";
};

function Field({ className, orientation, ...props }: FieldProps) {
  return <FieldPrimitive.Root {...props} data-slot="field" data-orientation={orientation} className={(state) => cn(
    "group/field min-w-0 gap-2",
    orientation === "horizontal"
      ? "flex items-center gap-3 has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[data-slot=checkbox]]:mt-3"
      : "grid",
    typeof className === "function" ? className(state) : className,
  )} />;
}

function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} data-slot="field-content" className={cn("flex min-w-0 flex-1 flex-col gap-1", className)} />;
}

function FieldItem({ className, orientation, ...props }: FieldItemProps) {
  return <FieldPrimitive.Item {...props} data-slot="field-item" data-orientation={orientation} className={(state) => cn(
    "group/field min-w-0 gap-2",
    orientation === "horizontal"
      ? "flex items-center gap-3 has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[data-slot=radio]]:mt-3"
      : "grid",
    typeof className === "function" ? className(state) : className,
  )} />;
}

function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <CheckboxGroup {...props} data-slot="field-group" className={cn("grid min-w-0 gap-4", className)} />;
}

function FieldLabel({ className, ...props }: ComponentProps<typeof FieldPrimitive.Label>) {
  return <FieldPrimitive.Label data-slot="field-label" className={(state) => cn(
    // Typography
    "text-ui",
    // Checkbox labels follow selection, including labels nested in FieldContent.
    "group-has-[>[data-slot=checkbox][data-unchecked]:not([data-disabled])]/field:text-muted-foreground",
    "group-has-[>[data-slot=checkbox][data-checked]:not([data-disabled])]/field:text-foreground",
    "group-has-[>[data-slot=checkbox][data-indeterminate]:not([data-disabled])]/field:text-foreground",
    "group-has-[>[data-slot=checkbox][data-disabled]]/field:text-muted-foreground/60",
    // Horizontal orientation
    "group-data-[orientation=horizontal]/field:flex group-data-[orientation=horizontal]/field:flex-1",
    "group-data-[orientation=horizontal]/field:min-h-11 group-data-[orientation=horizontal]/field:items-center",
    // Interactive label target
    "group-data-[orientation=horizontal]/field:-ms-3 group-data-[orientation=horizontal]/field:ps-3",
    typeof className === "function" ? className(state) : className,
  )} {...props} />;
}

function FieldDescription({ className, ...props }: ComponentProps<typeof FieldPrimitive.Description>) {
  return <FieldPrimitive.Description data-slot="field-description" className={(state) => cn("font-sans text-ui text-pretty text-muted-foreground [overflow-wrap:break-word]", typeof className === "function" ? className(state) : className)} {...props} />;
}

function FieldError({ className, ...props }: ComponentProps<typeof FieldPrimitive.Error>) {
  return <FieldPrimitive.Error data-slot="field-error" className={(state) => cn("text-ui text-danger-foreground", typeof className === "function" ? className(state) : className)} {...props} />;
}

export { Field, FieldItem, FieldContent, FieldGroup, FieldLabel, FieldDescription, FieldError, type FieldProps, type FieldItemProps };
