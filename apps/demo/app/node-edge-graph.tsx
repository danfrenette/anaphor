"use client";

// Throwaway study: JSX registration, DOM-measured edges, interruptible Effect pulses.
import { createContext, useContext, useState, useRef, useId, useCallback, useLayoutEffect, type ReactNode, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import * as Effect from 'effect/Effect';

export const PLAYBACK_RATE = 0.5;

type Box = { x: number; y: number; width: number; height: number };
type GraphContext = {
  register: (id: string, element: HTMLElement | null) => void;
  boxes: Map<string, Box>;
  surface: SVGGElement | null;
  paths: Map<string, SVGPathElement>;
  endpoints: Map<string, SVGGElement>;
  cardLights: Map<string, HTMLSpanElement>;
  clearGlows: () => void;
  pulse: (edge: string, reverse?: boolean) => Effect.Effect<void>;
};
const Context = createContext<GraphContext | null>(null);
export function useGraph() {
  const graph = useContext(Context);
  if (!graph) throw new Error('Nodes and edges need a Graph');
  return graph;
}
function useNodeMeasurements() {
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const [boxes, setBoxes] = useState(new Map<string, Box>());
  const observer = useRef<ResizeObserver | null>(null);
  const measure = useCallback(() => {
    if (!root.current) return;
    const origin = root.current.getBoundingClientRect();
    const next = new Map<string, Box>();
    nodes.current.forEach((element, id) => {
      const box = element.getBoundingClientRect();
      next.set(id, { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height });
    });
    setBoxes(next);
  }, []);
  const register = useCallback((id: string, element: HTMLElement | null) => {
    const previous = nodes.current.get(id);
    if (previous) observer.current?.unobserve(previous);
    if (element) {
      nodes.current.set(id, element);
      observer.current?.observe(element);
    } else {
      nodes.current.delete(id);
    }
    measure();
  }, [measure]);
  useLayoutEffect(() => {
    const resize = new ResizeObserver(measure);
    observer.current = resize;
    if (root.current) resize.observe(root.current);
    nodes.current.forEach(node => resize.observe(node));
    measure();
    window.addEventListener('resize', measure);
    const container = root.current;
    container?.addEventListener('scroll', measure, true);
    return () => {
      resize.disconnect();
      observer.current = null;
      window.removeEventListener('resize', measure);
      container?.removeEventListener('scroll', measure, true);
    };
  }, [measure]);
  return { root, boxes, register };
}

function useArrivalLights() {
  const glows = useRef(new Map<Element, Animation>());
  const clearGlows = useCallback(() => {
    glows.current.forEach(animation => animation.cancel());
    glows.current.clear();
  }, []);
  useLayoutEffect(() => clearGlows, [clearGlows]);
  const illuminate = useCallback((targets: (Element | null | undefined)[], reduce: boolean) => {
    for (const target of targets) {
      if (!target) continue;
      glows.current.get(target)?.cancel();
      const animation = target.animate([
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.08 },
        { opacity: 0.65, offset: 0.3 },
        { opacity: 0, offset: 1 },
      ], { duration: reduce ? 200 : 1100, easing: 'linear' });
      glows.current.set(target, animation);
      animation.onfinish = () => {
        if (glows.current.get(target) === animation) glows.current.delete(target);
      };
    }
  }, []);
  return { clearGlows, illuminate };
}

