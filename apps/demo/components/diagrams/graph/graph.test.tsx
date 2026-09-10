import "@testing-library/jest-dom/vitest";
import { act, render, renderHook, screen, within, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import * as Deferred from "effect/Deferred";
import * as Fiber from "effect/Fiber";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";
import * as Option from "effect/Option";
import { Graph, Node, Edge, useGraph, useGraphPlayback } from "./index";
import { useState, type ReactNode } from "react";
import userEvent from "@testing-library/user-event";

const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
const pointAtLength = vi.fn((distance: number) => ({ x: distance, y: 0 }));
beforeEach(() => {
  pointAtLength.mockClear();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: vi.fn(() => ({ cancel: vi.fn(), onfinish: null })) });
  Object.defineProperty(SVGElement.prototype, "getTotalLength", { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: pointAtLength });
});
afterEach(() => {
  frames.clear();
  vi.restoreAllMocks();
  Reflect.deleteProperty(Element.prototype, "animate");
  vi.unstubAllGlobals();
  Reflect.deleteProperty(SVGElement.prototype, "getTotalLength");
  Reflect.deleteProperty(SVGElement.prototype, "getPointAtLength");
});
function ConnectedGraph({ children }: { children: ReactNode }) {
  return <Graph><Node nodeId="a">A</Node><Node nodeId="b">B</Node><Edge edgeId="a-b" from="a" to="b" />{children}</Graph>;
}

it('keeps child controls keyboard accessible without adding a node tab stop', async () => {
  const user = userEvent.setup();
  const save = vi.fn();
  render(
    <Graph>
      <Node nodeId="capture" id="capture-section" variant="surface" aria-label="Capture">
        <button onClick={save}>Save note</button>
        <a href="#saved">View saved notes</a>
      </Node>
    </Graph>,
  );
  const node = screen.getByRole('group', { name: 'Capture' });
  expect(node).toHaveAttribute('id', 'capture-section');
  await user.tab();
  expect(within(node).getByRole('button', { name: 'Save note' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(save).toHaveBeenCalledOnce();
  await user.tab();
  expect(within(node).getByRole('link', { name: 'View saved notes' })).toHaveFocus();
});

function advanceFrame(time: number) {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach(callback => callback(time));
}

function Delivery({ edge = 'a-b', reverse = false }: { edge?: string; reverse?: boolean }) {
  const { pulse, clearGlows } = useGraph();
  const [status, setStatus] = useState('Ready');
  function send() {
    setStatus('Sending');
    void Effect.runPromise(pulse(edge, reverse).pipe(
      Effect.match({ onFailure: () => setStatus('Route unavailable'), onSuccess: () => setStatus('Delivered') }),
    ));
  }
  return <>
    <button onClick={send}>Send</button>
    <button onClick={clearGlows}>Clear feedback</button>
    <p role="status">{status}</p>
  </>;
}

it.each([false, true])('delivers a pulse and lights the receiving node (reverse: %s)', async reverse => {
  const user = userEvent.setup();
  render(<Graph>
    <Node nodeId="a" aria-label="Source">A</Node>
    <Node nodeId="b" aria-label="Destination">B</Node>
    <Edge edgeId="a-b" from="a" to="b" />
    <Delivery reverse={reverse} />
  </Graph>);
  await user.click(screen.getByRole('button', { name: 'Send' }));
  expect(screen.getByRole('status')).toHaveTextContent('Sending');
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  expect(screen.getByRole('status')).toHaveTextContent('Delivered');
  // Animation is a browser boundary; components and context are real.
  const animations = vi.mocked(Element.prototype.animate);
  const receiver = screen.getByRole('group', { name: reverse ? 'Source' : 'Destination' });
  expect(animations.mock.contexts.some(target => target instanceof Element && receiver.contains(target))).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Clear feedback' }));
  for (const result of animations.mock.results) {
    if (result.type === 'return') expect(result.value.cancel).toHaveBeenCalledOnce();
  }
});

it('honors reduced motion and completes delivery without traveling along the route', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const user = userEvent.setup();
  render(<ConnectedGraph><Delivery /></ConnectedGraph>);
  await user.click(screen.getByRole('button', { name: 'Send' }));
  await act(async () => { advanceFrame(0); advanceFrame(160); });
  expect(screen.getByRole('status')).toHaveTextContent('Delivered');
  expect(pointAtLength).toHaveBeenCalled();
  expect(pointAtLength.mock.calls.every(([distance]) => distance === 100)).toBe(true);
});

it('lets the caller show a failure when a route is unavailable', async () => {
  const user = userEvent.setup();
  render(<Graph><Delivery edge="missing" /></Graph>);
  await user.click(screen.getByRole('button', { name: 'Send' }));
  expect(screen.getByRole('status')).toHaveTextContent('Route unavailable');
});

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
    Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: () => { throw new Error("Geometry unavailable"); } });
    const { result } = renderHook(useGraph, { wrapper: ConnectedGraph });
    const fiber = await act(async () => Effect.runFork(result.current.pulse("a-b")));
    expect(document.querySelectorAll(".pulse")).toHaveLength(1);
    await act(async () => advanceFrame(0));
    const exit = await Effect.runPromise(Fiber.await(fiber));
    expect(Exit.isFailure(exit)).toBe(true);
    expect(document.querySelectorAll(".pulse, .pulse-route-light")).toHaveLength(0);
  });

  it("interrupting a pulse cancels its frame and removes its resources", async () => {
    const { result } = renderHook(useGraph, { wrapper: ConnectedGraph });
    const fiber = await act(async () => Effect.runFork(result.current.pulse("a-b")));
    expect(frames.size).toBe(1);
    await act(async () => Effect.runPromise(Fiber.interrupt(fiber)));
    expect(frames.size).toBe(0);
    expect(document.querySelectorAll(".pulse, .pulse-route-light")).toHaveLength(0);
  });
});

