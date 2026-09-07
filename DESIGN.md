# Design

## Direction

A light-first technical manual with Bauhaus alignment, moderated brutalist
structure, industrial signaling, and tactile controls. Structure is hard and
flat; only interactive or movable objects earn rounded geometry.

## Color

Use a restrained palette. Orange marks primary action, focus, selection, active
navigation, and measurement traces. It never represents warning or error.

Colors use OKLCH so lightness and chroma can be tuned independently. Six
theme-aware neutrals cover `font-secondary`, `font-tertiary`, `input-disabled`,
`input-border`, `foreground`, and `background`. They borrow the quiet warmth of
the YoRHa beige and charcoal pairs without reproducing those values. Both themes
share `oklch(0.6217 0.185 39.44)` as the brand and action color. The quieter
`oklch(0.618 0.161 39.44)` value is reserved for focus.
Danger elements use `oklch(0.4852 0.1691 10.14)`; danger text uses the darker
`oklch(0.4236 0.1691 10.14)` step. Destructive buttons use the danger
fill with a light theme-neutral label and the darker danger step on hover and
press. Destructive color overrides accent/neutral tone; explicitly disabled
states use the shared neutral treatment. Soft buttons are not supported.

Components consume these ten color roles directly. Interaction states derive by
mixing the shared brand accent toward the appropriate neutral role rather than
adding more variables. The high-chroma orange stays clear against dark surfaces
and vivid in light mode. Solid accent controls retain the approved
bright-foreground visual exception.

Disabled controls use `input-disabled` with `font-tertiary` for intentionally
subdued contrast. Loading independently blocks activation, preserves focus and
action color, and reveals a spinner while retaining the label. Combining loading
and disabled shows the spinner with the neutral disabled treatment. Spinner entry
and exit animate over 200ms; text buttons animate the space for the spinner,
while icon-only buttons crossfade without resizing. Reduced motion skips both
the transition and spinner rotation.

## Typography

Use self-hosted Inter 4.1 Variable for prose, headings, and controls. The package
owns normal and true italic WOFF2 files, both covering weights 100–900. Automatic
optical sizing moves from text to display drawings as size increases. Use system
sans as the loading fallback. Magda Clean Mono is self-hosted for
literal database values, types, expressions, metrics, tokens, and code, using its supplied regular (400) face. Do not
synthesize bold or italic mono labels. All bundled web fonts must use WOFF2;
do not add WOFF, TTF, or OTF assets. Use Inter for navigation, section labels,
headings, and actions. Mono identifies data, not decorative technical styling.

- Label: 12px / 1.4, uppercase where categorical, `0.08em` tracking.
- Small: 12px / 1.5.
- UI: 14px / 1.5; input text stays at 16px.
- Body: 16px / 1.6, 400 weight, natural tracking.
- Heading: 24px / 1.2, 500 weight, `-0.02em` tracking.
- Title: 36px / 1.1, 500 weight, `-0.02em` tracking.
- Display: fluid 40–56px / 1.1, 500 weight, `-0.035em` tracking.
- Instructional prose measure: at most 65ch.

Use `prose-reading` for instructional paragraphs: primary text color at 90%
alpha, composited over the actual surface in either theme. Keep headings,
controls, status feedback, and already-muted metadata at their own full-strength
color roles. Never fade a parent container to soften text. Balance headings;
pretty-wrap short descriptions, but leave long-form paragraphs at normal wrapping.
Use tabular numbers for changing values and wrap token names rather than hiding
them. Apply font smoothing once at the root.

## Iconography

Use Phosphor Icons for interface symbols. Prefer the regular weight and preserve
the library's native geometry rather than redrawing common icons. Buttons size
icons to 14px at `xs` and 16px at `sm`, `md`, and `lg`; composed icon and text
content shares a centered flex axis. Icon-only buttons use equal width and height:
28px, 32px, 40px, and 48px for `xs` through `lg`, increased to at least 44px
on coarse-pointer devices. Shape controls the corners independently.

## Spacing And Layout

Use a 4px base rhythm with 4, 8, 12, 16, 24, 32, 48, 64, and 96px steps.
Desktop demos use a 280px indexed rail and an 840px reading column inside a
1200px page region. Mobile uses 24px gutters and document flow; navigation must
not force horizontal scrolling at 320px or 200% zoom.

Spacing varies by purpose: compact inside controls, moderate within a demo,
and generous between instructional sections. Rules and shared alignment lanes
provide grouping before containers do.

## Geometry And Elevation

- Structural surfaces: square corners or 4px radius.
- General compact surfaces: 8px radius.
- Cards: 12px radius, a theme-neutral raised surface, no border or shadow.
  Section padding is 24px, shared between adjacent sections. The outer card
  has no padding or overflow clipping; edge-to-edge media rounds its own corners.
  Width follows the available space and height follows content.
