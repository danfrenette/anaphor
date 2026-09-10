# Node-edge graph study

Integrated on `feat/node-edge-graphs` at the manual’s `/#node-edge-graphs` section.
The branch was created from `end-201` with existing uncommitted card-media and
visual-study work preserved. The integrated graph and pulse illumination form the initial checkpoint.

## Composition

- `apps/demo/app/node-edge-demo.tsx` contains the declarative example and controls.
- `apps/demo/app/use-node-edge-demo.ts` owns the optional Effect sequence, cancellation,
  simulated updates, and playback actions. `node-edge-demo-state.ts` holds typed example data.
- `apps/demo/app/node-edge-graph.tsx` contains demo-local Graph, Node, Edge, and pulse behavior.
- `apps/demo/app/node-edge-demo.module.css` scopes geometry and illumination to the example.
- Cards use the existing Card, CardHeader, CardTitle, CardDescription, CardContent,
  and CardAction primitives. Controls use Button and Checkbox. No shared card API changed.
- Node remains a measured wrapper around ordinary child content. Its `nodeId`
  does not replace the native HTML `id`. Arrival light overlays the receiving card
  from its connected side. Cards remain passive; explicit run buttons trigger updates.
- Half-speed pulses, arrival updates, fan-out, policy → allowlist, and
  play/stop/reset/loop carry forward from the original proof of concept.

The original reference is Kit Langton’s shared-state diagram:
https://x.com/kitlangton/status/2096703869136867563

## Pause here for design review

The user requested integration first, followed by a discussion of spacing and
 typography. Standard card padding and type are now visible as a baseline; the
wide diagram scrolls within the manual. Decide whether to make the composition
more compact or give diagrams a wider presentation area. Keep the shared card
primitives unless a demonstrated graph-specific need justifies an addition.
Connection points and local arrival illumination currently need only composition.

Do not expand the framework while reviewing presentation. Duplicate identifiers,
missing-edge failure semantics, moving layouts, and a second Rails example remain
future work. This is a simulated study, not a published graph package.

## Motion refactor — 2026-09-09

Edges remain dim while pulses travel above them in a separate SVG layer.
There is no full-route highlight or timed reveal before departure. Illumination
uses a soft radial halo and a 40px falloff along the active route around each
traveling pulse, plus the receiving card on arrival, matching
the supplied reference. Stop, Reset, and interruption remove active pulses.
Reduced motion retains endpoint feedback without travel. Glow and travel timings
are preserved.

Measurement and arrival illumination have focused internal hooks. Playback state
stays in the demo hook; unused active/visited node state was removed. This follows
Kent C. Dodds’s AHA guidance: concrete, colocated behavior rather than a generic
sequence framework.

Earlier browser checks covered policy → allowlist propagation, fan-out, and
Stop/Reset cancellation. Full-route highlighting was subsequently removed in
favor of localized pulse illumination. TypeScript and targeted lint passed after the refactor.

## Validation

Production build, demo TypeScript, and targeted lint passed. In the browser,
verified six edges, models.dev arrival updating the catalogue to 49, policy
propagating to an allowlist of 3, and Reset restoring values and clearing pulses
and light. Confirmed horizontal overflow stays inside the diagram rather than
widening the document. Local manual preview: http://localhost:3002/#node-edge-graphs.

Original study and fuller design history remain at
`/Users/danfrenette/Documents/ChatGPT/Anaphor/HANDOFF.md`.
