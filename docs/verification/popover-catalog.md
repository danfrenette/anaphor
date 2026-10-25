# Popover catalog

The `/#popover` catalog contains Anatomy, Interactive content, and Playground.
Anatomy demonstrates the title, description, body, and Done action. The two settings
examples own independent name, density, and detail preferences. Playground Controls
configure side, alignment, offset, and scale origin; Reset restores its content and placement.
Inline code reflects placement and the optional center-origin override. Verify
Trigger uses the resolved anchor origin, Center uses the popup center, and Reset
restores Trigger. Exercise all sides and a collision flip. Popup surfaces and motion use shared components.

Run `pnpm exec playwright test e2e/popover.spec.ts --workers=2`, the popover unit
tests, lint, and typecheck. The browser suite covers keyboard entry and exit,
focus return, nested menu dismissal, immediate field updates, pointer motion,
reduced motion, accessibility, narrow viewport containment, scrolling, reset,
example independence, and inline code.

Manually open each example from `/#popover`, edit the settings, dismiss with Done,
Escape, and an outside press, and inspect the live summary. Confirm the playground
reset does not change Interactive content. Near viewport edges, collision handling
may override the preferred placement. Keep screenshots and failure artifacts until
reviewed. No registry change is involved in this consumer-only cleanup.
