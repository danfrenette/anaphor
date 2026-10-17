# Feature verification

Run the public behavior recipes after changing a feature. The repository's
package scripts in [README.md](../../README.md#development) own setup and test
commands. Each recipe names the browser actions and assertions that matter.

- [Private text tours and device login](private-tours.md) — isolated Postgres and
  real-provider preview acceptance are separate gates.

- [Sidebar placement and motion](sidebar.md)
- [Workspace shell composition](workspace-shell.md)
- [File-upload selection and independent progress](file-upload.md)
- [Rail and Deck carousels](carousels.md) — Chromium and 320px WebKit; trusted swipe coverage uses Chromium CDP. Physical touch and WebKit swipe movement remain outside the automated harness.

For a browser run, build and start the Reference manual through the Playwright
configuration in `playwright.config.ts`. Check that the target responds at
`http://127.0.0.1:3105/` before driving it. Keep Playwright traces and test
output under `test-results/` until the result is recorded, then stop only the
server started by that run.

- [Collapsible sections](collapsible.md)
- [Agent-built consumer interfaces](agent-consumer.md) — fresh-agent evaluation of the reusable design skill; local registry transport does not cover GitHub authentication or the published branch.
- [Visual foundation references](foundation-visuals.md) — Shadows, Spacing, Radius, and the combined Typography page.
- [Button catalog](button-catalog.md) — comparison groups, code disclosures, and retained button interactions.
