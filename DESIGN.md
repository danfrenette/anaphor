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
press. Destructive color overrides accent/neutral tone; disabled and loading
states retain the shared neutral treatment. Soft buttons are not supported.

Components consume these ten color roles directly. Interaction states derive by
mixing the shared brand accent toward the appropriate neutral role rather than
adding more variables. The high-chroma orange stays clear against dark surfaces
and vivid in light mode. Solid accent controls retain the approved
bright-foreground visual exception.

Disabled controls, including loading controls, always use `input-disabled` with
`font-tertiary` for intentionally subdued contrast. Their
previous tone and variant do not show through, while loading retains its label
and progress indicator. Disabled treatments remain distinct from functional
neutral controls.

## Typography

Use IBM Plex Sans for prose and controls and IBM Plex Mono for indexes, labels,
measurements, and code. Until font assets are owned by the package, fall back to
system sans and monospace stacks without external runtime requests.

- Label: 11px / 16px, uppercase where categorical, `0.08em` tracking.
- Small: 12px / 16px.
- UI: 14px / 20px.
- Body: 16px / 26px.
- Title: 36px / 40px, 500 weight, `-0.02em` tracking.
- Instructional prose measure: 680px to 820px.

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
