# Color decisions

Read the shared rules in [DESIGN.md](../../DESIGN.md) first. This reference owns
the specialized design constraints below; component API and usage remain in
[component documentation](../components/).

## Color

The inspectable `/foundations` reference and [foundation contract](../foundations.md)
map public semantic names to exact shipped values, theme pairs and local exceptions.

Use a restrained palette. Orange marks primary action, focus, selection, active
navigation, and measurement traces. It never represents warning or error.

Colors use OKLCH so lightness and chroma can be tuned independently. Six
theme-aware neutrals cover `font-secondary`, `font-tertiary`, `input-disabled`,
`input-border`, `foreground`, and `background`. The light theme keeps the quiet
warmth of the YoRHa beige pair; the dark theme uses a cool, nearly monochrome
charcoal ramp with a rich near-black canvas. Both themes share
`oklch(0.6217 0.185 39.44)` as the brand and action color. The quieter
`oklch(0.618 0.161 39.44)` value is reserved for focus.
The Carbon direction was confirmed in the `/proto/dark-theme` study. Its six
dark neutrals and card keyline keep surface depth restrained while preserving
Anaphor orange for actions and focus and Crimson for danger. Warm was rejected
for its chocolate cast; Graphite kept too much separation between surfaces;
Ink retained more blue-violet color than desired; Geist Black made the canvas
and action treatment too stark. The study route was removed after this decision.
Danger elements use `oklch(0.4852 0.1691 10.14)`; danger text uses the darker
`oklch(0.4236 0.1691 10.14)` step. Destructive buttons use the danger
fill with a light theme-neutral label and the darker danger step on hover and
press. Button tone (`accent`, `neutral`, or `danger`) is independent of its
`solid`, `outline`, `ghost`, or `soft` variant. Explicitly disabled states use
the shared neutral treatment. Soft buttons use a tinted fill; HoldButton uses
the soft variant with its independently selected tone.

The Crimson direction was confirmed in the `/proto/danger` study. Keep its
current fill in both themes, its light-theme text step above, and the
`oklch(0.7 0.1691 10.14)` dark-theme text step. Keep surrounding error and
destructive surfaces neutral so the color marks the action itself. Oxide was
rejected because its muted, warm outline made the danger signal too quiet;
Berry was rejected because its tinted error and action surfaces made the
warning too pervasive. The study route was removed after this decision.

Components consume these ten color roles directly. Interaction states derive by
mixing the shared brand accent toward the appropriate neutral role rather than
adding more variables. The high-chroma orange stays clear against dark surfaces
and vivid in light mode. Solid accent controls retain the approved
bright-foreground visual exception.

Disabled controls use `input-disabled` with `font-tertiary` for intentionally
subdued contrast. Loading independently blocks activation, preserves focus and
action color, and reveals a spinner while retaining the label. Combining loading
and disabled shows the spinner with the neutral disabled treatment. Spinner entry
and exit fade over 200ms; text buttons allocate space for the spinner immediately,
while icon-only buttons crossfade without resizing. Reduced motion skips both
the transition and spinner rotation.
