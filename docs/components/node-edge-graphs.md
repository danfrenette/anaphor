# Node-edge diagrams

The manual’s `/#node-edge-graphs` section contains an authored notebook diagram.
The original shared-state study is preserved in checkpoint commit `78f93a9`.

## Composition

- `apps/demo/components/diagrams/graph/`: reusable Graph, Node, Edge, useGraph, and useGraphPlayback.
  The public index preserves the `diagrams/graph` import. `graph.tsx` owns the
  provider and pulse rendering; `node.tsx` owns node registration and feedback;
  `edge.tsx` owns routes and endpoints. Shared context, measurement, and arrival
  lifecycle hooks live beside them, along with the composition and pulse tests.
- `apps/demo/components/diagrams/use-diagram-playback.ts`: reusable run/stop/loop
  lifecycle, running/error state, and cancellation on replacement or unmount.
  Graph owns one instance, exposed through useGraphPlayback, and supplies feedback cleanup.
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
  <Node variant="plain" nodeId="capture" className="rounded-card"><CaptureCard /></Node>
  <Node variant="plain" nodeId="notebook" className="rounded-card"><NotebookCard /></Node>
  <Edge edgeId="capture-notebook" from="capture" to="notebook" />
  <Controls />
</Graph>
```

Nodes are positioned with ordinary CSS/Tailwind. `nodeId` is graph-scoped and
independent of native HTML `id`. The graph connects the right side of `from` to
the left side of `to`. A reverse pulse traverses that same path in reverse.

### Node and Card responsibilities

Node owns registration, measurement attachment, and decorative arrival feedback.
It renders an HTML group; name it with `aria-label` or `aria-labelledby`.
It does not add a tab stop or button behavior. Actions remain native controls
inside the group. Graph renders the SVG edges; Node content stays ordinary HTML.

The required `variant="plain"` allows any child content, including a Card.
`variant="surface"` supplies Node's own neutral surface and rounded geometry.
The compact three-node demo uses that surface directly, without importing Card.
Card owns only presentation and sections; it has no graph or animation dependency.

```tsx
<Node nodeId="capture" variant="surface" aria-label="Capture" className="p-4">
  <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid" onClick={capture}>Capture a note</Button>
</Node>
```

These are authored illustrations, not graph editors. Selection and directional
keyboard navigation are not implied by grouping. Flow descriptions and meaningful
status announcements belong to the surrounding diagram.

```tsx
function Controls() {
  const { pulse } = useGraph();
  const playback = useGraphPlayback();
  const sequence = Effect.gen(function* () {
    yield* pulse("capture-notebook");
    yield* Effect.sync(() => updateNotebook());
  });
  return <button onClick={() => {
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
side. Examples set the required `pulseSpeed` to 120 CSS px/second, with a 1,040ms minimum travel time.
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

### Refactoring and test conventions

Graph composes measurement, pulse playback, and the SVG surface. `graph/use-pulses.ts` owns active pulse requests and arrival feedback; `graph/pulse.tsx` renders their SVG and samples live paths during playback; Node owns its optional surface and grouping semantics. Card is optional child content.

Tests exercise the public exports with real Graph, Node, and Edge composition. Keyboard interactions use accessible roles and user-event. Pulse tests cover delivery, reverse delivery, reduced motion, missing routes, defects, interruption, and unmounting. Only browser geometry, animation timing, and Web Animations are substituted in jsdom. These tests do not establish visual fidelity; browser tests cover rendered layout. `graph.types.test.ts` checks native prop compatibility, required identifiers, supported variants, and the typed Effect result during type checking.

This follows [Kent C. Dodds’s guidance on testing observable behavior](https://kentcdodds.com/blog/testing-implementation-details) and [Matt Pocock’s guidance on extending native React props](https://www.totaltypescript.com/react-props-typescript).

Pulse SVG is declared in React, including its gradients and static attributes. React creates and removes each pulse; the frame loop updates only live path geometry, position, and opacity. Each request has an abort signal so interruption cancels its scheduled frame immediately, including before a pulse mounts. Graph unmounting fails outstanding requests, and concurrent pulses remain independent.

### Authored playback ownership

Each Graph owns one playback lifetime, shared by every `useGraphPlayback()` caller beneath it. Separate Graphs remain independent. Examples use `run`, `stop`, and loop controls without manually pairing them with `clearGlows`. The generic `useDiagramPlayback` remains independent of Graph; its optional `clearFeedback` callback is invoked on start/replacement, Stop, failure, and unmount, but not successful completion.

Successful arrival feedback fades naturally. Stop or failure interrupts unfinished work and clears transient feedback while preserving completed data updates. Reset remains an example-owned operation: stop playback, then restore initial data and status. Concurrent branches belong to their parent sequence and are interrupted together on failure or replacement. Low-level `useGraph().pulse` remains available; authored sequences must run through Graph playback to participate in this shared lifetime.

Connection direction and reverse playback are separate concepts. Edge supplies each endpoint’s node identity and attachment side; arrival rendering uses that side for its horizontal and vertical glow origin. Playback cleanup has no routing assumptions. Current routes still connect right to left; new right-to-left, top-to-bottom, and bottom-to-top routes are future work.
