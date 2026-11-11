# Feature verification

Run the public behavior recipes after changing a feature. The repository's
package scripts in [README.md](../../README.md#development) own setup and test
commands. Each recipe names the browser actions and assertions that matter.

- [Private text tours and device login](private-tours.md) — isolated Postgres and
  real-provider preview acceptance are separate gates.

- [Sidebar placement and motion](sidebar.md)
- [Font delivery and application-owned fonts](font-delivery.md)
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
- [Markdown editor](markdown-editor.md) — Markdown editing (blocks, marks, links, and lists), serializer output, whitespace, focus, hydration, and standalone registry installation.
- [Media viewer](media-viewer.md) — image/video dialogs, finite collections, supporting details, and failure recovery.
- [Diff reading](diff.md) — single-file diffs, reading controls, excerpt emphasis, and unavailable states.
- [Visual foundation references](foundation-visuals.md) — Shadows, Spacing, Radius, and the combined Typography page.
- [Button catalog](button-catalog.md) — comparison groups, code disclosures, and retained button interactions.
- [Input catalog](input-catalog.md) — sizes, states, validation, search, and shared code-control spacing.
- [Checkbox catalog](checkbox-catalog.md) — states, selection groups, required choice, and inline code.
- [Radio group catalog](radio-group-catalog.md) — choice states, label colors, validation, and inline code.
- [Card catalog](card-catalog.md) — anatomy, composition, logo showcase, and playground controls.
- [Breadcrumb](breadcrumb.md) — native link/button paths, current semantics, wrapping and focus.
- [Tag button](tag-button.md) — native tag actions, wrapping, and Button state inheritance.
- [Badge catalog](badge-catalog.md) — variants, sizes, icon/shape comparisons, and playground controls.
- [Skeleton catalog](skeleton-catalog.md) — shapes, effects, content geometry, and reduced motion.
- [Data table catalog](data-table-catalog.md) — treatments, density, native-table references, and interactive playground.
- [Node-edge graph catalog](node-edge-catalog.md) — node composition, pulse direction, notebook playback, and shared settings.
- [Kbd catalog](kbd-catalog.md) — keys, chords, sequences, platform notation, and live example markup.
- [Tabs catalog](tabs-catalog.md) — variants including lifted motion, sizes, orientation, disabled selection, and shared playground controls.
- [Dropdown menu catalog](menu-catalog.md) — action states, radio selection, popup configuration, and simulated action feedback.
- [Popover catalog](popover-catalog.md) — anatomy, independent settings examples, placement controls, and focus/dismissal behavior.
- [Tooltip catalog](tooltip-catalog.md) — independent hints, instant groups, placement/timing controls, and reset.
- [Command palette catalog](command-palette-catalog.md) — grouped actions, keyword search, stable result geometry, and shared palette polish.
- [Bottom bar catalog](bottom-bar-catalog.md) — appearances, local utility actions, responsive labels, and playground reset.
- [Manual navigation order](manual-order.md) — alphabetized groups, matching section order, and keyboard/index navigation.
- [Step transition](step-transition.md) — directional ordered content and measured height.

- [Local change tours](local-tours.md): persistent imports, shared evidence, and explicit refresh.
- [Toast](toast.md) — stacked notification feedback, actions, async status, and keyboard access.
