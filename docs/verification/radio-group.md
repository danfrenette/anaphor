# Radio Group

Outcome: choose one notification frequency with labels, pointer/touch, or keyboard;
submit exactly that enabled value. Descriptions belong to options and validation
belongs to the group. Requirements:
[ANAPHOR-234](https://linear.app/anaphor/issue/ANAPHOR-234/radio-group).

Entry points: `/#radio-group`, public RadioGroup/Radio/FieldItem exports, and source
registry `radio-group`/`ui`. No account or external data is needed. Follow
[repository setup](../../README.md#development) and the [browser procedure](README.md).
Record revision/local changes. Playwright builds this checkout and starts its
owned server on port 3105.

```sh
pnpm exec vitest run packages/design-system/test/radio-group.test.tsx
pnpm exec playwright test e2e/radio-group.spec.ts --workers=2
pnpm test:registry
```

Package tests import only from `@anaphor/system`: label activation, native FormData,
arrows and Tab, controlled values, descriptions, disabled/read-only, and Field
validation. The public type fixture runs through `pnpm typecheck`, protecting
generic values, callbacks, refs, render composition, and FieldItem orientation.

The browser recipe runs desktop Chromium and 320px WebKit. Daily digest starts
selected in Notification preferences. Choose Weekly digest, ArrowUp to Daily
digest, then save: status says "Saved: Daily digest." Submit the required example
without a choice: the group becomes invalid and shows "Choose a notification
frequency." Select and save: the error clears and the example confirms saving.
In Digest availability, arrows skip Every update. Fixed frequency retains its
selection; Unavailable frequency is skipped by Tab.

Open Radio group controls, select Invalid, and Reset controls: Daily digest and
valid state return. Browser checks cover visible focus, 20px geometry, expanded
44px minimum target, clickable label gap, light/dark axe scans, narrow reflow,
and reduced motion. Review `radio-light.png` and `radio-dark.png` in test output
for dot, boundary, focus, supporting-text alignment, and wrapping. Also check
200% zoom and forced colors when changing geometry/palette. Physical-device
touch and assistive-technology announcements remain manual coverage.

The registry gate installs fresh complete-UI source with real shadcn, builds an
independent consumer, activates Weekly digest by label, confirms exclusive
selection and its submitted native value, and checks Daily digest's description.
Independent Button installation remains separate. This recipe does not claim
independent installation coverage for every item.

Retain revision-bound results in the delivery walkthrough. Playwright keeps
failure traces/screenshots under `test-results/`; preserve them before another
run replaces the directory. Registry success removes temporary consumers;
failure retains them. The harness stops only its owned server. Reload and Reset
reset examples; persistence across reload is outside the component contract.
