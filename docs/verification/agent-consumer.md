# Agent-built consumer interfaces

## Outcome and entry points

A fresh agent uses the [reusable design skill](../../skills/anaphor/SKILL.md)
to build a settings page in an independent consumer. Installed source and
documented APIs govern the result; a consumer's existing Button customization
survives. This is the public behavior boundary for
[ANAPHOR-253](https://linear.app/anaphor/issue/ANAPHOR-253/agents-need-consistent-anaphor-guidance-when-building-consumer).
The entry point is the consumer's `/` page, not a new route in the manual.

## Prerequisites and launch

Follow [repository setup](../../README.md#development) and the
[registry-consumer procedure](../../TESTING.md#registry-consumers). Use the
existing `test/registry-consumer` React/Vite/Tailwind fixture and real pinned
installer from `node_modules/shadcn/dist/index.js`. Do not install the private
workspace package into the consumer. Browser checks use the repository's
installed Playwright Chromium.

Keep the evaluation in an OS temporary directory outside the workspace.
Record the source revision, skill contents/hashes, brief, initial fixture,
dependency lockfile, agent model/settings, and available tools before starting.
For a comparison, give fresh agents the same inputs and disjoint copies of
the same seed; vary only the supplied skill. Apply shared documentation
corrections before freezing the source for both runs.

From the prepared repository root, freeze the committed source and build registry
item JSON with the pinned installer:

```sh
task_dir="$(mktemp -d "${TMPDIR:-/tmp}/anaphor-consumer.XXXXXX")"
installer="$(pwd)/node_modules/shadcn/dist/index.js"
mkdir "$task_dir/upstream"
git rev-parse HEAD > "$task_dir/SOURCE_REVISION.txt"
git archive HEAD | tar -x -C "$task_dir/upstream"
(cd "$task_dir/upstream" && node "$installer" build registry.json --output "$task_dir/registry")
```

Record `task_dir` in the brief. Capture the supplied skill variants separately,
including any uncommitted candidate. Redirect only
same-registry dependency addresses to those local JSON files, using the
`prepareRegistry` procedure in [the existing verifier](../../scripts/verify-registry.mjs).
Keep file targets, source and npm dependencies unchanged. Document this
transport substitution; it does not verify private GitHub access or the
published branch.

Initialize the seed using the fixture setup in the existing verifier, then install
Button with `node "$installer" add "$task_dir/registry/button.json" --cwd "$task_dir/seed" --yes`.
Add a consumer-owned
`data-consumer-button="settings-v1"` attribute beside its `data-slot="button"`
and capture the file's SHA-256. Clone the initialized fixture and lockfile for each run, then install each
copy independently with `pnpm install --offline --frozen-lockfile --ignore-workspace`
when the packages are already cached. Do not copy an installed pnpm dependency
tree: absolute links can point to the seed and load two React instances. Give each agent the selected skill directory, frozen
upstream source location, local registry transport instructions, and its own
consumer directory. Let it install only missing items.

Run each consumer's `pnpm run build` after generation. Serve its production
`dist` on an owned loopback port with Vite preview or the existing verifier's
static-server procedure. Wait for the page to load before driving it.

## Doctor

Confirm the source revision matches the frozen snapshot and the recorded skill
hash matches the supplied files. Check the consumer has `components.json`,
installed source, a single Anaphor stylesheet import, its retained application
CSS, and no `@anaphor/system` dependency. Read the selected component types and
check the seeded Button hash again. Record actual resolved dependencies and
environment differences rather than assuming declared versions were installed.

## Drive and assertions

Use this same brief in both runs: build a compact Profile settings page with a
**Display name** field initially containing **Dan Frenette**, helper text,
**Save changes**, a **Disable saving** checkbox, and Light/Dark selection
remembered across reload. Saving simulates 1.5 seconds then reports **Saved**.
A blank name reports an error on blur or submit; editing clears the feedback
until the next validation. Preserve the seeded Button file byte-for-byte.

Inspect source and drive actual controls with role/name or label locators:

1. Confirm selected items were installed with the real installer. Typecheck
   and build pass; fonts load without failed requests or browser errors.
   Typography and surfaces use shipped roles, not invented tokens/APIs.
2. Clear Display name and blur it. Confirm error feedback is associated with
   the field. Type a valid name; feedback clears while editing.
3. Activate Save changes with the keyboard. Loading blocks another save,
   retains focus and action color, then reports Saved. Toggle Disable saving
   while loading: the spinner remains and the explicit disabled treatment is
   neutral. When saving finishes, disabling still blocks activation.
   If a browser clock controls the 1.5-second timer, resume real time before
   checking CSS transitions and wait for their final computed state.
4. Change the theme, reload, and confirm the selected theme remains. Inspect
   text, controls, surfaces and focus in both light and dark modes.
5. At 320px and 1280px, confirm usable fields and no page-level horizontal
   overflow. Exercise Tab, Space and Enter without losing access to controls.
6. Enable reduced motion and repeat saving. Spinner rotation and spatial
   transitions stop; loading, disabled state and completion still work. Record
   the shipped loader's retained opacity-only fade as a known prose/source
   discrepancy rather than rewriting the component during this evaluation.
7. Inspect long field values and feedback for wrapping/clipping. Confirm the
   seeded customization is present in the rendered Button and its source hash
   is unchanged. Inspect required configuration, `ButtonLabel`, independent
   tone/variant and integrated loading in the generated call sites.

Measure contrast over the actual surface. Preserve the documented
[orange-label exception](../foundations.md#contrast); report its measured
status without calling it AA-compliant. Visual state simulations do not prove
real focus or keyboard behavior.

## Evidence, disposition and cleanup

Retain the brief, supplied skill hashes, generated source hashes, agent command
logs, build output, screenshots, browser assertions, and each run's report in
scratch until their result is summarized in the delivery walkthrough. Record
passes/failures, invented APIs/tokens, manual corrections, checks not run and
environment differences. Compare before repairing outputs; distinguish an
agent's own corrections from verifier changes. A single pair is exploratory
evidence, not a general reliability benchmark.

Recommend keep, revise or reject for each guidance change. Withhold regressions
or unexercised guidance from promotion. Record missing manual state examples,
do/don't comparisons or shared compositions as bounded follow-up candidates.
Stop only this run's servers and browser contexts after capturing evidence.
Remove only owned disposable state when evidence has been retained; never
update or remove the user's application or personal skill installation.
