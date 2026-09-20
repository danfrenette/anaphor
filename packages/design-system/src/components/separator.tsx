"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "../lib/utils";

function Separator({
  className,
  orientation,
  ...props
}: SeparatorPrimitive.Props & { orientation: "horizontal" | "vertical" }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={(state) =>
        cn(
          // Base
          "shrink-0 bg-border",
          // Orientation
          "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export { Separator };
