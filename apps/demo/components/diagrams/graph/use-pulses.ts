"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import * as Effect from "effect/Effect";
import { PulseUnavailable, type Endpoint } from "./graph-context";
import { useArrivalLights } from "./use-arrival-lights";
import type { PulseProps } from "./pulse";

interface PulseOptions {
  paths: ReadonlyMap<string, SVGPathElement>;
  endpoints: ReadonlyMap<string, Endpoint>;
  nodeLights: ReadonlyMap<string, HTMLSpanElement>;
  pulseSpeed: number;
}

type ActivePulse = PulseProps & { id: number };

function usePulses({ paths, endpoints, nodeLights, pulseSpeed }: PulseOptions) {
  const { clearGlows, illuminate } = useArrivalLights();
  const [activePulses, setActivePulses] = useState<ActivePulse[]>([]);
  const pending = useRef(new Map<number, () => void>());
  const mounted = useRef(false);
  const pulseNumber = useRef(0);

  useLayoutEffect(() => {
    mounted.current = true;
    const requests = pending.current;
    return () => {
      mounted.current = false;
      requests.forEach(fail => fail());
      requests.clear();
    };
  }, []);

  const pulse = useCallback((edge: string, reverse = false) => Effect.callback<void, PulseUnavailable>(resume => {
    const path = paths.get(edge);
    if (!path || !mounted.current) {
      resume(Effect.fail(new PulseUnavailable({ edge, reason: 'missing-edge' })));
      return;
    }
    const id = pulseNumber.current++;
    const controller = new AbortController();
    const remove = () => {
      if (!pending.current.delete(id)) return;
      controller.abort();
      if (mounted.current) setActivePulses(current => current.filter(request => request.id !== id));
    };
    const finish: PulseProps['finish'] = result => {
      if (!pending.current.has(id)) return;
      remove();
      resume(result);
    };
    pending.current.set(id, () => finish(Effect.fail(new PulseUnavailable({ edge, reason: 'unmounted-edge' }))));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const request: ActivePulse = {
      id, edge, path, reverse, reduce, pulseSpeed, finish, signal: controller.signal,
      arrive: () => {
        const endpoint = endpoints.get(`${edge}:${reverse ? 'from' : 'to'}`);
        const nodeLight = endpoint ? nodeLights.get(endpoint.nodeId) : undefined;
        illuminate(endpoint, nodeLight, reduce);
      },
    };
    setActivePulses(current => [...current, request]);
    return Effect.sync(remove);
  }).pipe(Effect.withSpan("Diagram.pulse", { attributes: { edge, reverse } })), [paths, endpoints, nodeLights, illuminate, pulseSpeed]);

  return { activePulses, pulse, clearGlows };
}

export { usePulses };
