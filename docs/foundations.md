# Foundation reference

`/foundations` is the inspectable source-of-truth companion to package CSS.
It reads shipped declarations at build time rather than maintaining a second
palette. Public Tailwind semantic names lead; exact backing variables follow.
Changing a token requires rebuilding the reference.

## Theme and naming

The global theme switch remains authoritative. Compare themes is optional and
local to the color reference. Both specimens explicitly set their complete
theme values and color-scheme, including when the outer page is dark.

Public `foreground` means primary text; private `--anaphor-foreground` means
the raised surface behind public `muted`. `danger-foreground` means error text,
not text placed on the danger fill. Do not rename public APIs to tidy this view.
Checkbox-mark is intentionally constant across themes. Equal current values do
not make two semantic roles redundant.

## Contrast

The reference measures browser-resolved colors in an sRGB canvas, compositing
reading alpha over its actual background. Normal text targets 4.5:1 and focus
indicators target 3:1. It reports below-target pairs rather than recoloring them.
These samples are not a substitute for complete component-state accessibility
tests. Disabled controls remain exempt from contrast requirements.

Orange solid-action labels retain the explicitly approved bright-label
exception. Show their measured ratio and exception status in Paper; never label
them AA-compliant when below the threshold.

## Scope and experiments

Spacing keeps Tailwind's numbering and 4px base. Borders remain component rules
(1px divider, 2px focus outline), not a newly invented scale. Type specimens and
reading experiments live at `/typography`, including the approved section role.
The foundation geometry/motion experiment changes only its sample. Reset and
reload restore defaults; it writes neither root variables nor browser storage.

Shadows are theme-dependent composites. Port the card and menu elevations with
their theme-specific primitives, not just an inherited computed light value.
The clipped-card filter is a rendering equivalent, not a separate elevation.

## Component exceptions

- Slider retains DialKit colors, 13px text, 8px radius and interaction springs.
  These stay local; see `components/slider.md` before changing them.
- Theme reveal uses 350ms and `cubic-bezier(0.65, 0, 0.35, 1)` to cross the
  viewport. Keyboard and reduced-motion changes remain immediate.
- MorphSurface geometry uses 270ms opening and 200ms closing with its local
  reference-derived easing; view changes use 200ms. This is not the default
  timing for ordinary controls.

## Compatibility

No exported or documented compatibility tokens were removed. `prose-reading`
still has consumers; title-small remains documented. Unused internal JS timing
constants or reserved layer tokens need a separate consumer/export audit before
removal. Do not promote study-specific chart or shader values into shared tokens.

## Paper checklist

Carry semantic names and exact code aliases together; record both themes;
preserve type roles, reading measure, spacing rhythm, geometry and elevations;
annotate contrast exceptions and behavioral recipes. Snapshot the approved
defaults, not an experimental setting. Paper represents static states; reduced
motion, keyboard behavior and interaction mechanics remain code contracts.
