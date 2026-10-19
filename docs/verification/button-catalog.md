# Button catalog

The Button section at `/#button` exposes variants and tones, sizes, icons and
shapes, states, hold-to-delete, and a compact playground. Each reference group
has an accessible code disclosure and copy control. Controls keep the existing
playground settings and reset behavior. The sidebar wordmark uses the shared
heading font at its existing size.

Run `pnpm exec playwright test e2e/button-catalog.spec.ts e2e/hold-button.spec.ts
e2e/dialkit.spec.ts e2e/manual.spec.ts --workers=2`. Review the light/dark desktop
and 320px layouts, keyboard disclosure and copy, reduced motion, independent
loading actions, hold cancellation/completion, and existing button snapshots.
The whole-manual suite also checks unrelated components; record those failures
separately instead of suppressing their assertions.

Keep the local preview server running when requested by the owner. Save browser
results and screenshots under test-results or the task's temporary output folder.
