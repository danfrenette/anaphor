import { createElement, type ComponentProps } from "react";
import { cn } from "../lib/utils";

const variants = {
  display: "font-heading text-display font-black text-balance",
  title: "font-heading text-title font-black text-balance",
  heading: "font-heading text-heading font-black text-balance",
  subheading: "font-heading text-body font-black text-balance",
  body: "max-w-reading font-sans text-body font-normal text-reading text-wrap",
  description: "max-w-reading font-sans text-body font-normal text-reading text-pretty",
  ui: "font-sans text-ui font-normal text-wrap",
  label: "font-sans text-label font-medium tracking-[0.08em] uppercase text-wrap",
  caption: "font-sans text-small font-normal text-muted-foreground text-wrap",
  code: "font-mono text-ui font-normal not-italic text-wrap",
} as const;

type TextVariant = keyof typeof variants;
type TextElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "code";

const elements = {
  display: "h1", title: "h2", heading: "h3", subheading: "h4",
  body: "p", description: "p", ui: "span", label: "span", caption: "p", code: "code",
} as const satisfies Record<TextVariant, TextElement>;

// Each explicit element and variant default carries its native refs and events.
type TextProps = {
  [Element in TextElement]: ComponentProps<Element> & { as: Element; variant?: TextVariant };
}[TextElement] | {
  [Variant in TextVariant]: ComponentProps<(typeof elements)[Variant]> & {
    as?: never;
    variant: Variant;
  };
}[TextVariant] | (ComponentProps<"p"> & { as?: never; variant?: "body" });

/** Purpose chooses typography; `as` independently chooses document semantics. */
function Text({ variant = "body", as, className, ...props }: TextProps) {
  const Component = as ?? elements[variant];
  return createElement(Component, {
    "data-slot": "text",
    "data-variant": variant,
    className: cn("[overflow-wrap:break-word]", variants[variant], className),
    ...props,
  });
}

export { Text, type TextProps, type TextVariant };
