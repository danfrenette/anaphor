# Control design

Read the shared rules in [DESIGN.md](../../DESIGN.md) first. This reference owns
the specialized design constraints below; component API and usage remain in
[component documentation](../components/).

## Buttons

Buttons size icons to 14px at `xs` and 16px at `sm`, `md`, and `lg`; composed icon and text
content shares a centered flex axis. Icon-only buttons use equal width and height:
28px, 32px, 40px, and 48px for `xs` through `lg`, increased to at least 44px
on coarse-pointer devices. Shape controls the corners independently.

Choose button edge padding from its content. Text-only and icon-only buttons
keep symmetric padding. For a text button with SVG icons beside `ButtonLabel`,
reduce padding by 2px at each icon-bearing edge: start, end, or both. Icons carry
internal whitespace, so equal box padding makes the icon side appear wider.
The shared Button owns this correction for every size, tone, variant, and shape;
medium buttons use 14px at a text edge and 12px at an icon edge. Compose SVG icons
as direct siblings of `ButtonLabel`; do not repeat the correction in consumers.
Use logical start/end padding for RTL. Keep the icon-to-label gap and resting
padding unchanged during loading to avoid a sideways shift when the spinner
appears. HoldButton's reveal layer must use the same resolved edge padding so
its duplicate content stays aligned.

## Input feedback

Inputs use the existing 10px control radius, neutral surfaces, 16px text, and
Button-aligned heights. Focus is visible for pointer and keyboard interaction;
invalid fields use danger feedback. Read-only values remain selectable.

Validation is calm and corrective: show errors on blur or submit, clear them
on the first edit, and wait for the next blur or submit before showing another.
The field stays stationary. Helper and error messages share reserved space,
wrap naturally, and switch immediately without translation or scaling. The status
icon changes in place. Repeated editing never queues a feedback animation.
Ordinary valid values return to neutral rather than showing a success badge.

This combines coss's small Base UI wrapper structure with Devouring Details'
interaction emphasis and Interior's stable inline feedback. Our timing policy,
colors, typography, and restrained motion remain owned by this system.

Error text uses `--anaphor-danger-text` (`text-danger-foreground`), with `oklch(0.7 0.1691 10.14)` in dark mode: only lightness changes from
the light-theme value. Axe measures dark text contrast at 6.25:1 on the page
and 5.07:1 on cards (normal text AA requires 4.5:1). Destructive Button hover and
pressed backgrounds derive from `--anaphor-danger`, mixed with 12% black in
OKLCH; they do not introduce another color token. Input outline color transitions with its border;
focus outline geometry appears immediately.

## Badges

Badges describe categories, counts, and statuses with theme neutrals. Their
20/24/28px minimum heights and 12/12/14px text keep them subordinate to controls.
Soft is the default; solid increases emphasis and outline separates the label
from artwork. Shape is independent: 8px corners by default, round for compact
labels such as Study 01. Phosphor icons compose beside text. Long labels wrap.
Badges stay server-compatible and passive, with no hover, press, loading, or
motion behavior. The reference rationale lives in [Badge](../components/badge.md).

## API and composition

Use [Button composition](../../README.md#button-composition),
[Input and field feedback](../../README.md#input-and-field-feedback), and
[Badge](../components/badge.md) for consumer contracts and examples.