- Tactile controls: 10px radius.
- Pills and indicators: fully rounded only when shape communicates behavior.
- Elevation: flat by default; layered shadow is reserved for temporary floating
  tools such as the demo control surface.

## Density

Support two named contexts: `editorial` for spacious instruction and `compact`
for application interfaces. Density changes spacing and control sizing without
changing hierarchy, semantics, or component identity.

## Motion

Motion explains feedback, causality, continuity, or spatial relationships.
Most transitions complete within 150 to 250ms and never exceed 300ms without a
documented reason. Avoid animation for repeated keyboard actions and content
already present. Prefer transform and opacity; define reduced-motion behavior
per component.

## Demos

Opinionated demos expose only meaningful variables. Approved values are the
defaults, reset restores them, experiments remain local, and deterministic
defaults remain available for visual regression. Instrumentation such as rulers,
coordinates, or state labels appears only when it explains behavior.

## Component Laws

- Start with semantic HTML and native behavior.
- Use Base UI-compatible primitives when focus, dismissal, or keyboard behavior
  exceeds native controls.
- Keep static components server-safe; place client boundaries at interaction.
- Cover default, hover, focus, active, disabled, loading, themes, viewport, and
  reduced-motion states according to component risk.
- Exact runtime values live in package CSS; this document governs intent and
  constraints.

## Morphing control surface

The control tile is 44px square with the Card's 12px corners. It expands from
its fixed bottom-right corner to a maximum width of 360px, with 16px screen
margins and scrolling content on short screens. It opens only through explicit
activation. Escape and Close return focus to the tile; it is nonmodal.

Motion is adapted from the supplied Devouring Details Morph Surface prototype:
width/height and content opacity use spring stiffness 550, damping 45, mass 0.7;
closing geometry waits 80ms; the shared dot uses stiffness 350 and damping 35.
The original pill, feedback form, and auto-loop are replaced with our square,
component controls, and explicit open state. Reduced motion removes transitions.

## Input feedback

Inputs use the existing 10px control radius, neutral surfaces, 16px text, and
Button-aligned heights. Focus is visible for pointer and keyboard interaction;
invalid fields use danger feedback. Read-only values remain selectable.

Validation is calm and corrective: show errors on blur or submit, clear them
on the first edit, and wait for the next blur or submit before showing another.
The field stays stationary. Helper and error messages share reserved space,
wrap naturally, and transition with a 160ms fade and 2px movement; the Phosphor
status icon enters with a restrained scale change. Reduced motion skips travel.
Ordinary valid values return to neutral rather than showing a success badge.

This combines coss's small Base UI wrapper structure with Devouring Details'
interaction emphasis and Interior's stable inline feedback. Our timing policy,
colors, typography, and restrained motion remain owned by this system.

Error text uses `--dl-danger-text` (`text-danger-foreground`), with `oklch(0.7 0.1691 10.14)` in dark mode: only lightness changes from
the light-theme value. Axe measures dark text contrast at 6.25:1 on the page
and 5.07:1 on cards (normal text AA requires 4.5:1). `--dl-danger-hover` owns the destructive Button's darker
background independently. Input outline color transitions with its border;
focus outline geometry appears immediately.

## Badges

Badges describe categories, counts, and statuses with theme neutrals. Their
20/24/28px minimum heights and 12/12/14px text keep them subordinate to controls.
Soft is the default; solid increases emphasis and outline separates the label
from artwork. Shape is independent: 8px corners by default, round for compact
labels such as Study 01. Phosphor icons compose beside text. Long labels wrap.
Badges stay server-compatible and passive, with no hover, press, loading, or
motion behavior. The reference rationale lives in docs/components/badge.md.

## Card copy feedback

`CardCopyButton` composes inside `CardAction` and copies its explicit `value`.
It confirms a successful clipboard write with a 160ms opacity/scale transition
between Phosphor Copy and Check icons, returning after two seconds. Reduced
motion keeps only the fade. The live status announces success or a retryable
failure without moving focus. Static Card parts remain server-compatible.

## Showcase cards

The default Card stays quiet and borderless. `variant="showcase"` places its
sections on the page surface, with unpadded captions below the preview.
`CardPreview` owns a double frame: a 4px inset, concentric corners, fine neutral
outlines, and a restrained layered shadow. It is the explicit exception to flat
card elevation for work presented as a page centerpiece. Its inner surface clips
artwork; the outer Card never clips controls or focus rings. The default preview
ratio is 4:5 and can be changed with `--card-preview-ratio`.
