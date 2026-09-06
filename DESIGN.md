# Design

## Direction

A light-first technical manual with Bauhaus alignment, moderated brutalist
structure, industrial signaling, and tactile controls. Structure is hard and
flat; only interactive or movable objects earn rounded geometry.

## Color

Use a restrained palette. Orange marks primary action, focus, selection, active
navigation, and measurement traces. It never represents warning or error.

Current light values:

- Paper `#FCFCFB`: page and navigation surfaces.
- Field `#F4F4F1`: specimen and secondary surfaces.
- Ink `#1C1C1A`: primary text and dark text on orange.
- Graphite `#686866`: secondary text.
- Rule `#D8D8D4`: dividers and boundaries.
- Orange `#F05A1F`: action and active-state signal.

Current dark studies use canvas `#171716`, field `#20201F`, rule `#393937`,
primary text `#F4F4F1`, secondary text `#A7A7A2`, and bright orange text
`#FF895B`. Every token and component requires intentional dark-theme coverage.
Do not use white text on bright orange; ink on orange is the approved pairing.

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

## Spacing And Layout

Use a 4px base rhythm with 4, 8, 12, 16, 24, 32, 48, 64, and 96px steps.
Desktop specimens use a 280px indexed rail and an 840px reading column inside a
1200px page region. Mobile uses 24px gutters and document flow; navigation must
not force horizontal scrolling at 320px or 200% zoom.

Spacing varies by purpose: compact inside controls, moderate within a specimen,
and generous between instructional sections. Rules and shared alignment lanes
provide grouping before containers do.

## Geometry And Elevation

- Structural surfaces: square corners or 4px radius.
- General compact surfaces: 8px radius.
- Tactile controls: 10px radius.
- Pills and indicators: fully rounded only when shape communicates behavior.
- Elevation: flat by default; layered shadow is reserved for temporary floating
  tools such as the specimen control surface.

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

## Specimens

Opinionated specimens expose only meaningful variables. Approved values are the
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
