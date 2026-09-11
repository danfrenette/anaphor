import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

const variants = {
  display: "font-heading text-display font-black text-balance",
  title: "font-heading text-title font-black text-balance",
  heading: "font-heading text-heading font-black text-balance",
  subheading: "font-heading text-body font-black text-balance",
  body: "font-sans text-body text-reading",
  ui: "font-sans text-ui",
  label: "font-sans text-label font-medium tracking-[0.08em] uppercase",
  caption: "font-sans text-small text-muted-foreground",
  code: "font-mono text-ui font-normal not-italic",
} as const;

type TextVariant = keyof typeof variants;
type TextElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "code";
type TextProps = ComponentProps<"p"> & { variant?: TextVariant; as?: TextElement };

const elements: Record<TextVariant, TextElement> = {
  display: "h1", title: "h2", heading: "h3", subheading: "h4",
  body: "p", ui: "span", label: "span", caption: "p", code: "code",
};

/** Purpose chooses typography; `as` independently chooses document semantics. */
function Text({ variant = "body", as, className, ...props }: TextProps) {
  const Component = as ?? elements[variant];
  return <Component data-slot="text" data-variant={variant} className={cn("[overflow-wrap:break-word]", variants[variant], className)} {...props} />;
}

export { Text, type TextProps, type TextVariant };
