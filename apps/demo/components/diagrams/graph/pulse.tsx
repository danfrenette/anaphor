"use client";

import { useId, useLayoutEffect, useRef } from "react";
import * as Effect from "effect/Effect";
import { PulseUnavailable } from "./graph-context";

interface PulseProps {
  edge: string;
  signal: AbortSignal;
  path: SVGPathElement;
  reverse: boolean;
  reduce: boolean;
  pulseSpeed: number;
  arrive: () => void;
  finish: (result: Effect.Effect<void, PulseUnavailable>) => void;
}

function Pulse({ edge, signal, path, reverse, reduce, pulseSpeed, arrive, finish }: PulseProps) {
  const id = useId().replace(/:/g, '');
  const dotRef = useRef<SVGGElement>(null);
  const lightRef = useRef<SVGGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const gradientRef = useRef<SVGRadialGradientElement>(null);

  useLayoutEffect(() => {
    const dot = dotRef.current;
    const light = lightRef.current;
    const routeLight = routeRef.current;
    const gradient = gradientRef.current;
    if (!dot || !light || !routeLight || !gradient || signal.aborted) return;
    let frame = 0;
    let start: number | undefined;
    let length: number;
    let duration: number;
    try {
      length = path.getTotalLength();
      duration = reduce ? 160 : Math.max(1040, length / Math.max(1, pulseSpeed) * 1000);
    } catch (cause) {
      finish(Effect.die(cause));
      return;
    }
    const tick = (now: number) => {
      if (!path.isConnected) {
        finish(Effect.fail(new PulseUnavailable({ edge, reason: 'unmounted-edge' })));
        return;
      }
      try {
        // Only live geometry and animated properties are owned by this loop.
        const route = path.getAttribute('d') ?? '';
        if (routeLight.getAttribute('d') !== route) {
          routeLight.setAttribute('d', route);
          length = path.getTotalLength();
        }
        start ??= now;
        const t = Math.min((now - start) / duration, 1);
        const position = reduce ? (reverse ? 0 : 1) : (reverse ? 1 - t : t);
        const point = path.getPointAtLength(length * position);
        gradient.setAttribute('gradientTransform', `translate(${point.x} ${point.y})`);
        light.style.opacity = String(reduce ? 0 : Math.min(t * 12, 1));
        dot.style.transform = `translate(${point.x}px, ${point.y}px)`;
        dot.style.opacity = String(reduce ? 1 - t : Math.min(t * 12, 1));
        if (t < 1) frame = requestAnimationFrame(tick);
        else {
          arrive();
          finish(Effect.void);
        }
      } catch (cause) {
        // Browser callbacks run outside the fiber; return defects to the caller.
        finish(Effect.die(cause));
      }
    };
    frame = requestAnimationFrame(tick);
    const cancel = () => cancelAnimationFrame(frame);
    signal.addEventListener("abort", cancel, { once: true });
    return () => {
      cancel();
      signal.removeEventListener("abort", cancel);
    };
  }, [edge, signal, path, reverse, reduce, pulseSpeed, arrive, finish]);

  return <>
    <defs>
      <radialGradient id={`${id}-halo`}>
        <stop offset="0" stopColor="#f3f4ec" stopOpacity=".55" />
        <stop offset=".22" stopColor="#f3f4ec" stopOpacity=".3" />
        <stop offset=".5" stopColor="#f3f4ec" stopOpacity=".09" />
        <stop offset="1" stopColor="#f3f4ec" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g ref={lightRef} className="pulse-route-light opacity-0">
      <defs>
        <radialGradient ref={gradientRef} id={`${id}-route`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="40">
          <stop offset="0" stopColor="#f3f4ec" stopOpacity=".85" />
          <stop offset=".3" stopColor="#f3f4ec" stopOpacity=".45" />
          <stop offset=".7" stopColor="#f3f4ec" stopOpacity=".12" />
          <stop offset="1" stopColor="#f3f4ec" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path ref={routeRef} fill="none" stroke={`url(#${id}-route)`} strokeWidth="1.5" />
    </g>
    <g ref={dotRef} className="pulse opacity-0" data-edge-id={edge}>
      <circle r="12" fill={`url(#${id}-halo)`} />
      <circle r="2.3" fill="#f3f4ec" />
    </g>
  </>;
}

export { Pulse, type PulseProps };