it('reports an unmounted graph to an in-flight caller', async () => {
  const { result, unmount } = renderHook(useGraph, { wrapper: ConnectedGraph });
  const fiber = await act(async () => Effect.runFork(result.current.pulse('a-b')));
  unmount();
  advanceFrame(0);
  const exit = await Effect.runPromise(Fiber.await(fiber));
  if (!Exit.isFailure(exit)) throw new Error('Expected failure');
  expect(Option.getOrThrow(Cause.findErrorOption(exit.cause))).toMatchObject({
    _tag: 'PulseUnavailable', edge: 'a-b', reason: 'unmounted-edge',
  });
  expect(frames.size).toBe(0);
});

it('can cancel before React mounts a pulse without delivering it', async () => {
  const { result } = renderHook(useGraph, { wrapper: ConnectedGraph });
  const arrived = vi.fn();
  await act(async () => {
    const fiber = Effect.runFork(result.current.pulse('a-b').pipe(Effect.tap(() => Effect.sync(arrived))));
    await Effect.runPromise(Fiber.interrupt(fiber));
  });
  expect(frames.size).toBe(0);
  expect(arrived).not.toHaveBeenCalled();
  expect(document.querySelectorAll('.pulse, .pulse-route-light')).toHaveLength(0);
});

it('keeps concurrent pulses independent when one is interrupted', async () => {
  const { result } = renderHook(useGraph, { wrapper: ConnectedGraph });
  const arrived = vi.fn();
  const first = await act(async () => Effect.runFork(result.current.pulse('a-b')));
  const second = await act(async () => Effect.runFork(result.current.pulse('a-b', true).pipe(Effect.tap(() => Effect.sync(arrived)))));
  await act(async () => Effect.runPromise(Fiber.interrupt(first)));
  expect(document.querySelectorAll('.pulse')).toHaveLength(1);
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  const exit = await Effect.runPromise(Fiber.await(second));
  expect(Exit.isSuccess(exit)).toBe(true);
  expect(arrived).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('.pulse, .pulse-route-light')).toHaveLength(0);
});

it('delivers once under React Strict Mode effect replay', async () => {
  const { result } = renderHook(useGraph, { wrapper: ConnectedGraph, reactStrictMode: true });
  const arrived = vi.fn();
  const fiber = await act(async () => Effect.runFork(result.current.pulse('a-b').pipe(Effect.tap(() => Effect.sync(arrived)))));
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  const exit = await Effect.runPromise(Fiber.await(fiber));
  expect(Exit.isSuccess(exit)).toBe(true);
  expect(arrived).toHaveBeenCalledOnce();
  expect(frames.size).toBe(0);
});

function useAuthoredDiagram() {
  return { ...useGraph(), playback: useGraphPlayback() };
}

it('shares one run across controls and lets successful feedback fade until Stop', async () => {
  const { result } = renderHook(() => ({ first: useAuthoredDiagram(), second: useGraphPlayback() }), { wrapper: ConnectedGraph });
  const update = vi.fn();
  await act(async () => result.current.first.playback.run(result.current.first.pulse('a-b').pipe(Effect.tap(() => Effect.sync(update)))));
  expect(result.current.second.running).toBe(true);
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  await waitFor(() => expect(result.current.second.running).toBe(false));
  expect(update).toHaveBeenCalledOnce();
  const animations = vi.mocked(Element.prototype.animate).mock.results;
  expect(animations).toHaveLength(2);
  for (const animation of animations) {
    if (animation.type === 'return') expect(animation.value.cancel).not.toHaveBeenCalled();
  }
  await act(async () => result.current.second.stop());
  for (const animation of animations) {
    if (animation.type === 'return') expect(animation.value.cancel).toHaveBeenCalledOnce();
  }
  expect(update).toHaveBeenCalledOnce();
});

