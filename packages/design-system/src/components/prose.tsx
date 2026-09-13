import { createElement, type ComponentProps } from "react";
import { cn } from "../lib/utils";

type ProseProps = (ComponentProps<"div"> & { as: "div" })
  | (ComponentProps<"article"> & { as: "article" })
  | (ComponentProps<"section"> & { as: "section" });

/** Styles native article markup, including rendered Markdown, at 90% text alpha. */
function Prose({ as: Component, className, ...props }: ProseProps) {
  return createElement(Component, { "data-slot": "prose", className: cn("anaphor-prose", className), ...props });
}

export { Prose, type ProseProps };
