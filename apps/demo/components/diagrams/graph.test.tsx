import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";
import * as Option from "effect/Option";
import { Graph, Node, Edge, useGraph } from "./graph";
import type { ReactNode } from "react";

const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  Object.defineProperty(SVGElement.prototype, "getTotalLength", { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: () => { throw new Error("Geometry unavailable"); } });
});
afterEach(() => {
  frames.clear();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(SVGElement.prototype, "getTotalLength");
  Reflect.deleteProperty(SVGElement.prototype, "getPointAtLength");
});
function ConnectedGraph({ children }: { children: ReactNode }) {
  return <Graph><Node nodeId="a">A</Node><Node nodeId="b">B</Node><Edge edgeId="a-b" from="a" to="b" />{children}</Graph>;
}

describe("pulse failure boundaries", () => {
  it("fails missing routes instead of applying an arrival update", async () => {
    const { result } = renderHook(useGraph, { wrapper: Graph });
    const arrived = vi.fn();
    const exit = await Effect.runPromiseExit(result.current.pulse("missing").pipe(Effect.tap(() => Effect.sync(() => { arrived(); }))));
    expect(arrived).not.toHaveBeenCalled();
    if (!Exit.isFailure(exit)) throw new Error("Expected failure");
    expect(Option.getOrThrow(Cause.findErrorOption(exit.cause))).toMatchObject({ _tag: "PulseUnavailable", edge: "missing" });
  });

  it("reports browser callback defects and removes pulse elements", async () => {
    const { result } = renderHook(useGraph, { wrapper: ConnectedGraph });
    const fiber = Effect.runFork(result.current.pulse("a-b"));
    expect(document.querySelectorAll(".pulse")).toHaveLength(1);
    for (const callback of frames.values()) callback(0);
    const exit = await Effect.runPromise(Fiber.await(fiber));
    expect(Exit.isFailure(exit)).toBe(true);
    expect(document.querySelectorAll(".pulse, .pulse-route-light")).toHaveLength(0);
  });

  it("interrupting a pulse cancels its frame and removes its resources", async () => {
    const { result } = renderHook(useGraph, { wrapper: ConnectedGraph });
    const fiber = Effect.runFork(result.current.pulse("a-b"));
    expect(frames.size).toBe(1);
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(frames.size).toBe(0);
    expect(document.querySelectorAll(".pulse, .pulse-route-light")).toHaveLength(0);
  });
});
