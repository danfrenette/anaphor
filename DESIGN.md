# Design

Read this file for every interface change, then read only the references whose
triggers match the work. Follow their component links when changing an API or
composition. Runtime values live in package CSS; these documents own intent,
constraints, and the reasons behind them. [PRODUCT.md](PRODUCT.md) owns audience
and product scope.

## Read for the affected area

| When changing… | Read before editing |
| --- | --- |
| Theme palettes, color roles, danger treatment, or disabled/loading colors | [Color decisions](docs/design/color.md) |
| Button size, icon padding, loading, input validation, or badges | [Controls](docs/design/controls.md) |
| Menus, popovers, command palettes, tab indicators, or shared hover highlights | [Overlays](docs/design/overlays.md) |
| Cards, copy feedback, keycaps, diff icons, skeletons, or step transitions | [Content components](docs/design/content.md) |
| Manual branding, demo scope, sidebar feedback, or the floating controls surface | [Reference manual](docs/design/manual.md) |
| Typography roles or article composition | [Typography](docs/components/typography.md) |
| Workspace/editorial bounds, responsive gutters, or layout composition | [Layout recipes](docs/layout-recipes.md) |

Add a rule here only when it applies across components. Put component exceptions,
exact interaction contracts, and decision history in the matching reference and
keep this routing table current. Update the owning rule rather than copying it
into another document.

## Direction

A light-first technical manual with Bauhaus alignment, moderated brutalist
structure, industrial signaling, and tactile controls. Structure is hard and
flat; only interactive or movable objects earn rounded geometry.

## Color

Use a restrained palette. Orange marks action, focus, selection, and active
navigation; danger has its own role. Components consume shared semantic colors
and derive interaction states from those roles. Light surfaces are warm neutrals;
dark surfaces use the Carbon direction. Preserve the approved solid-accent
contrast exception. Read [Color decisions](docs/design/color.md) before changing
palette values, state colors, or their documented exceptions.

## Typography

Use self-hosted Inter 4.1 Variable for prose and controls. The package
owns normal and true italic WOFF2 files, both covering weights 100–900. Automatic
optical sizing moves from text to display drawings as size increases. Use system
sans as the loading fallback. Bell Gothic renders uppercase through CSS; keep
source text in natural case. Magda Clean Mono is self-hosted for
literal database values, types, expressions, metrics, tokens, and code, using its supplied regular (400) face. Do not
synthesize bold or italic mono labels. All bundled web fonts must use WOFF2;
do not add WOFF, TTF, or OTF assets. Use Inter for navigation, section labels, and actions. Use Bell Gothic Black
(900) for headings via Text and the shared heading font token. Mono identifies data, not decorative technical styling.

- Label: 12px / 1.4, uppercase where categorical, `0.08em` tracking.
- Small: 12px / 1.5.
- UI: 14px / 1.5; input text stays at 16px.
- Body: 16px / 1.6, 400 weight, natural tracking.
- Heading: 24px / 1.2, 900 weight, `-0.02em` tracking.
- Title: 36px / 1.1, 900 weight, `-0.02em` tracking.
- Display: fluid 40–56px / 1.1, 900 weight, `-0.035em` tracking.
- Instructional prose measure: at most 65ch.

Use `Text` for purpose-based typography and `Prose` for article markup.
Body text and all native text within Prose use primary text color at 90%
alpha, composited over the actual surface in either theme. Outside Prose, headings, controls, status feedback, and muted metadata keep
their own color roles. Inside Prose, headings inherit the reading color. Never fade a parent container to soften text. Balance headings.
The description variant owns pretty wrapping; body and Prose keep normal wrapping.
Body and description variants own the shared 65ch reading measure. Callers choose
purpose and placement, without repeating font, wrap, color, or reading-width rules.
Use tabular numbers for changing values and wrap token names rather than hiding
them. Apply font smoothing once at the root.

## Iconography

Use Phosphor Icons for interface symbols. Prefer the regular weight and preserve
the library's native geometry rather than redrawing common icons.
Provide accessible names and explanatory tooltips for icon-only controls.

## Spacing And Layout

Use a 4px base rhythm with 4, 8, 12, 16, 24, 32, 48, 64, and 96px steps.
Desktop demos use a 280px indexed rail and an 840px reading column inside a
1200px page region. Mobile uses 24px gutters and document flow; navigation must
not force horizontal scrolling at 320px or 200% zoom.

Spacing varies by purpose: compact inside controls, moderate within a demo,
and generous between instructional sections. Rules and shared alignment lanes
provide grouping before containers do.

Foundations → Layout documents the exported workspace and editorial bounds,
reading measure and responsive page inset. These first-pass shared defaults are
owned by package CSS and consumed through Tailwind utilities; see
[layout recipes](docs/layout-recipes.md) for cross-project usage. They constrain
recurring decisions without imposing a universal grid. Ordinary gaps, panel
proportions and collapse thresholds remain composition choices. Deprecated
studies may consume these tokens but are not their documentation home.

## Geometry And Elevation

- Structural surfaces: square corners or 4px radius.
- General compact surfaces: 8px radius.
- Cards: 12px radius, a theme-neutral raised surface, and the shared card
  shadow: a 1px keyline, compact near shadow, and soft 2–4px falloff.
  Section padding is 24px, shared between adjacent sections. The outer card
  has no padding or overflow clipping; edge-to-edge media rounds its own corners.
  Width follows the available space and height follows content.
- Tactile controls: 10px radius.
- Pills and indicators: fully rounded only when shape communicates behavior.
- Elevation: structural surfaces stay flat. Cards and temporary floating tools
  use the shared `shadow-card` token. Clipped morph geometry uses its
  `filter-shadow-card` equivalent so the same elevation scale remains visible.

Global stacking uses semantic z-index tokens rather than numeric utilities:
raised content, floating tools, navigation, backdrops, overlays, then accessibility
escapes. Component-internal stacking contexts may use small numeric indices.

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

For each added or changed animation:

1. Identify the animated properties and driver, including values written by
   JavaScript callbacks. Animate travel with `transform` and fades with `opacity`;
   set measured geometry at state boundaries. Interpolating `top`, `left`, margins,
   or dimensions during travel causes layout work on every frame.
2. Use an explicit property list for transitions. Keep dimension or mask animation
   only when document flow, surface morphing, or a reveal requires it; record the
   reason in the affected component reference. The [tab reveal](docs/design/overlays.md#tab-selection-reveal)
   and [slider rubber-band surface](docs/components/slider.md) are scoped examples,
   not permission to animate unrelated layout properties.
3. Inspect the running transition and verify its moving properties, interruption,
   keyboard, and reduced-motion behavior with the relevant browser recipe.
   Finish when every changed animation uses the intended properties or has a
   documented exception. Report unverified behavior explicitly.

A transform does not by itself guarantee compositor execution: JavaScript frame
callbacks still depend on the main thread. Claim frame-rate improvements only
with a performance recording; property inspection proves the implementation,
not performance on every device.

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
