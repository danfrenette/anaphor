# Feature verification

Run the public behavior recipes after changing a feature. The repository's
package scripts in [README.md](../../README.md#development) own setup and test
commands. Each recipe names the browser actions and assertions that matter.

- [Sidebar placement and motion](sidebar.md)

For a browser run, build and start the Reference manual through the Playwright
configuration in `playwright.config.ts`. Check that the target responds at
`http://127.0.0.1:3105/` before driving it. Keep Playwright traces and test
output under `test-results/` until the result is recorded, then stop only the
server started by that run.
