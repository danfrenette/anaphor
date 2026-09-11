import * as Effect from "effect/Effect";

export type Notebook = {
  notes: number;
  recordings: number;
  links: number;
  revision: number;
  indexedRevision: number;
  summaryRevision: number;
};

export const initialNotebook: Notebook = {
  notes: 0, recordings: 0, links: 0, revision: 0,
  indexedRevision: 0, summaryRevision: 0,
};

// Bespoke rules are data beside this diagram, not cases in the playback hook.
export const sources = {
  audio: {
    title: "Audio capture",
    description: "Turn a conversation into notes",
    update: (notebook: Notebook): Notebook => ({
      ...notebook, recordings: notebook.recordings + 1, notes: notebook.notes + 3,
      revision: notebook.revision + 1,
    }),
  },
  note: {
    title: "Quick note",
    description: "Save a thought while it is fresh",
    update: (notebook: Notebook): Notebook => ({
      ...notebook, notes: notebook.notes + 1, revision: notebook.revision + 1,
    }),
  },
  link: {
    title: "Saved link",
    description: "Keep a source with its context",
    update: (notebook: Notebook): Notebook => ({
      ...notebook, links: notebook.links + 1, revision: notebook.revision + 1,
    }),
  },
};
export type SourceId = keyof typeof sources;
export const sourceOrder = ["audio", "note", "link"] as const satisfies readonly SourceId[];

type NotebookFlow = {
  pulse: (edgeId: string) => Effect.Effect<void, unknown>;
  update: (change: (notebook: Notebook) => Notebook) => void;
  report: (message: string) => void;
};

export const captureSource = Effect.fn("Notebook.captureSource")(function* (id: SourceId, { pulse, update, report }: NotebookFlow) {
  const source = sources[id];
  yield* Effect.sync(() => report(`${source.title} → notebook`));
  yield* pulse(`${id}-notebook`);
  yield* Effect.sync(() => {
    update(source.update);
    report("Notebook updated · preparing search and summary");
  });
  yield* Effect.sleep(480);
  yield* Effect.all([
    Effect.gen(function* () {
      yield* pulse("notebook-search");
      yield* Effect.sync(() => update(current => ({
        ...current, indexedRevision: current.revision,
      })));
    }),
    Effect.gen(function* () {
      yield* pulse("notebook-summary");
      yield* Effect.sync(() => update(current => ({
        ...current, summaryRevision: current.revision,
      })));
    }),
  ], { concurrency: "unbounded" });
  yield* Effect.sync(() => report("Notebook, search, and summary are up to date"));
});
