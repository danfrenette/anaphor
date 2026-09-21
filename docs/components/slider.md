# Slider

Anaphor owns the slider source in `packages/design-system/src/components/slider.tsx`,
its numeric/keyboard helpers in `src/lib/slider-utils.ts`, and its styles in `src/slider.css`.
Import `Slider` from `@anaphor/system` and load the usual Anaphor stylesheet.
The source registry also provides `danfrenette/anaphor/slider` and includes it in `ui`.

`label`, `value`, and `onChange` are required. The inherited DialKit range defaults
are `min=0`, `max=1`, and `step=0.01`; `unit` is optional display content.
`snap="standard"` preserves DialKit dragging and click snapping.
`snap="magnetic"` holds each step until the pointer crosses `releaseThreshold`
toward its neighbor (default 0.6, clamped to 0.5–0.9). Tick marks follow the step
size in magnetic mode. Arrow keys, Home/End, Page Up/Down, Shift+arrows, and Enter
for numeric editing remain available in both modes.

## Upstream provenance and updates

Adapted from [DialKit](https://github.com/joshpuckett/dialkit) npm release **2.0.2**.
The original TypeScript was recovered from that release's `dist/index.js.map`
(`src/components/Slider.tsx`, `src/numeric.ts`, `src/control-keyboard.ts`, and the
`snapToDecile` helper from `src/shortcut-utils.ts`). Slider styles came from
`dist/styles.css`. The MIT notice is retained in `src/licenses/dialkit.txt` and
distributed with the registry item.

Local differences: magnetic detents and step marks; Anaphor light/dark theme
integration and 44px control height; unused global shortcut/panel integration
omitted; pointer capture uses the current control; measurements use ResizeObserver
instead of reading refs during render; editable hover resets in the pointer-leave
handler. DialKit's slider rendering and motion are otherwise retained.

For an upstream update, unpack the target DialKit release in a temporary directory
and compare these source-map entries and slider CSS with release 2.0.2 and our
owned files. Merge relevant fixes deliberately, preserving the local differences
above. Update this provenance version after integrating a release. Run lint,
typechecking, the Slider/DialKit browser tests, and registry consumer verification.
The demo no longer installs or patches the DialKit package.

For consumers updating from **Anaphor's registry**, shadcn supports a preview:

```sh
pnpm dlx shadcn@latest add danfrenette/anaphor/slider --dry-run
pnpm dlx shadcn@latest add danfrenette/anaphor/slider --diff
```

Review and merge the diff; `--overwrite` replaces local files. These commands
compare against Anaphor's published source, not DialKit upstream. The registry
does not automatically merge DialKit releases into this fork. See the
[shadcn CLI reference](https://ui.shadcn.com/docs/cli).
