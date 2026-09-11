"use client";

import { useEffect, useRef, useState } from "react";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
import * as Fiber from "effect/Fiber";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";

/** Runs authored diagram sequences. Data, routes, and status copy belong to callers. */
export function useDiagramPlayback({ clearFeedback }: { clearFeedback?: () => void } = {}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loop, setLoopState] = useState(false);
  const loopRef = useRef(false);
  const task = useRef<Fiber.Fiber<void, never> | null>(null);
  const generation = useRef(0);
  const feedback = useRef(clearFeedback);
  useEffect(() => { feedback.current = clearFeedback; }, [clearFeedback]);

  // This effect owns a resource lifetime; it does not mirror or derive render state.
  useEffect(() => () => {
    generation.current++;
    if (task.current) Effect.runFork(Fiber.interrupt(task.current));
    feedback.current?.();
  }, []);

  function setLoop(enabled: boolean) {
    loopRef.current = enabled;
    setLoopState(enabled);
  }

  function stop() {
    generation.current++;
    setError(null);
    if (task.current) {
      Effect.runFork(Fiber.interrupt(task.current));
      task.current = null;
    }
    feedback.current?.();
    setRunning(false);
  }

  function run(program: Effect.Effect<void, unknown>, options: { repeat?: boolean } = {}) {
    stop();
    const ticket = generation.current;
    setRunning(true);
    setError(null);

    // Yield between iterations so synchronous caller programs remain interruptible.
    const sequence = program.pipe(
      Effect.tap(() => Effect.yieldNow),
      Effect.repeat({
        schedule: Schedule.forever,
        while: () => Boolean(options.repeat && loopRef.current),
      }),
    );

    task.current = Effect.runFork(Effect.gen(function* () {
      const result = yield* Effect.exit(sequence);
      if (generation.current !== ticket) return;
      setRunning(false);
      if (Exit.isFailure(result)) {
        feedback.current?.();
        setError(Cause.pretty(result.cause));
      }
      task.current = null;
    }));
  }

  return { running, error, loop, setLoop, run, stop };
}
