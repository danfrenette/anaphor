"use client";

import { useCallback, type ComponentPropsWithoutRef } from "react";
import { useGraphContext } from "./graph-context";

interface NodeProps extends ComponentPropsWithoutRef<"div"> {
  nodeId: string;
  /** Use a node-owned surface, or compose your own child surface. */
  variant?: 'plain' | 'surface';
}

function Node({ nodeId, children, variant = 'plain', className = "", ...props }: NodeProps) {
  const { register, nodeLights } = useGraphContext();
  const ref = useCallback((element: HTMLDivElement | null) => register(nodeId, element), [nodeId, register]);
  const lightRef = useCallback((element: HTMLSpanElement | null) => {
    if (element) nodeLights.set(nodeId, element);
    else nodeLights.delete(nodeId);
  }, [nodeId, nodeLights]);
  return (
    <div
      role="group"
      {...props}
      data-slot="node"
      data-node-id={nodeId}
      data-variant={variant}
      ref={ref}
      className={`relative z-[2] min-w-0 ${variant === 'surface' ? 'rounded-lg border border-border bg-muted text-foreground' : ''} ${className}`}
    >
      {children}
      <span
        ref={lightRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-[2] rounded-[inherit] opacity-0 bg-[radial-gradient(ellipse_125px_95px_at_var(--light-x,0%)_50%,rgba(246,248,231,.22),rgba(238,243,217,.085)_32%,rgba(238,243,217,.025)_60%,transparent_100%)]"
      >
        <span className="absolute inset-0 rounded-[inherit] p-px bg-[radial-gradient(ellipse_100px_90px_at_var(--light-x,0%)_50%,rgba(250,252,237,.85),rgba(234,242,208,.22)_45%,transparent_100%)] [mask:linear-gradient(#fff_0_0)_content-box_exclude,linear-gradient(#fff_0_0)]" />
      </span>
    </div>
  );
}

export { Node, type NodeProps };
