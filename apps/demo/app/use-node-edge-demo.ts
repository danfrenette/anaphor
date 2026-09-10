import { useEffect, useRef, useState } from 'react';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useGraph, PLAYBACK_RATE } from './node-edge-graph';
import { extensions, initial, type ExtensionId, type SharedState } from './node-edge-demo-state';

function applyExtension(state: SharedState, id: ExtensionId): SharedState {
  const next = { ...state, revision: state.revision + 1 };
  switch (id) {
    case 'models': return { ...next, models: 49 };
    case 'limits': return { ...next, limit: state.limit === '32k' ? '16k' : '32k' };
    case 'policy': return { ...next, models: state.models ? 47 : 0 };
    case 'skills': return { ...next, skills: 14 };
    case 'chrome': return { ...next, tools: 4 };
  }
}

export function useNodeEdgeDemo() {
  const { pulse, clearGlows } = useGraph();
  const [state, setState] = useState(initial);
  const [status, setStatus] = useState('Ready when you are');
  const [running, setRunning] = useState(false);
  const [loop, setLoopState] = useState(false);
  // A running sequence reads changes to Loop without restarting its fiber.
  const loopRef = useRef(false);
  const task = useRef<Fiber.RuntimeFiber<void, never> | null>(null);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current++;
    if (task.current) Effect.runFork(Fiber.interrupt(task.current));
  }, []);

  function setLoop(enabled: boolean) {
    loopRef.current = enabled;
    setLoopState(enabled);
  }

  function cancel() {
    generation.current++;
    clearGlows();
    if (task.current) {
      Effect.runFork(Fiber.interrupt(task.current));
      task.current = null;
    }
    setRunning(false);
  }

  function execute(id: ExtensionId) {
    return Effect.gen(function* () {
      const extension = extensions.find(item => item.id === id)!;
      yield* Effect.sync(() => setStatus(`${extension.title} → shared state`));
      yield* pulse(`shared-${id}`, true);
      yield* Effect.sync(() => {
        setState(current => applyExtension(current, id));
        setStatus('Shared state updated');
      });
      yield* Effect.sleep(240 / PLAYBACK_RATE);

      if (id === 'policy') {
        yield* Effect.sync(() => setStatus('Company policy → allowlist'));
        yield* pulse('shared-policy');
        yield* pulse('policy-allowlist');
        yield* Effect.sync(() => {
          setState(current => ({ ...current, allowed: 3 }));
          setStatus('Allowlist updated · 3 models');
        });
      } else {
        yield* Effect.sync(() => setStatus('Propagating the update'));
        const recipients = extensions.filter(item => item.id !== id);
        yield* Effect.all(
          recipients.map(item => pulse(`shared-${item.id}`)),
          { concurrency: 'unbounded' },
        );
      }
      yield* Effect.sleep(400 / PLAYBACK_RATE);
    });
  }

  function start(id?: ExtensionId) {
    cancel();
    const ticket = generation.current;
    setRunning(true);
    if (id) setLoop(false);

    const program = Effect.gen(function* () {
      do {
        if (id) {
          yield* execute(id);
        } else {
          for (const extension of extensions) {
            yield* execute(extension.id);
            yield* Effect.sleep(420 / PLAYBACK_RATE);
          }
        }
        if (!id && loopRef.current) yield* Effect.sleep(1000 / PLAYBACK_RATE);
      } while (!id && loopRef.current);

      yield* Effect.sync(() => {
        if (generation.current !== ticket) return;
        setRunning(false);
        setStatus(id ? 'Update complete · choose another node' : 'Flow complete · replay or explore');
        task.current = null;
      });
    });
    task.current = Effect.runFork(program);
  }

  function stop() {
    cancel();
    setStatus('Stopped · choose a node to continue');
  }

  function reset() {
    cancel();
    setState(initial);
    setStatus('Ready when you are');
  }

  return {
    state, status, running, loop, setLoop,
    runExtension: (id: ExtensionId) => start(id),
    play: () => start(),
    stop,
    reset,
  };
}
