# Badge catalog

Visit `/#badge`. Variants compare soft, solid, and outline with matching content;
Sizes holds variant and shape constant; Icons & Shapes demonstrates existing
square/round and Tag compositions. Playground retains all controls and reset.
Badges remain passive, with no new component variants or color tokens.

Run `pnpm exec playwright test e2e/badge-catalog.spec.ts --workers=2`.
Verify keyboard code disclosure, variant/size/shape/icon controls and reset,
light/dark accessibility and contrast, and narrow reflow. Review the local preview.
