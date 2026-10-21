# Step transition verification

Run `pnpm test:browser e2e/step-transition.spec.ts e2e/media-viewer.spec.ts`,
`pnpm typecheck`, and `pnpm test:registry`.

- Open /#step-transition. Continue enters from the right and exits left; Back
  reverses both. Boundary buttons disable at the first and last step.
- Expand the explanation: the surface follows new content height without a new
  horizontal entrance. Resize the browser and confirm wrapped content stays visible.
- Switch rapidly, including reversing before completion; the latest step wins.
- Verify outgoing controls cannot receive focus. Keep navigation outside the
  moving region. Repeat with reduced motion and keyboard activation.
- In Media viewer, Annotations → Evidence travels forward and returning travels
  backward. The selected tab retains focus; closing Details remains available.
- Inspect both themes, 320px reflow, and long content. Verify RTL with `dir="rtl"`.

Record executed coverage separately from this reusable recipe.
