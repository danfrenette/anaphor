import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import * as Deferred from "effect/Deferred";
import * as Queue from "effect/Queue";
import { useDiagramPlayback } from "./use-diagram-playback";

function pendingSequence() {
  const cleanup = vi.fn();
  const complete = vi.fn();
  const gates = Effect.runSync(Queue.unbounded<Deferred.Deferred<void>>());
  const program = Effect.gen(function* () {
    const gate = yield* Deferred.make<void>();
    yield* Queue.offer(gates, gate);
    yield* Deferred.await(gate).pipe(Effect.onInterrupt(() => Effect.sync(cleanup)));
    yield* Effect.sync(complete);
  });
  const resume = () => Effect.runPromise(Effect.gen(function* () {
    const gate = yield* Queue.take(gates);
    yield* Deferred.succeed(gate, undefined);
  }));
  return { program, cleanup, complete, resume };
}

describe("useDiagramPlayback", () => {
  it("completes an arbitrary caller-owned sequence", async () => {
    const { result } = renderHook(useDiagramPlayback);
    const sequence = pendingSequence();
    act(() => result.current.run(sequence.program));
    await waitFor(() => expect(result.current.running).toBe(true));
    await act(async () => sequence.resume());
    await waitFor(() => expect(result.current.running).toBe(false));
    expect(sequence.complete).toHaveBeenCalledOnce();
  });

  it("replacing a run cancels the previous sequence and prevents its later writes", async () => {
    const { result } = renderHook(useDiagramPlayback);
    const first = pendingSequence();
    const second = pendingSequence();
    act(() => result.current.run(first.program));
    await act(async () => result.current.run(second.program));
    await waitFor(() => expect(first.cleanup).toHaveBeenCalledOnce());
    await act(async () => first.resume());
    expect(first.complete).not.toHaveBeenCalled();
    expect(result.current.running).toBe(true);
    await act(async () => second.resume());
    await waitFor(() => expect(result.current.running).toBe(false));
  });

  it("Stop cancels resources without completing the sequence", async () => {
    const { result } = renderHook(useDiagramPlayback);
    const sequence = pendingSequence();
    act(() => result.current.run(sequence.program));
    await act(async () => result.current.stop());
    await waitFor(() => expect(sequence.cleanup).toHaveBeenCalledOnce());
    expect(sequence.complete).not.toHaveBeenCalled();
    expect(result.current.running).toBe(false);
  });

  it("unmount releases the running sequence", async () => {
    const { result, unmount } = renderHook(useDiagramPlayback);
    const sequence = pendingSequence();
    act(() => result.current.run(sequence.program));
    unmount();
    await waitFor(() => expect(sequence.cleanup).toHaveBeenCalledOnce());
    expect(sequence.complete).not.toHaveBeenCalled();
  });

  it("honors loop changes without restarting the current iteration", async () => {
    const { result } = renderHook(useDiagramPlayback);
    const sequence = pendingSequence();
    act(() => {
      result.current.setLoop(true);
      result.current.run(sequence.program, { repeat: true });
    });
    await act(async () => sequence.resume());
    await waitFor(() => expect(sequence.complete).toHaveBeenCalledTimes(1));
    expect(result.current.running).toBe(true);
    act(() => result.current.setLoop(false));
    await act(async () => sequence.resume());
    await waitFor(() => expect(result.current.running).toBe(false));
    expect(sequence.complete).toHaveBeenCalledTimes(2);
  });

  it("settles failures and allows another run", async () => {
    const { result } = renderHook(useDiagramPlayback);
    await act(async () => result.current.run(Effect.fail(new Error("broken sequence"))));
    await waitFor(() => expect(result.current.running).toBe(false));
    expect(result.current.error).toContain("broken sequence");
    await act(async () => result.current.run(Effect.void));
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});
