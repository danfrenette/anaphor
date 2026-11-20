# Content component design

Read the shared rules in [DESIGN.md](../../DESIGN.md) first. This reference owns
the specialized design constraints below; component API and usage remain in
[component documentation](../components/).

## Card copy feedback

`CardCopyButton` composes inside `CardAction` and copies its explicit `value`.
It confirms a successful clipboard write with a 160ms opacity/scale transition
between Phosphor Copy and Check icons, returning after two seconds. Reduced
motion keeps only the fade. The live status announces success or a retryable
failure without moving focus. Static Card parts remain server-compatible.

## Showcase cards

The default Card stays quiet and uses the shared card shadow. `variant="showcase"` places its
sections on the page surface, with unpadded captions below the preview.
`CardPreview` owns a double frame: a 4px inset, concentric corners, fine neutral
outlines, and the same restrained layered shadow as the default Card. Its inner surface clips
artwork; the outer Card never clips controls or focus rings. The default preview
ratio is 4:5 and can be changed with `--card-preview-ratio`.

CardTitle's label variant owns categorical labels: Inter medium, label sizing,
uppercase tracking, and muted color. Consumers select the variant rather than
assembling typography utility overrides. Semantic element selection preserves
Text's purpose-defined weight and wrapping.

## Kbd

Kbd keycaps use Magda Clean Mono at its available regular weight, compact 20px
geometry on the 4px rhythm, and a quiet background with a fine inset keyline and
restrained bottom edge. `KbdGroup` composes keys without interpreting whether
they form a chord or sequence. Platform formatting and shortcut behavior remain
consumer concerns.

## Diff icons

Diff reading controls use Pierre's dedicated unified/split glyphs and Octicons'
`WrapIcon`, `UnwrapIcon`, and `CopyIcon` as a focused exception to Phosphor. These identify the code-reading
operations at 16px; surrounding file and disclosure icons retain Phosphor. Other copy buttons retain
their Phosphor default.
Preserve upstream geometry and use accessible names and explanatory tooltips.
See the [icon research](../research/diff-control-icons.md).

## Skeletons

Loading placeholders follow actual content geometry through explicit text and box
participants. Stable shells remain visible; mock content is inert and hidden from
assistive technology. Pulse, stationary sheen, and static variants use theme
neutrals. Opacity-only 1.8s/2.4s loops are an ongoing-status exception to short
interaction timings. Reduced motion stops loading effects; completion is immediate
by default, with an optional media opacity reveal of 200ms (160ms reduced motion).
The API, limitations, and credits live in [Skeleton](../components/skeleton.md).

## Step transition

Ordered content may travel horizontally while a measured shell changes height.
StepTransition uses a 300ms spring with no bounce and 110% inline travel, following
consumer-supplied direction. Measured height is a deliberate layout-motion exception
for step and supporting-panel changes. Initial content is static; reduced motion
or explicit animation opt-out makes changes immediate. Navigation stays outside
the moving content, and outgoing content is inert and hidden from accessibility.
