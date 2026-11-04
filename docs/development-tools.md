# Optional development tools

Core setup and checks are in [Development](../README.md#development).
These tools are optional and are not prerequisites for contributing.

## Impeccable

If you use the Impeccable Codex plugin, use it for interface work in `apps/demo` and
`packages/design-system`. Both targets inherit the root `PRODUCT.md` and
`DESIGN.md`; exact runtime values remain owned by the package CSS.
Code-first is the saved default in the root and each target's
`.impeccable/config.json`. These configs enable design checks from the
Impeccable plugin's bundled hook. In the interactive Codex CLI, review and
trust the plugin hook with `/hooks` if prompted; `/hooks` is not a desktop-app
slash command.

Name the target in requests, for example:

- `Use Impeccable to audit apps/demo.`
- `Use Impeccable to polish packages/design-system/src/components/button.tsx.`
- `Start Impeccable live for apps/demo.`

The manual's live configuration targets `app/layout.tsx`. Live mode uses the
running Next.js app to preview component-library changes. Local consent,
detector caches, and live session state are gitignored; shared configuration
can be committed with the project.

## Cursor Cloud

If the environment starts the dev server on boot at `http://127.0.0.1:3000`,
reuse it; leave an existing process running. Browser regression tests build
and serve the demo separately on port 3105. Match runtime and browser versions
to [CI](../.github/workflows/ci.yml), rather than maintaining a second version list.

For exploratory UI checks in a configured Cursor environment, use `agent-browser`
0.39.0: open the URL, run `snapshot -i`, and click or fill by ref (`@e1`).
Snapshot again after page changes, and run `agent-browser close` when finished.
Wait for hydration before clicking the theme control. The Playwright suite
remains the regression check.
