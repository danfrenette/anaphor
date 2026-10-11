# Applying Anaphor through shipped contracts

An agent building a consumer interface now has an explicit map from each decision
to its Anaphor owner. It can find exact tokens, supported props, interaction
behavior and installation files while preserving the consumer's existing source.
This implements [ANAPHOR-253](https://linear.app/anaphor/issue/ANAPHOR-253/agents-need-consistent-anaphor-guidance-when-building-consumer).

The implementation is
[`9f900a0`](https://github.com/danfrenette/anaphor/commit/9f900a0f62d8704f5071971c2913052f0641c17a),
reviewed from baseline/target/merge-base
[`176494b`](https://github.com/danfrenette/anaphor/commit/176494b221093e446897e407c31ea25d014d119a).
Both evaluated consumers used the same frozen upstream
[`d6de71b`](https://github.com/danfrenette/anaphor/commit/d6de71b6c868a43ab0a7888b86398f5580bd3fd6),
which includes the shared design-guidance correction. Later changes affect
documentation and the reusable consumer skill; shipped components are unchanged.

## From source discovery to a working page

The [consumer skill](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/skills/anaphor/SKILL.md)
directs intent questions to PRODUCT/DESIGN, exact values to shipped CSS, API and
behavior questions to source/prop contracts, and installable files to the registry.
Installed consumer source owns local customizations. A discrepancy is reported
against those owners rather than resolved by inventing another token catalog.

For the evaluated Profile settings page, the
[implementation branch](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/skills/anaphor/implementation.md)
leads the agent through setup, selected installation and actual component types.
Both agents used Text roles, explicit Input/Button configuration, ButtonLabel,
independent tone/variant and integrated loading. Prose was unnecessary for this
interface; article composition was not exercised. The seeded Button customization
survived byte-for-byte.

The form owns validation and a simulated save timer. Blank submission focuses
Display name and associates error feedback; editing clears the feedback. Saving
retains the Button's focus and accent color while blocking repeat activation.
Selecting Disable saving during the operation adds the neutral disabled treatment
without removing the spinner. These responsibilities follow the shipped
[Button contract](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/packages/design-system/src/components/button.tsx).

[DESIGN](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/DESIGN.md)
now describes supported soft buttons and MorphSurface's 270ms opening/200ms
closing geometry. The same motion paragraph agrees with the actual view
transition and immediate reduced-motion behavior; broader geometry documentation
remains a follow-up.

## Comparison receipt, October 11, 2026

The [verification recipe](../verification/agent-consumer.md) preserves the task
and inspection procedure. Two fresh sessions received the same brief, frozen
source, seeded React/Vite/Tailwind consumer, tools and inherited model/reasoning
settings, with no overrides or parent conversation. Only the supplied skill
differed. The host did not expose an exact model identifier in the receipt.
Each session owned a separate consumer; the root verifier owned browser sessions.

Both used the real pinned shadcn 4.21.0 installer for Checkbox, Text, Input,
FieldFeedback/Field and Theme. Same-registry dependency addresses were redirected
to frozen local JSON; this exercises source transformation and installation but
does not establish private GitHub authentication or published-branch availability.

| Observed boundary | Current skill | Candidate skill |
| --- | --- | --- |
| Consumer typecheck and production build | Pass | Pass |
| Selected installed source, one stylesheet import, loaded Inter/Bell Gothic/Magda | Pass | Pass |
| Explicit APIs, typography roles, existing Button customization | Pass | Pass |
| 320px/1280px, light/dark, long field value without page overflow | Pass | Pass |
| Keyboard validation/save, focus/color retention, repeat blocking, combined disabled/loading | Pass | Pass |
| Theme persists through reload; reduced-motion rotation stops | Pass | Pass |
| Browser errors / failed requests; invented shared APIs or tokens observed | 0 / 0; none | 0 / 0; none |

The candidate explicitly consulted prop contracts and reported additional stale
README guidance. Neither generated page needed a compilation correction. The
outcomes do not establish a reliability improvement from one pair.

Both agents recovered the same installer DNS failure by rerunning the same
command with network access. The root initially copied installed pnpm dependency
trees whose absolute links loaded duplicate React instances; both first browser
runs failed. Independent frozen-lockfile installs and rebuilds repaired that
fixture mistake without editing authored consumer source. A subsequent disabled
color assertion sampled an unfinished CSS transition while the browser clock was
paused; resuming real time and waiting for final CSS resolved that verifier
error. Failed attempts, successful assertions, screenshots, traces and source
hashes were retained in evaluation scratch; generated consumers are disposable
and are not part of the product diff.

Measured field-label contrast was 17.35:1 in light and 17.49:1 in dark, in both
arms. Solid-accent Button labels measured 3.75:1 and 3.38:1 respectively, using
browser computed colors converted to sRGB. Those normal-text ratios remain below
AA under the existing [approved exception](../foundations.md#contrast).
This is not a blanket accessibility certification.

Both generated lockfiles have SHA-256
`b39e7b306e23b44d9030ea57d10bfe31b9aed03444a4bc48810be9bf5a539532`.
The seeded and final Button hash is
`4ceab22060ecd22d489b52bca1e720f877d14191b0fb9d488db6149d072b78bd`.
Resolved dependencies matched: React 19.2.8, Base UI 1.9.0, cn 0.4.0,
motion 14.1.0, next-themes 0.4.6, Vite 8.2.2 and Tailwind 4.3.3.
The disposable consumers used pnpm 11.22.0; repository checks used pinned
pnpm 10.33.0. A used npm and B pnpm for the identical tsc/Vite build script.

## Guidance disposition and follow-ups

| Guidance | Disposition and evidence |
| --- | --- |
| Soft/MorphSurface documentation alignment | Keep: agrees with component source; applied equally before the comparison. |
| Source-owner map and discrepancy handling | Keep: candidate found the prop-contract owner and preserved actual APIs; no observed regression. |
| Explicit configuration, ButtonLabel, tone/variant and loading guidance | Keep: generated call sites and browser states satisfy those contracts in both arms. |
| Task-specific state and edge-case inspection | Keep: exercised validation, long values, loading, disabled, themes and motion. |
| Conditional reference-page do/don't and pinned-state advice | Withhold: neither run built a reference page. Removed before the final skill commit. |

The supplied candidate implementation guide therefore differs from the final
guide only by that removed conditional advice. Its initial SHA-256 was
`f04bf3c8b75102d97cb38639a7ca9db15e48f04d12cd4628f5abc08844087299`;
the promoted guide is
`404067833ee3d131da213a7fc5e1fab9c2c34bb917025142f322877d8d572951`.
No reference-page outcome is claimed for the promoted guide.

Bounded follow-ups retain their source owners:

- [README](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/README.md)
  describes an Input size default and FieldFeedback/Checkbox animation absent
  from their shipped contracts. README/Architecture and adjacent Design prose
  retain older MorphSurface geometry/structure.
- [Button source](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/packages/design-system/src/components/button.tsx)
  retains a 200ms opacity-only loader fade under reduced motion although prose
  says spinner transitions stop. Rotation and spatial movement do stop.
- [Registry](https://github.com/danfrenette/anaphor/blob/9f900a0f62d8704f5071971c2913052f0641c17a/registry.json)
  omits Checkbox from Field's dependencies despite its source import, and includes
  unused motion for FieldFeedback. Both consumers selected Checkbox explicitly;
  standalone Field installation is not proven by this pair.
- Manual state examples, do/don't comparisons and shared form compositions remain
  candidates for a separate task. No preset replacement, catalog expansion or
  benchmark framework was introduced.

## Repository gate receipt

The root verifier ran lint, typecheck, installer smoke checks, Vitest, production
browser coverage and independent registry consumers. Missing locked dependencies
were restored with a frozen install, and stale generated Next dev types were
moved aside. No package, lockfile or runtime-source repair was committed.

Lint/typecheck passed; installer smoke passed 3 tests; Vitest passed all 133 tests
in 29 files with two workers. The initial unrestricted concurrent unit run had
four failures. The full production browser run built successfully and passed
276 cases with 30 configured platform/capability skips and four failures; all
four passed `playwright test --last-failed --workers=2` after other jobs ended.
The combined browser coverage is 280 passed, not a single clean full run. Registry
Button and complete-UI installation/build/interaction/theme/font checks passed.

These checks apply to unchanged executable source through `9f900a0`; this
walkthrough adds explanation only. Standards and Spec review results are recorded
in the draft PR. Principles and runtime risk passes are not applicable to this
internal documentation/agent-instruction change. Reviewers should examine the
bounded evidence and remaining source/prose gaps before choosing broader manual
work or claiming general agent reliability.
