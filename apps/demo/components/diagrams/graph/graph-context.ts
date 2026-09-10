"use client";

import { createContext, useContext } from "react";
import type * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export class PulseUnavailable extends Schema.TaggedError<PulseUnavailable>()('PulseUnavailable', {
  edge: Schema.String,
  reason: Schema.Literals(['missing-edge', 'unmounted-edge']),
}) {}

type Box = { x: number; y: number; width: number; height: number };
type GraphContext = {
  register: (id: string, element: HTMLElement | null) => void;
  boxes: Map<string, Box>;
  surface: SVGGElement | null;
  paths: Map<string, SVGPathElement>;
  endpoints: Map<string, SVGGElement>;
  nodeLights: Map<string, HTMLSpanElement>;
  clearGlows: () => void;
  pulse: (edge: string, reverse?: boolean) => Effect.Effect<void, PulseUnavailable>;
};
const Context = createContext<GraphContext | null>(null);
function useGraphContext() {
  const graph = useContext(Context);
  if (!graph) throw new Error('Nodes and edges need a Graph');
  return graph;
}
type GraphControls = Pick<GraphContext, "pulse" | "clearGlows">;

function useGraph(): GraphControls {
  const { pulse, clearGlows } = useGraphContext();
  return { pulse, clearGlows };
}

export { Context, useGraphContext, useGraph, type Box, type GraphControls };
