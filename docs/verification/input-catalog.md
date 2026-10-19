# Input catalog

Visit `/#input`. Sizes, States, Validation, With an action, and Playground
use the same preview/code composition as Button. Inputs use existing sizes and
states, visible labels, and a 360px maximum example width that shrinks on mobile.

Run `pnpm exec playwright test e2e/input.spec.ts e2e/button-catalog.spec.ts
--workers=2`. Verify validation on blur/submit, clearing errors on editing,
reserved feedback space, native read-only/disabled semantics, search submission,
playground reset, accessible inline code, and no horizontal overflow at 320px.
The Button catalog checks shared code-control alignment and 44px touch targets.

Review the Input section in light and dark themes. The rounded-square icon example
in Icons & Shapes shares the copy control's existing rounded geometry; this adds
no new package shape API. Copy and disclosure controls have equal vertical insets.
Save test results and screenshots in the task receipt. Leave the local server
running when requested by the owner.
