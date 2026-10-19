# Node-edge graph catalog

Visit `/#node-edge-graphs`. Nodes & connections compares surface and plain nodes;
Pulse feedback demonstrates forward and reverse delivery. Both have inline code.
The notebook remains the full playground with local capture, Play/Stop, and Reset.
The shared Controls panel exposes Loop playback and pulse speed; Reset controls
stops playback, clears the notebook, disables looping, and restores 120px/s.

Run `pnpm exec playwright test e2e/node-edge.spec.ts --workers=2` and
`pnpm exec vitest run apps/demo/app/notebook-diagram.test.ts apps/demo/components/diagrams --maxWorkers=2`.

Check keyboard code disclosure, both pulse directions, capture/revision updates,
reset, playback cancellation, settings, and narrow reflow. Reduced motion must
still complete delivery. The notebook scroll region has a visible focus outline;
its authored 920px layout scrolls inside the surface without page overflow.

Capture and reset actions have 44px targets. Status messages reserve two text lines;
revision badges and dynamic counts use tabular numerals. Sync badges reserve width.
Graph establishes a local stacking context: nodes, edges, and controls retain their
existing relative order, while decorative SVGs remain pointer-inert.

These are demo-owned utilities, not a new package component or registry entry.
