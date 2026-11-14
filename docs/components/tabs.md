# Tabs

Switch between related views while keeping their shared context in place.
Built on Base UI Tabs. Anaphor owns the list surface, sizing, active indicator,
and its motion.

```tsx
import { Tabs, TabsList, TabsTab, TabsPanel } from "@anaphor/system";

<Tabs defaultValue="library">
  <TabsList aria-label="Collections" variant="lifted" size="md">
    <TabsTab value="library">Library</TabsTab>
    <TabsTab value="recents">Recents</TabsTab>
  </TabsList>
  <TabsPanel value="library">Saved work</TabsPanel>
  <TabsPanel value="recents">Recent work</TabsPanel>
</Tabs>
```

## Variants

`TabsList` accepts `variant` and `size`; both are optional and keep their
existing defaults (`"default"`, `"md"`).

- `default` places a flat background surface behind the active tab on a muted track.
- `lifted` keeps the default track and raises the active surface with a hairline
  keyline and a soft shadow. Carbon renders the keyline alone.
- `line` marks the active tab with an underline on a bordered, transparent list.

The lifted surface's shadow is the list's `--tabs-lifted-shadow` property,
which defaults to `--anaphor-shadow-upload-action` in each theme. Retune tabs
alone with a class on the list, such as
`className="[--tabs-lifted-shadow:var(--anaphor-shadow-upload-action-hover)]"`,
rather than changing the upload token. The clip around the moving surface allows
for the default shadow's reach: 1px beside and above, 5px below. A larger custom
shadow is clipped at those bounds.

All variants support `sm`, `md`, and `lg` sizes and both orientations.

## Indicator and motion

The list renders an `aria-hidden` indicator containing active-styled copies of
each `TabsTab`. A clip reveals the copy under the active tab, so its label
changes colour exactly at the surface edge. Pointer selection moves the clip,
and the lifted surface with it, over 200ms with the shared ease-in-out curve.
Keyboard selection, reduced motion, and first paint settle immediately.

The lifted surface moves by transitioning its inset (`top`, `right`, `bottom`,
`left`). This is a layout transition, but the surface is an empty absolutely
positioned layer inside a small list, so the work stays local to it. Moving it
with a transform would still need width or height transitions to change size
between tabs. Insets also share the clip's coordinates, duration, and easing,
so both stay in step.

Copies are collected from `TabsTab` children, including those inside fragments
and arrays. Other children render normally but are not covered by the surface.

## Composition notes

Tabs use compact leading so labels stay optically centred. A label that
truncates clips its descenders at that leading; give the truncating element its
own line height:

```tsx
<TabsTab value={file.id} className="max-w-60">
  <FileIcon aria-hidden="true" />
  <span className="min-w-0 truncate leading-tight">{file.name}</span>
</TabsTab>
```

A `role="tablist"` may contain only tabs. Keep per-tab actions such as close or
delete outside `TabsList`, or expose them through the panel or a context menu;
a button inside the list fails the `aria-required-children` accessibility check.

Install with `pnpm dlx shadcn@latest add danfrenette/anaphor/tabs`. The registry
item depends on `danfrenette/anaphor/style`, which carries the indicator CSS and
the shadow token. The manual demonstrates every variant at `/#tabs`.
