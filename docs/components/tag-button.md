# Tag button

A lightweight action pill composed from Button. It borrows Badge's content-led
width and wrapping, while Button supplies all interaction, color, sizing,
loading and disabled behavior. Badge remains a passive label.

```tsx
import { TagButton, ButtonLabel } from "@anaphor/system";
import { X } from "@phosphor-icons/react";

<TagButton size="xs" tone="neutral" variant="soft" loading={false}
  aria-label="Remove Research" onClick={removeTag}>
  <ButtonLabel>Research</ButtonLabel>
  <X aria-hidden="true" />
</TagButton>
```

TagButton owns `shape="round"`, `iconOnly={false}`, `nativeButton={true}` and
`type="button"`: it is a text-bearing native action, including inside forms.
It does not accept `render`, submit types or icon-only configuration. Use Button
when those choices are needed. `size`, `tone`, `variant` and `loading` remain
explicit and use Button's existing values; `xs` suits compact tags. Native
attributes, events, refs and state-aware `className` pass through.

Compose text in ButtonLabel and optional decorative Phosphor icons alongside it.
Long words wrap without truncation; icons retain their geometry. Labels use
compact 1.25 leading. Where supported, `text-box: trim-both cap alphabetic`
centers the visible letterforms instead of the font's reserved vertical space;
this replaces ButtonLabel's fixed upward nudge. Unsupported browsers retain
centered, untrimmed line boxes. Descenders remain visible without clipping. The minimum
height and coarse-pointer target come from Button. The pill can grow vertically.
For long labels expected to wrap, use `className="px-4"` to give the first and
last lines 16px of horizontal inset from the rounded ends. Short tags retain
Button's compact padding. This is an explicit composition choice, without
character-count heuristics or resize measurement.

Context such as origin text belongs inside the label; do not nest links or other
controls. A removal cue is decorative: the whole pill performs the one action.
Supply an accessible name that includes both action and visible tag name.

Consumers own tag data, add/remove/navigation callbacks, selection semantics,
focus after removal and persistence. There is no tag collection, input behavior,
implicit removal icon or internal state. Add, remove and origin navigation can
use the same component without encoding application-specific concepts.

Install with `pnpm dlx shadcn@latest add danfrenette/anaphor/tag-button`.
The registry composes the existing Button and utilities; it adds no dependency.
The manual demonstrates working tag actions at `/#tag-button`.
