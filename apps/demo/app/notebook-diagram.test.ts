import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Deferred from "effect/Deferred";
import * as Queue from "effect/Queue";
import * as Fiber from "effect/Fiber";
import { TestClock } from "effect/testing";
import { captureSource, initialNotebook, sources, type Notebook } from "./notebook-diagram";

describe("notebook behavior", () => {
  it("keeps capture rules specific to each source without mutating initial state", () => {
    expect(sources.audio.update(initialNotebook)).toMatchObject({ notes: 3, recordings: 1, revision: 1 });
    expect(sources.note.update(initialNotebook)).toMatchObject({ notes: 1, revision: 1 });
    expect(sources.link.update(initialNotebook)).toMatchObject({ links: 1, revision: 1 });
    expect(initialNotebook.notes).toBe(0);
  });

  it("updates each destination only after its pulse arrives", () => Effect.runPromise(
    Effect.gen(function* () {
      let notebook: Notebook = initialNotebook;
      const started = yield* Queue.unbounded<string>();
      const capture = yield* Deferred.make<void>();
      const search = yield* Deferred.make<void>();
      const summary = yield* Deferred.make<void>();
      const updated = yield* Deferred.make<void>();
      const gates = new Map([
        ["audio-notebook", capture], ["notebook-search", search], ["notebook-summary", summary],
      ]);
      const program = captureSource("audio", {
        pulse: edge => Effect.gen(function* () {
          yield* Queue.offer(started, edge);
          const gate = gates.get(edge);
          if (!gate) return yield* Effect.die(new Error(`Unexpected edge: ${edge}`));
          yield* Deferred.await(gate);
        }),
        update: change => { notebook = change(notebook); },
        report: message => {
          if (message.startsWith("Notebook updated")) Effect.runSync(Deferred.succeed(updated, undefined));
        },
      });
      const fiber = yield* Effect.forkScoped(program);
      expect(yield* Queue.take(started)).toBe("audio-notebook");
      expect(notebook).toBe(initialNotebook);
      yield* Deferred.succeed(capture, undefined);
      yield* Deferred.await(updated);
      expect(notebook).toMatchObject({ notes: 3, recordings: 1, revision: 1, indexedRevision: 0, summaryRevision: 0 });
      yield* TestClock.adjust(480);
      const branches = [yield* Queue.take(started), yield* Queue.take(started)];
      expect(branches.sort()).toEqual(["notebook-search", "notebook-summary"]);
      yield* Deferred.succeed(search, undefined);
      yield* TestClock.adjust(0);
      expect(notebook).toMatchObject({ indexedRevision: 1, summaryRevision: 0 });
      yield* Deferred.succeed(summary, undefined);
      yield* Fiber.join(fiber);
      expect(notebook).toMatchObject({ indexedRevision: 1, summaryRevision: 1 });
    }).pipe(Effect.scoped, Effect.provide(TestClock.layer())),
  ));
});
