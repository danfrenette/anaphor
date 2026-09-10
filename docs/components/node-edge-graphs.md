# Node-edge diagrams

The manual’s `/#node-edge-graphs` section contains an authored notebook diagram.
The original shared-state study is preserved in checkpoint commit `78f93a9`.

## Composition

- `apps/demo/components/diagrams/graph.tsx`: reusable Graph, Node, Edge, and useGraph.
  Measures ordinary JSX nodes, connects them, and renders cancellable pulses.
- `apps/demo/components/diagrams/use-diagram-playback.ts`: reusable run/stop/loop
  lifecycle, running/error state, and cancellation on replacement or unmount.
  It knows nothing about notebook data, node names, status text, or routes.
- `apps/demo/app/notebook-diagram.ts`: notebook data, typed capture rules, and
  the bespoke capture → notebook → search/summary sequence.
- `apps/demo/app/node-edge-demo.tsx`: Tailwind layout, Phosphor icons, local
  notebook/status state, and controls that compose the two reusable APIs. Every
  node is built from Card sections and Badge/Button primitives; source metadata,
  notebook synchronization, and downstream revision state remain visible.

The graph styles itself with Tailwind, SVG presentation attributes, and dynamic
animation values. No demo CSS module is required. The components directory is
included in the demo’s Tailwind sources. Arrival illumination uses a radial fill
and masked rim; only its origin and opacity change at runtime.

## Authoring

```tsx
<Graph pulseSpeed={120}>
  <Node nodeId="capture" className="rounded-card"><CaptureCard /></Node>
  <Node nodeId="notebook" className="rounded-card"><NotebookCard /></Node>
  <Edge edgeId="capture-notebook" from="capture" to="notebook" />
  <Controls />
</Graph>
```

Nodes are positioned with ordinary CSS/Tailwind. `nodeId` is graph-scoped and
independent of native HTML `id`. The graph connects the right side of `from` to
the left side of `to`. A reverse pulse traverses that same path in reverse.

```tsx
function Controls() {
  const { pulse, clearGlows } = useGraph();
  const playback = useDiagramPlayback();
  const sequence = Effect.gen(function* () {
    yield* pulse("capture-notebook");
    yield* Effect.sync(() => updateNotebook());
  });
  return <button onClick={() => {
    clearGlows();
    playback.run(sequence);
  }}>Capture</button>;
}
```

`run(program)` replaces the current run. `run(program, { repeat: true })` repeats
while Loop is enabled through `setLoop`; changing Loop does not restart a run.
`stop()` interrupts active work. Unmount also interrupts it: the React useEffect
is required for resource cleanup, not for reporting or deriving display state.
Errors settle playback and are exposed to the caller. Caller-owned state updates
inside the Effect sequence happen only after preceding pulses complete.

React’s useEffect and the Effect library have different roles. Effect coordinates
concurrency, sleeps, and interruption. The notebook business rules remain outside
the playback hook; sources provide typed update functions rather than a switch in
the mechanics. The hook also works independently of Graph for other authored
Effect sequences.

## Motion

Pulses start immediately; no full-path highlight or timed reveal precedes them.
A bright core, soft radial halo, and 40px falloff on the nearby active route carry
light through bends. Arrival illuminates the receiving card from its connected
side. The default speed is 120 CSS px/second with a 1,040ms minimum travel time.
Reduced motion uses endpoint feedback instead of travel or moving route light.
Stop, Reset, replacement, and unmount release pulse resources.

The notebook example has three inputs (audio, quick note, saved link). Each update
arrives at the notebook before search and summary receive concurrent pulses.
These are simulated updates; no recording, indexing, or AI service is invoked.

## Validation and boundaries

Focused tests cover completion, replacement, stop, unmount, looping, errors, and
notebook updates on arrival. Browser validation covers capture, propagation,
reset, rendering, and contained horizontal overflow.

This remains an internal diagram module, not a published package. Moving layouts,
obstacle routing, duplicate identifiers, and seeking/pause remain future work.
Nodes inherit the shared default Card shadow; no graph-specific card CSS exists.

Design approach: [Kent C. Dodds on colocation](https://kentcdodds.com/blog/colocation)
and [Matt Pocock on inference and generics](https://www.totaltypescript.com/mental-model-for-typescript-generics).
Motion reference: [Kit Langton’s diagrams](https://x.com/kitlangton/status/2096703869136867563).
Preview: http://localhost:3002/#node-edge-graphs.

## Effect v4 review

Pinned to `effect@4.0.0-rc.113` (v4 release candidate). The upgrade uses
`Effect.callback`, `Fiber.Fiber`, and `effect/testing` rather than v3 APIs.
`Notebook.captureSource` uses `Effect.fn`; the React callback carries a named
`Diagram.pulse` span with edge and direction attributes.
Playback uses `Effect.repeat` with a schedule and a live Loop predicate; the
React boundary reports failures while Stop and unmount interrupt owned fibers.

Missing or removed edges fail with `PulseUnavailable`; they cannot advance the
sequence as if arrival succeeded. Exceptions in animation-frame callbacks are
returned as defects to the waiting fiber, and pulse DOM resources are removed.

Workflow tests use TestClock, Deferred, and Queue for controlled arrival ordering,
including proving one fan-out destination stays unchanged while the other arrives.
Renderer tests cover missing routes, callback failure cleanup, and interruption.
