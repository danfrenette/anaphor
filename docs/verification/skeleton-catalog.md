# Skeleton catalog

Visit `/#skeleton`. Shapes demonstrates the explicit primitive; Effects compares
Pulse, Sheen, and Static with identical geometry. Playground retains the field-note
card, effect tabs, loading toggle, and content-driven text/media dimensions.
Each group has inline code. Credits and resizing guidance remain below.

Run `pnpm exec playwright test e2e/skeleton.spec.ts --workers=2` and the Skeleton
component tests. Verify equal geometry before/after revealing content in both
themes, keyboard effect selection, inert loading content, status clearing,
reduced-motion behavior, code disclosure, and narrow reflow.
