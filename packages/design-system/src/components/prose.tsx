import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

type ProseProps = ComponentProps<"div"> & { as?: "div" | "article" | "section" };

/** Styles native article markup, including rendered Markdown, at 90% text alpha. */
function Prose({ as: Component = "div", className, ...props }: ProseProps) {
  return <Component data-slot="prose" className={cn("anaphor-prose", className)} {...props} />;
}

export { Prose, type ProseProps };
