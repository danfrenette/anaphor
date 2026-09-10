import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { captureSource, initialNotebook, sources, type Notebook } from "./notebook-diagram";

describe("notebook behavior", () => {
  it("keeps capture rules specific to each source without mutating initial state", () => {
    expect(sources.audio.update(initialNotebook)).toMatchObject({ notes: 3, recordings: 1, revision: 1 });
    expect(sources.note.update(initialNotebook)).toMatchObject({ notes: 1, revision: 1 });
    expect(sources.link.update(initialNotebook)).toMatchObject({ links: 1, revision: 1 });
    expect(initialNotebook.notes).toBe(0);
  });

  it("updates notebook on arrival, then updates each destination on its own arrival", async () => {
    let notebook: Notebook = initialNotebook;
    const arrivals: { edge: string; state: Notebook }[] = [];
    await Effect.runPromise(captureSource("audio", {
      pulse: edge => Effect.sync(() => { arrivals.push({ edge, state: notebook }); }),
      update: change => { notebook = change(notebook); },
      report: () => {},
    }));
    expect(arrivals[0]).toEqual({ edge: "audio-notebook", state: initialNotebook });
    expect(arrivals.slice(1).map(item => item.edge).sort()).toEqual(["notebook-search", "notebook-summary"]);
    expect(arrivals[1]?.state).toMatchObject({ notes: 3, recordings: 1, revision: 1 });
    expect(notebook).toMatchObject({ indexedRevision: 1, summaryRevision: 1 });
  });
});
