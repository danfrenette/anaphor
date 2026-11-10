# Checkbox catalog

Visit `/#checkbox`. States, Supporting text, Related choices, Required choice,
and Playground use the shared catalog preview and inline code layout. The
required-choice example remains standalone; it does not submit a form or validate
on blur. The mixed-state select-all group retains its existing selection behavior.

Run `pnpm exec playwright test e2e/checkbox.spec.ts --workers=2`. Verify keyboard
and pointer selection, mixed/select-all synchronization, read-only and disabled
states, drag selection, touch targets, playground reset, light/dark contrast and
accessibility, reduced motion, keyboard code disclosure, and 320px overflow.
Verify labels switch between muted (unchecked), primary (checked/mixed), and
subdued (disabled) text in both themes, including labels inside FieldContent.
Review the desktop and narrow layouts in the local preview. Save results in a
receipt and keep the preview server running when requested by the owner.

For a native list, run `pnpm test:registry` and inspect the complete UI check.
The installed consumer attaches `useCheckboxPaint()` to the “Installed paintable
choices” ordered list. Drag from “Accept updates” through the disabled “Receive
alerts” row to “Send reminders,” then return to the starting choice and release.
Both enabled choices should be checked and the disabled one should stay unchecked.
Space on “Send reminders” should then clear just that choice. The registry runner
owns its temporary consumer, loopback server, and Chromium session.

Run `pnpm exec vitest run packages/design-system/test/checkbox.test.tsx` for
ref forwarding, consumer pointer veto, and native-list keyboard activation.
