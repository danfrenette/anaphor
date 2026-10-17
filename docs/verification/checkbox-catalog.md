# Checkbox catalog

Visit `/#checkbox`. States, Supporting text, Related choices, Required choice,
and Playground use the shared catalog preview and inline code layout. The
required-choice example remains standalone; it does not submit a form or validate
on blur. The mixed-state select-all group retains its existing selection behavior.

Run `pnpm exec playwright test e2e/checkbox.spec.ts --workers=2`. Verify keyboard
and pointer selection, mixed/select-all synchronization, read-only and disabled
states, drag selection, touch targets, playground reset, light/dark contrast and
accessibility, reduced motion, keyboard code disclosure, and 320px overflow.
Review the desktop and narrow layouts in the local preview. Save results in a
receipt and keep the preview server running when requested by the owner.
