# Collapsible playground verification — 2026-10-14

Spec: [ANAPHOR-258](https://linear.app/anaphor/issue/ANAPHOR-258/remove-out-of-place-dropdown-example).
Base/fetched main: `14d85d9223072aca20c8ba2cf5ce2d15fd508d8a`.
Implementation: `be74925980b4f08c9098da9e7d385be18133921c`; reviewed neutral
feedback correction: `1eed1db2942b29fc4631735b39371993cfedb975`.
Reviewed macOS baseline update: `edc77938db923c5501af6eecb5af53a94486afcf`.
Host: macOS, Node 26.7.0, pinned pnpm 10.33.0, Playwright 1.63.0.

| Check | Observed result and provenance |
| --- | --- |
| `pnpm lint` | Pass on isolated implementation; scoped SourceOutline lint repeated after correction. |
| `pnpm typecheck` | Pass; full check repeated on corrected implementation. |
| `pnpm exec vitest run --maxWorkers=2` | 164 passed, one skipped, 33 passing files on corrected implementation. Initial concurrent default-worker attempt hit timeouts and was stopped; bounded recovery passed. |
| `pnpm test:browser` | Production build passed; complete 356-case public suite ran on initial isolated implementation: 310 passed, 43 explicit skips, three failures. |
| Final focused strict browser run | 14 passed on corrected implementation plus reviewed baselines, covering source outline, light/dark wrapping, sidebar search, reference-card link, Badge and Showcase. |
| `pnpm test:registry` | Button and complete-UI fresh installations, types/build, Chromium interactions, themes and fonts pass. Registry source is unchanged by later demo-only correction and snapshot/documentation commits. |
| Independent production navigation | Desktop 1280px/light and mobile 320px/dark sidebar entry and search result pass; drawer closes, global navigation has no embedded outline or Studies, selected row has contrasting neutral fill/no left border, no page errors. |
| Impeccable detector | No findings on changed UI targets. Source feedback issue separately found by Principles review and corrected. |
| `git diff --check` | Pass. |

The final focused command was:

```sh
pnpm exec playwright test e2e/collapsible.spec.ts e2e/badge.spec.ts e2e/command-palette.spec.ts e2e/manual.spec.ts --grep 'source outline|outline wraps|badges remain|sidebar search opens|showcase previews|reference card links' --workers=1
```

The mobile command-search focus check passed on a fresh one-worker build.
Badge and Showcase remained visually unchanged but had stable one-pixel screenshot
crop differences after preceding manual copy/layout changed. Actual, expected and
diff images were inspected, then exactly three macOS mobile PNGs were regenerated
and the normal strict checks passed. No screenshot tolerance or assertion was relaxed.
Linux images were not regenerated locally; CI remains the Linux verification owner.

Before implementation, the relocated outline recipe failed at the missing new
route, and the retirement recipe observed the old Studies overview still served.
The affected integrated primary-checkout run subsequently passed 79 checks with
five explicit skips. Isolated checks above establish delivery provenance separately
from unrelated existing primary edits.

Fresh review axes: Standards, Spec and Execution had no actionable findings;
Principles identified one selection-background issue, fixed and rereviewed.
Security/concurrency/performance passes are inapplicable to this navigation/demo
retirement. Compatibility accounts for intentionally retired Study URLs returning 404.

No physical-device touch, local Linux image execution, merge or deployment claim.
The native browser Find distinction remains in the Collapsible recipe. Owned browser
servers were stopped by the test harness. Documentation/snapshot-only commits retain
application evidence above; executable behavior is pinned at `1eed1db`.
