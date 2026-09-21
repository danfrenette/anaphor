# DialKit slider detents

`dialkit@2.0.2.patch` adds two opt-in props to the React Slider:

- `snap="standard" | "magnetic"` (default `standard`).
- `releaseThreshold` (default `0.6`, clamped to `0.5–0.9`).

Magnetic mode holds the current step until the pointer passes the configured
fraction toward its neighbor. The fill follows the snapped value, clicks select
the nearest step, and tick marks represent actual steps. Standard behavior,
keyboard/numeric editing, rendering, and all DialKit styles remain upstream.

Both published JS entry points and their declarations are patched. pnpm applies
the patch on install through `patchedDependencies` in `pnpm-workspace.yaml`.
This extension is local to the demo dependency, not an upstream DialKit API.
When upgrading DialKit, recheck both modes with `e2e/slider.spec.ts` and preserve
its original appearance rather than introducing a separate slider renderer.
