# Radio group catalog

Visit `/#radio-group`. Review States, With supporting text, Required choice,
Unavailable option, and Playground. Each reference example has inline code.

Run `pnpm exec playwright test e2e/radio-group.spec.ts e2e/checkbox.spec.ts --workers=2`.
Verify label and arrow-key selection, required submission and focus recovery,
disabled-option skipping, read-only selection, control reset, and native form values.
Check selected/primary, unselected/muted, and disabled/subdued labels in both themes,
including FieldContent labels. Group headings and descriptions retain their colors.
Inspect narrow reflow, code disclosure, focus, forced colors, and touch targets.