it('replacement clears old feedback and cancels unfinished branches while keeping completed updates', async () => {
  const { result } = renderHook(useAuthoredDiagram, { wrapper: ConnectedGraph });
  const completed = vi.fn();
  const unfinished = vi.fn();
  const replacement = vi.fn();
  const sequence = Effect.gen(function* () {
    yield* result.current.pulse('a-b');
    yield* Effect.sync(completed);
    yield* result.current.pulse('a-b');
    yield* Effect.sync(unfinished);
  });
  await act(async () => result.current.playback.run(sequence));
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  expect(completed).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('.pulse')).toHaveLength(1);
  const previousFeedback = [...vi.mocked(Element.prototype.animate).mock.results];
  await act(async () => result.current.playback.run(result.current.pulse('a-b', true).pipe(Effect.tap(() => Effect.sync(replacement)))));
  for (const animation of previousFeedback) {
    if (animation.type === 'return') expect(animation.value.cancel).toHaveBeenCalledOnce();
  }
  expect(document.querySelectorAll('.pulse')).toHaveLength(1);
  await act(async () => { advanceFrame(3000); advanceFrame(5000); });
  await waitFor(() => expect(result.current.playback.running).toBe(false));
  expect(unfinished).not.toHaveBeenCalled();
  expect(completed).toHaveBeenCalledOnce();
  expect(replacement).toHaveBeenCalledOnce();
});

it.each(['failure', 'defect'] as const)('clears transient feedback on %s without rolling back completed updates', async failure => {
  const { result } = renderHook(useAuthoredDiagram, { wrapper: ConnectedGraph });
  const failNow = Effect.runSync(Deferred.make<void>());
  const completed = vi.fn();
  const unfinished = vi.fn();
  const sequence = Effect.gen(function* () {
    yield* result.current.pulse('a-b');
    yield* Effect.sync(completed);
    yield* Effect.all([
      result.current.pulse('a-b').pipe(Effect.tap(() => Effect.sync(unfinished))),
      Deferred.await(failNow).pipe(Effect.andThen(failure === 'failure' ? Effect.fail('delivery failed') : Effect.die('delivery failed'))),
    ], { concurrency: 'unbounded' });
  });
  await act(async () => result.current.playback.run(sequence));
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  expect(document.querySelectorAll('.pulse')).toHaveLength(1);
  await act(async () => { await Effect.runPromise(Deferred.succeed(failNow, undefined)); });
  await waitFor(() => expect(result.current.playback.error).toContain('delivery failed'));
  expect(result.current.playback.running).toBe(false);
  expect(completed).toHaveBeenCalledOnce();
  expect(unfinished).not.toHaveBeenCalled();
  expect(document.querySelectorAll('.pulse, .pulse-route-light')).toHaveLength(0);
  expect(frames.size).toBe(0);
  for (const animation of vi.mocked(Element.prototype.animate).mock.results) {
    if (animation.type === 'return') expect(animation.value.cancel).toHaveBeenCalledOnce();
  }
});

it('Stop and unmount affect only the owning diagram', async () => {
  const first = renderHook(useAuthoredDiagram, { wrapper: ConnectedGraph });
  const second = renderHook(useAuthoredDiagram, { wrapper: ConnectedGraph });
  const secondUpdate = vi.fn();
  await act(async () => {
    first.result.current.playback.run(first.result.current.pulse('a-b'));
    second.result.current.playback.run(second.result.current.pulse('a-b').pipe(Effect.tap(() => Effect.sync(secondUpdate))));
  });
  await act(async () => first.result.current.playback.stop());
  expect(first.result.current.playback.running).toBe(false);
  expect(second.result.current.playback.running).toBe(true);
  expect(document.querySelectorAll('.pulse')).toHaveLength(1);
  first.unmount();
  await act(async () => { advanceFrame(0); advanceFrame(2000); });
  await waitFor(() => expect(second.result.current.playback.running).toBe(false));
  expect(secondUpdate).toHaveBeenCalledOnce();
  const animations = [...vi.mocked(Element.prototype.animate).mock.results];
  expect(animations).toHaveLength(2);
  for (const animation of animations) {
    if (animation.type === 'return') expect(animation.value.cancel).not.toHaveBeenCalled();
  }
  second.unmount();
  for (const animation of animations) {
    if (animation.type === 'return') expect(animation.value.cancel).toHaveBeenCalledOnce();
  }
});
