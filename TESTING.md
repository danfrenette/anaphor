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

Button is installed alone so the complete UI cannot hide its missing dependencies.
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
