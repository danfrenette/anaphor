"use client";

import { useCallback } from "react";
import { createPortal } from "react-dom";
import { useGraphContext, type Box, type AttachmentSide } from "./graph-context";

function route(source: Box, target: Box) {
  const startX = source.x + source.width;
  const startY = source.y + source.height / 2;
  const endX = target.x;
  const endY = target.y + target.height / 2;
  const middleX = startX + (endX - startX) / 2;
  const radius = Math.min(12, Math.abs(endY - startY) / 2, Math.abs(endX - startX) / 4);
  const direction = endY >= startY ? 1 : -1;
  const path = Math.abs(endY - startY) < 1
    ? `M${startX} ${startY}H${endX}`
    : `M${startX} ${startY}H${middleX-radius}Q${middleX} ${startY} ${middleX} ${startY+direction*radius}V${endY-direction*radius}Q${middleX} ${endY} ${middleX+radius} ${endY}H${endX}`;
  return { startX, startY, endX, endY, path };
}

interface EndpointGlowProps {
  endpointId: string;
  nodeId: string;
  side: AttachmentSide;
  x: number;
  y: number;
}

function EndpointGlow({ endpointId, nodeId, side, x, y }: EndpointGlowProps) {
  const { endpoints } = useGraphContext();
  const ref = useCallback((element: SVGGElement | null) => {
    if (element) endpoints.set(endpointId, { element, nodeId, side });
    else endpoints.delete(endpointId);
  }, [endpointId, nodeId, side, endpoints]);
  return <g transform={`translate(${x} ${y})`}>
    <g ref={ref} data-node-id={nodeId} className="endpoint-glow" style={{ opacity: 0 }}>
      <circle r="11" fill="#f3f4ec" opacity=".025" />
      <circle r="7" fill="#f3f4ec" opacity=".06" />
      <circle r="6.5" fill="none" stroke="#f3f4ec" strokeWidth="1" opacity=".25" />
      <circle r="4" fill="#f3f4ec" opacity=".14" />
      <circle r="2.6" fill="#f3f4ec" />
    </g>
  </g>;
}
type EdgeProps = { edgeId: string; from: string; to: string };

function Edge({ edgeId, from, to }: EdgeProps) {
  const { boxes, surface, paths } = useGraphContext();
  const ref = useCallback((element: SVGPathElement | null) => {
    if (element) paths.set(edgeId, element);
    else paths.delete(edgeId);
  }, [edgeId, paths]);
  const source = boxes.get(from);
  const target = boxes.get(to);
  if (!source || !target || !surface) return null;
  const { startX, startY, endX, endY, path } = route(source, target);
  return createPortal(<g className="edge" data-edge-id={edgeId}>
    <path d={path} ref={ref} fill="none" className="stroke-border" strokeWidth="1" />
    <circle cx={startX} cy={startY} r="2" className="fill-muted-foreground"/><circle cx={endX} cy={endY} r="2" className="fill-muted-foreground"/>
    <EndpointGlow endpointId={`${edgeId}:from`} nodeId={from} side="right" x={startX} y={startY}/>
    <EndpointGlow endpointId={`${edgeId}:to`} nodeId={to} side="left" x={endX} y={endY}/>
  </g>, surface);
}

export { Edge, type EdgeProps };
