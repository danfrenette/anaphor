# Button catalog: animation opportunities

Read-only pass using find-animation-opportunities, 2026-10-17. Scope: the cleaned
Button catalog, inline code, playground, loading and hold examples. No new motion
was implemented from this report.

## Recon and sweep

React/Next.js with shared Anaphor Button, HoldButton, Collapsible, CardCopyButton,
and MorphSurface. The manual is a functional reference for repeated comparisons.
Shared CSS owns `--anaphor-ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and the 200ms
standard duration. Button already has 125ms press feedback, spinner transitions,
and reduced-motion handling. Copy confirmation and disclosure motion already exist.

Frequency estimates are inferred from the task, not usage telemetry: comparisons
and controls are repeated within a session; code disclosure and copying are
occasional; hold completion is occasional and supports keyboard input.

Sweep coverage: press feedback is present; loading, code disclosure, and copy
confirmation already bridge state changes; the playground already uses the shared
floating surface; comparison grids are static; no draggable elements, inserted
lists, onboarding, or first-run celebrations exist here. Hold completion replaces
the action with an explicit status and Restore item.

## Opportunities

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |

None survived the gate. Existing motion is context for the sweep, not an animation
review or a request to change those implementations.

## Rejected candidates

- `apps/demo/app/button-demo.tsx:26` — stagger the variant rows on entry.
  Rejected at Purpose: decorative staging does not explain a comparison. It also
  fails Function: the examples should be available together for inspection.
- `apps/demo/app/button-playground.tsx:52` — animate between variant, tone and size
  choices beyond the shared button behavior. Rejected at Frequency for keyboard
  selection and Function for repeated comparison: additional motion obscures the
  selected result.
- `apps/demo/app/button-demo.tsx:133` — add a second entrance to revealed code.
  Rejected at Frequency for keyboard disclosure. For pointer disclosure, rejected
  at Function: shared Collapsible already establishes the change, and moving code
  would delay reading.
- `apps/demo/app/button-hold-example.tsx:10` — celebrate deletion with a bounce or
  stagger. Rejected at Frequency for keyboard completion and Purpose for delight:
  an occasional destructive demo is not a rare celebratory event. The existing
  hold progress supplies feedback; the completion message should remain direct.

## Verdict

No additional motion is needed. The highest-value decision is to retain the
existing feedback and keep comparisons still. This skill's rejection gate was
useful; its absolute frequency categories should be treated as hypotheses until
there is usage evidence. Its transform/opacity-only reporting rule also conflicts
with its height and clip-path examples, which could confuse a future handoff.
No handoff is warranted now. If a specific gap is later observed, use
`improve-animations plan <suggestion>` to develop it before implementation.
