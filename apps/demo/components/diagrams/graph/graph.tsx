"use client";

import { useState, type ReactNode } from "react";
import { Context } from "./graph-context";
import { useNodeMeasurements } from "./use-node-measurements";
import { Pulse } from "./pulse";
import { usePulses } from "./use-pulses";

type GraphProps = {
  children: ReactNode;
  /** Travel speed in CSS pixels per second. */
  pulseSpeed?: number;
};

function Graph({ children, pulseSpeed = 120 }: GraphProps) {
  const [paths] = useState(() => new Map<string, SVGPathElement>());
  const [endpoints] = useState(() => new Map<string, SVGGElement>());
  const [nodeLights] = useState(() => new Map<string, HTMLSpanElement>());
  const { root, boxes, register } = useNodeMeasurements();
  const [surface, setSurface] = useState<SVGGElement | null>(null);
  const { activePulses, pulse, clearGlows } = usePulses({ paths, endpoints, nodeLights, pulseSpeed });
  return <Context.Provider value={{ register, boxes, surface, paths, endpoints, nodeLights, clearGlows, pulse }}>
    <div className="relative" ref={root}>
      <svg className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-hidden" aria-hidden="true">
        <g ref={setSurface} data-layer="edges" />
        <g data-layer="pulses">
          {activePulses.map(({ id, ...props }) => <Pulse key={id} {...props} />)}
        </g>
      </svg>
      {children}
    </div>
  </Context.Provider>;
}

export { Graph, type GraphProps };
