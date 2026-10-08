# Carousel browser verification — 2026-10-07

The isolated carousel PR is based on remote `main` at
`7887339d3d2e865894134d8ff03de2383078b768`. It includes the accepted Rail/Deck
demo because that implementation was absent from the base. Existing local emblem
and sidebar changes are excluded.

## Executed results

The production demo built successfully and its focused suite passed **20 tests,
with 2 intentional input-path skips and no failures or flaky tests**, in desktop
Chromium and 320px mobile WebKit. Run:
`pnpm exec playwright test e2e/carousel.spec.ts --workers=2`.
The verification run also used list/JSON reporters to retain output. Source was
unchanged between those browser checks and the implementation commit.

| Accepted criterion | Actual browser actions | Result |
| --- | --- | --- |
| C4 navigation and focus | Rail/Deck Home, End and arrows; finite disabled boundaries; preview mouse clicks, WebKit touch taps and keyboard activation | Pass; usable focus and only one accessible Deck reading link |
| C4 mouse/touch | Drag over a Rail child link; ordinary link click after Home; trusted Chromium mobile touch swipes through both styles | Pass; suppressed drag navigation, working links and visible card movement |
| C4 motion | Ordinary Next click with reduced motion; frame-stable positions; keyboard navigation with normal motion and visible focus | Pass in both engines |
| C4/C5 responsive accessibility | Both styles in light/dark; viewport reflow, 44px targets; WCAG 2/2.2 AA axe scans including contrast | Pass; no page errors |
| C5 routes | Manual sidebar entry, selected tab URL, reload, legacy version redirects | Pass in both engines |

Full repository `pnpm lint`, `pnpm typecheck`, and `pnpm test` passed;
Vitest reported **126 tests across 28 files**. `git diff --check` passed.
Locked dependencies installed from the existing offline cache. Restricted pnpm
execution initially could not fetch its registry signature metadata; the scoped
approved execution succeeded without changing package-manager settings.

## Reproduced pager fix

The earlier coverage run found that the floating Manual tools panel intercepted
an ordinary desktop Rail Next click. The assertion remained unchanged. Raising
only the carousel page's bottom padding from 40px to 112px lets its pager scroll
above those tools. The regression and the isolated branch's focused suite pass.
Pager screenshots were inspected at desktop and 320px dark Deck and show clear
separation from the floating tools.

The [feature recipe](../carousels.md) provides launch, readiness, drive, expected
outcomes and cleanup instructions. The existing full browser CI discovers these
tests automatically. Theme cases attach 16 overview/pager viewport screenshots;
these are review evidence, not approved image baselines. Local execution logs,
JSON output, screenshots and the earlier red trace are retained with the periodic
run; CI recreates the tests and retains failures through its existing artifact
workflow.

## Limits and cleanup

WebKit skips the desktop mouse-drag test and Chromium CDP touch-movement test.
Its touch taps, keyboard, focus, motion, routes, themes, axe and 320px reflow were
executed. Trusted touch automation is browser input rather than physical hardware.
Physical Safari swipes, Firefox, screen-reader speech, 200% zoom, frame-rate
profiling and approved visual baselines remain outside this focused recipe.
The production harness stopped its owned server. The full browser/registry CI
jobs remain separate release checks; local focused verification does not claim
their results.
