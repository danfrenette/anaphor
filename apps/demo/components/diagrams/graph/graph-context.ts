"use client";

import { createContext, useContext } from "react";
import type * as Effect from "effect/Effect";
import type { useDiagramPlayback } from "../use-diagram-playback";
import * as Schema from "effect/Schema";

export class PulseUnavailable extends Schema.TaggedError<PulseUnavailable>()('PulseUnavailable', {
  edge: Schema.String,
  reason: Schema.Literals(['missing-edge', 'unmounted-edge']),
}) {}

type Box = { x: number; y: number; width: number; height: number };
type AttachmentSide = "left" | "right" | "top" | "bottom";
type Endpoint = { element: SVGGElement; nodeId: string; side: AttachmentSide };

type GraphContext = {
  playback: ReturnType<typeof useDiagramPlayback>;
  register: (id: string, element: HTMLElement | null) => void;
  boxes: Map<string, Box>;
  surface: SVGGElement | null;
  paths: Map<string, SVGPathElement>;
  endpoints: Map<string, Endpoint>;
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

function useGraphPlayback() {
  return useGraphContext().playback;
}

export { useGraphPlayback, type Endpoint, type AttachmentSide, Context, useGraphContext, useGraph, type Box, type GraphControls };
