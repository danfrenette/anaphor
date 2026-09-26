import { createElement, type ComponentProps } from "react";
import { cn } from "../lib/utils";

const variants = {
  display: "font-heading text-display font-black text-balance",
  title: "font-heading text-title font-black text-balance",
  heading: "font-heading text-heading font-black text-balance",
  section: "font-heading text-heading font-black tracking-normal uppercase text-balance",
  subheading: "font-heading text-body font-black text-balance",
  body: "max-w-reading font-sans text-body font-normal normal-case text-reading text-wrap",
  description: "max-w-reading font-sans text-body font-normal normal-case text-reading text-pretty",
  ui: "font-sans text-ui font-normal normal-case text-wrap",
  label: "font-sans text-label font-medium tracking-label uppercase text-wrap",
  caption: "font-sans text-small font-normal normal-case text-muted-foreground text-wrap",
  code: "font-mono text-ui font-normal normal-case not-italic text-wrap",
} as const;

type TextVariant = keyof typeof variants;
type TextElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "code";

type TextProps = {
  [Element in TextElement]: ComponentProps<Element> & { as: Element; variant: TextVariant };
}[TextElement];

/** Purpose chooses typography; `as` independently chooses document semantics. */
function Text({ variant, as: Component, className, ...props }: TextProps) {
  return createElement(Component, {
    "data-slot": "text",
    "data-variant": variant,
    className: cn("[overflow-wrap:break-word]", variants[variant], className),
    ...props,
  });
}

export { Text, type TextProps, type TextVariant };
