# Testing

## Goal

Tests provide confidence that the system works for consumers. Protect observable
behavior and public types, not implementation structure. The closer a test is to
real use, the more confidence it should provide.

## Testing Trophy

Invest most coverage in component integration tests. Use static analysis
everywhere, focused unit tests for isolated logic, and a small number of browser
tests for critical cross-layer behavior.

- Static: TypeScript strict mode and ESLint run across every workspace.
- Unit: pure utilities with meaningful branching or edge cases.
- Integration: components rendered with Testing Library and operated as users
  operate them.
- End to end: representative package-to-browser flows in Playwright.

Do not chase coverage percentages. Do not test private state, internal class
names, component trees, hook calls, or implementation-specific timing. Avoid
broad snapshots and mocks when semantic queries and real behavior are practical.

## Type Contracts

The TypeScript compiler is the primary type test. Public API fixtures import only
from `@anaphor/system` and use `expectTypeOf` for important inferred
results. Use `@ts-expect-error` for intentionally rejected consumer code so the
test fails if the error disappears. Do not duplicate runtime assertions as type
tests or assert obvious annotations.

## Component Tests

Query by role, accessible name, label, and visible text. Use `user-event` for
complete interactions rather than dispatching low-level events. Assert what a
user can observe: rendered content, focus, accessible state, enabled state, and
resulting behavior.

Prefer rendering the real component with real collaborators. Mock only network,
time, randomness, or an unavailable boundary, and keep the mock at that boundary.
Each regression test should describe the behavior that failed, not the function
that was changed.

## Risk Levels

### Foundations

Require strict type checking, linting, production build, package-consumer smoke
coverage, contrast checks, representative light and dark visual baselines, and
narrow-viewport review.

### Static Components

Add semantic rendering, accessible-name, package-export, theme, responsive, and
representative visual checks. Skip interaction tests when no interaction contract
exists.

### Interactive Components

Add user-level behavior, keyboard operation, focus management, disabled and
loading states, reduced-motion behavior, touch behavior, theme parity, viewport
coverage, automated accessibility, and visual state matrices.

## Browser Coverage

Playwright verifies behavior that a DOM test cannot prove reliably: real focus
order, browser layout, theme rendering, responsive reflow, reduced motion, and
package integration in the built demo. Keep flows independent and
deterministic. Use role-based locators and wait for observable states rather than
fixed delays. The browser command builds and serves the production demo on
port 3105, separately from the development preview.

Visual baselines use approved defaults and cover representative states rather
than every permutation. Experimental demo controls reset before capture. Button baselines cover
unconfigured defaults and destructive actions in both themes. Review image
changes before accepting updated baselines.

## Registry Consumers

`pnpm test:registry` exercises source installation independently of the workspace
package. `scripts/verify-registry.mjs` builds the current registry with shadcn,
redirects same-registry dependencies to those local item files, and installs into
fresh copies of `test/registry-consumer/` in the OS temporary directory. The
fixture supplies only React and its TypeScript/Vite/Tailwind build environment;
the registry must supply its own runtime dependencies and source imports.

Button and Diff are each installed alone so the complete UI cannot hide their missing dependencies.
A separate complete-UI install compiles every installed module and renders each
advertised UI item. Chromium checks activation, input/checkbox behavior, opening
the surface, generated Button dimensions, theme tokens, both font loads, and
browser loading errors. These checks complement the existing package integration
and reference-manual browser tests.

This is a representative installation gate, not an exhaustive per-item matrix:
independent installation of the other items, alternative aliases, Server Component
consumption, GitHub credentials, and remote branch availability remain outside
this check. Install Chromium with `pnpm exec playwright install chromium` on new
machines. Package-registry access is required; dependencies declared by registry
items intentionally resolve as in a new consumer. Failed temporary consumers
retain their resolved lockfile and build output for diagnosis.

## Accessibility

The release bar is WCAG 2.2 AA: semantic names and roles, complete keyboard
operation, visible focus, 320px reflow, 200% zoom support, intentional reduced
motion, and 44px touch targets where touch use is expected. Automated axe scans
supplement but never replace keyboard, screen-reader, touch, theme, zoom, and
motion review.

## Release Gate

Lint, strict type checking, integration tests, browser smoke tests, registry
consumer verification, and the production demo build must pass. No known high-severity accessibility defect
may ship. Deferred coverage is recorded against the component ticket rather than
hidden in the suite. The documented accent-solid contrast exception applies
only to color-contrast checks on those controls; all other rules still run,
and correcting that contrast must not cause a test failure.

## Continuous Integration

`.github/workflows/ci.yml` runs on pull requests targeting `main`, pushes to
`main`, and manual dispatch. Three independent jobs report on the PR:

- **Code quality**: lint, strict types, and integration tests.
- **Demo browser tests**: production build and the full Chromium/WebKit suite.
- **Registry consumers**: fresh independent Button and complete-UI installations.

**Private tour browser tests** additionally runs the tour suite against an isolated
Postgres service, with supported Better Auth migrations and fictional identity
sessions. It builds the application and exercises private publication, reading
and device approval in Chromium/WebKit. It does not prove real OAuth-provider or
deployed-domain acceptance; that separate gate is in
[private tours](docs/verification/private-tours.md).

The jobs use Node 24 and the pnpm version in `packageManager`. Dependencies install
with the frozen workspace lockfile. Only the pnpm download store is cached;
registry consumer installations and checks execute on every run. Superseded runs
are canceled. Workflow permissions are read-only.

Browser jobs use `mcr.microsoft.com/playwright:v1.63.0-noble` on Linux x86-64.
Update that image and the exact `@playwright/test` dependency together. CI uses
two workers, allows 60 seconds per test for slower browser/accessibility checks,
allows 15 seconds for individual assertions, rejects focused tests, and retries
a failing browser test once. Geometry tests pause and seek browser animations;
interruption tests reverse when the browser creates the closing animation,
before it can finish, without relying on a particular rendering frame rate.
The `playwright-report` artifact includes the HTML report, failure screenshots,
and traces; download it and run `pnpm exec playwright show-report <report-path>`.
Failed registry consumers are uploaded separately without their node_modules.

Linux screenshots are separate from the macOS baselines. Generate and review
Linux baseline changes inside the same pinned image; never automatically accept
screenshots during a normal CI run. A missing or changed baseline must fail.

When repository branch protection is available, require **Code quality**,
**Demo browser tests**, and **Registry consumers** on `main`, with the branch
up to date before merging. GitHub currently rejects branch protection for this
private repository with “Upgrade to GitHub Pro or make this repository public”.
Until that account capability changes, check all three results before merging;
the workflow alone does not prevent a merge.

The Vercel project `danrfrenettes-projects/anaphor` is connected to this GitHub
repository. Its Next.js root is `apps/demo`, Node is 24.x, and access to files
outside the root is enabled for the shared workspace package. `main` deploys to
https://anaphor.vercel.app; branches receive preview deployments linked from PRs.
Keep validation in GitHub Actions; the Vercel Git integration handles deployments.


## Pull request review

Before reporting a PR ready, fetch its actual target branch and record the base,
head, and merge-base revisions. Review the full three-dot diff and commit list
against that target, including inherited commits; a feature's starting checkout
is not a substitute for the PR baseline. Remove unrelated changes from the final
diff or document an explicitly accepted dependency.

Check mergeability against the fetched target. After integration or conflict
resolution, run the release gate on the resulting code and repeat the affected
review. Recheck the remote PR head before reporting; additional changes require
review of that delta. The receipt records commands, outcomes, and the revisions
they establish, with unexecuted checks called out explicitly.