export function Graph({ children }: { children: ReactNode }) {
  const [paths] = useState(() => new Map<string, SVGPathElement>());
  const [endpoints] = useState(() => new Map<string, SVGGElement>());
  const [cardLights] = useState(() => new Map<string, HTMLSpanElement>());
  const { root, boxes, register } = useNodeMeasurements();
  const { clearGlows, illuminate } = useArrivalLights();
  const [surface, setSurface] = useState<SVGGElement | null>(null);
  const pulses = useRef<SVGGElement>(null);
  const glowId = useId().replace(/:/g, '');
  const pulseNumber = useRef(0);
  const pulse = useCallback((edge: string, reverse = false) => Effect.async<void>(resume => {
    const path = paths.get(edge);
    if (!path || !pulses.current) { resume(Effect.void); return; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dot.classList.add('pulse');
    dot.style.opacity = '0';
    dot.innerHTML = `<circle r="12" fill="url(#${glowId}-halo)"/><circle r="2.3" fill="#f3f4ec"/>`;
    const lightId = `${glowId}-route-${pulseNumber.current++}`;
    const light = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    light.classList.add('pulse-route-light');
    light.innerHTML = `<defs><radialGradient id="${lightId}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="40"><stop offset="0" stop-color="#f3f4ec" stop-opacity=".85"/><stop offset=".3" stop-color="#f3f4ec" stop-opacity=".45"/><stop offset=".7" stop-color="#f3f4ec" stop-opacity=".12"/><stop offset="1" stop-color="#f3f4ec" stop-opacity="0"/></radialGradient></defs>`;
    const routeLight = path.cloneNode(false) as SVGPathElement;
    routeLight.setAttribute('stroke', `url(#${lightId})`);
    routeLight.setAttribute('stroke-width', '1.5');
    light.appendChild(routeLight);
    light.style.opacity = '0';
    const gradient = light.querySelector('radialGradient')!;
    dot.dataset.edgeId = edge;
    pulses.current.appendChild(light);
    pulses.current.appendChild(dot);
    const removePulse = () => {
      light.remove();
      dot.remove();
    };
    const length = path.getTotalLength();
    const duration = reduce ? 160 : Math.max(520, length / 0.24) / PLAYBACK_RATE;
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      const position = reduce ? (reverse ? 0 : 1) : (reverse ? 1 - t : t);
      const p = path.getPointAtLength(length * position);
      gradient.setAttribute('gradientTransform', `translate(${p.x} ${p.y})`);
      light.style.opacity = String(reduce ? 0 : Math.min(t * 12, 1));
      dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
      dot.style.opacity = String(reduce ? 1 - t : Math.min(t * 12, 1));
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        const endpoint = endpoints.get(`${edge}:${reverse ? 'from' : 'to'}`);
        const cardLight = endpoint ? cardLights.get(endpoint.dataset.nodeId ?? '') : undefined;
        if (cardLight) {
          cardLight.style.setProperty('--light-x', reverse ? '100%' : '0%');
        }
        illuminate([endpoint, cardLight], reduce);
        removePulse();
        resume(Effect.void);
      }
    };
    frame = requestAnimationFrame(tick);
    return Effect.sync(() => { cancelAnimationFrame(frame); removePulse(); });
  }), [paths, endpoints, cardLights, illuminate, glowId]);
  return <Context.Provider value={{ register, boxes, surface, paths, endpoints, cardLights, clearGlows, pulse }}>
    <div className="graph-root" ref={root}>
      <svg className="edge-surface" aria-hidden="true">
        <defs>
          <radialGradient id={`${glowId}-halo`}>
            <stop offset="0" stopColor="#f3f4ec" stopOpacity=".55" />
            <stop offset=".22" stopColor="#f3f4ec" stopOpacity=".3" />
            <stop offset=".5" stopColor="#f3f4ec" stopOpacity=".09" />
            <stop offset="1" stopColor="#f3f4ec" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={setSurface} data-layer="edges" />
        <g ref={pulses} data-layer="pulses" />
      </svg>
      {children}
    </div>
  </Context.Provider>;
}
export function Node({ nodeId, children, ...props }: HTMLAttributes<HTMLDivElement> & { nodeId: string }) {
  const { register, cardLights } = useGraph();
  const ref = useCallback((element: HTMLDivElement | null) => register(nodeId, element), [nodeId, register]);
  const lightRef = useCallback((element: HTMLSpanElement | null) => {
    if (element) cardLights.set(nodeId, element);
    else cardLights.delete(nodeId);
  }, [nodeId, cardLights]);
  return <div {...props} ref={ref}>{children}<span ref={lightRef} className="card-arrival-light" aria-hidden="true" /></div>;
}
function route(a: Box, b: Box) {
  const sx = a.x + a.width, sy = a.y + a.height / 2, tx = b.x, ty = b.y + b.height / 2;
  const mid = sx + (tx - sx) / 2;
  const r = Math.min(12, Math.abs(ty - sy) / 2, Math.abs(tx - sx) / 4);
  const dir = ty >= sy ? 1 : -1;
  return { sx, sy, tx, ty, d: Math.abs(ty - sy) < 1 ? `M${sx} ${sy}H${tx}` : `M${sx} ${sy}H${mid-r}Q${mid} ${sy} ${mid} ${sy+dir*r}V${ty-dir*r}Q${mid} ${ty} ${mid+r} ${ty}H${tx}` };
}
function EndpointGlow({ endpointId, nodeId, x, y }: { endpointId: string; nodeId: string; x: number; y: number }) {
  const { endpoints } = useGraph();
  const ref = useCallback((element: SVGGElement | null) => {
    if (element) endpoints.set(endpointId, element);
    else endpoints.delete(endpointId);
  }, [endpointId, endpoints]);
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
export function Edge({ edgeId, from, to }: { edgeId: string; from: string; to: string }) {
  const { boxes, surface, paths } = useGraph();
  const ref = useCallback((element: SVGPathElement | null) => { if (element) paths.set(edgeId, element); else paths.delete(edgeId); }, [edgeId, paths]);
  const a = boxes.get(from), b = boxes.get(to);
  if (!a || !b || !surface) return null;
  const p = route(a, b);
  return createPortal(<g className="edge" data-edge-id={edgeId}>
    <path d={p.d} ref={ref} fill="none" />
    <circle cx={p.sx} cy={p.sy} r="2"/><circle cx={p.tx} cy={p.ty} r="2"/>
    <EndpointGlow endpointId={`${edgeId}:from`} nodeId={from} x={p.sx} y={p.sy}/>
    <EndpointGlow endpointId={`${edgeId}:to`} nodeId={to} x={p.tx} y={p.ty}/>
  </g>, surface);
}
