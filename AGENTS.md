# Agent instructions

- Before changing or reviewing code, read [CODING_STANDARDS.md](CODING_STANDARDS.md)
  and its references for the affected area. For interface work, also read
  [PRODUCT.md](PRODUCT.md).
- For animation additions or changes, follow the property-selection and
  verification steps in [DESIGN.md — Motion](DESIGN.md#motion).
- For setup and check commands, use [README.md](README.md#development). For cloud
  runtimes and browser dependencies, match [.github/workflows/ci.yml](.github/workflows/ci.yml).
- After changing behavior, run the relevant recipes in
  [docs/verification/README.md](docs/verification/README.md).
- Before reporting a PR ready, follow [TESTING.md](TESTING.md#pull-request-review).
  Report executed checks, results, and any blocked or unrun checks.

## Cursor Cloud specific instructions

- The dev server is started on boot at http://127.0.0.1:3000 (`next dev --hostname 0.0.0.0 --port 3000`). If that port is already open, leave the existing process running.
- `pnpm test:browser` builds the demo and serves it on port 3105, separate from the dev server. It needs Playwright Chromium and WebKit; the environment install provides both, with system libraries. CI instead uses the Playwright container image.
- The image Node satisfies the lockfile range `^22.13.0 || >=24`. CI selects Node 24. pnpm is pinned to 10.33.0 in `package.json`.
- Use `agent-browser` 0.39.0 for general UI checks of the running demo. `pnpm test:browser` stays the Playwright regression suite. Workflow: `agent-browser open <url>`, `agent-browser snapshot -i`, then `click` or `fill` by ref (`@e1`). Snapshot again after the page changes, and run `agent-browser close` when finished. The theme control stays disabled until the page hydrates; wait and snapshot again before clicking it.
