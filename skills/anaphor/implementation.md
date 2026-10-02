# Implementation workflow

## Resolve the consumer setup

Inspect the destination framework, dependencies, `components.json`, CSS entry, and existing Anaphor source before installing anything. Read the upstream README's installation section and `registry.json` for the currently supported path and item names.

- Inside Anaphor's own workspace, use its existing `@anaphor/system` exports.
- In another compatible project, use the documented private shadcn registry and import the resulting consumer-owned files through that project's aliases.
- If Anaphor is already installed, inspect local customizations before updating; a registry reinstall may replace owned source.
- If the framework or styling setup is incompatible, explain the mismatch and agree on an adaptation boundary before adding React/Tailwind infrastructure.

`@anaphor/system` is a private workspace package, not a published npm dependency. Follow the repository's authentication instructions when needed; missing private-registry access is a setup blocker, not a reason to reconstruct components from screenshots.

Done: installed versus missing components, stylesheet integration, font assets, and the supported installation path are accounted for. Verify font licensing before distributing bundled assets in a new product; the font README records provenance, not blanket redistribution rights.

## Implement with owned source

Install only the required registry items unless a full-system install was requested. Confirm imports and props from the installed source rather than copying the demo's workspace imports. Use `registry.json` to distinguish reusable components from demo-local explorations.

Use the shipped stylesheet, semantic utilities, typography roles, and layout bounds. Read component-specific docs for composition contracts such as ButtonLabel, field associations, overlay placement, and theme integration. Preserve the component's keyboard, focus, loading, disabled, and reduced-motion behavior instead of replacing it with a visual approximation.

Keep consumer overrides scoped to the requested project and name them in the handoff. Source-owned installation means later upstream changes require a reviewed update, not automatic synchronization.

Done: the page uses actual installed components and styles; every new local abstraction has a page requirement that the existing API cannot express directly.

## Verify the rendered result

Run the destination's relevant checks from its scripts. Inspect the page with loaded fonts at narrow and wide widths and in each supported theme. Exercise the controls used on the page: focus, keyboard activation, disabled/loading states, validation, and overlay dismissal. Verify reduced-motion handling when the page contains motion.

Check that long text and data do not cause page-level overflow, body text returns to the same track after wide media, and theme-specific surfaces and focus rings remain visible. Separate failures in new work from existing project failures.

Done: report which checks passed and which remain unverified. A successful build alone does not establish visual or interaction parity.
