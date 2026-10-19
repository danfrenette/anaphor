# Design

## Direction

A light-first technical manual with Bauhaus alignment, moderated brutalist
structure, industrial signaling, and tactile controls. Structure is hard and
flat; only interactive or movable objects earn rounded geometry.

## Color

The inspectable `/foundations` reference and [foundation contract](docs/foundations.md)
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

### Fluid hover

Dense, stationary collections of peer actions may use one shared highlight that
follows the nearest enabled item. Use it for menus, listboxes, tabs, and compact
action lists where every item is interactive and the pointer can cross small
gaps. Labels and separators form boundaries; disabled items are skipped. Keep
keyboard feedback immediate, and remove highlight travel for reduced motion.

Fluid hover is visual guidance, not permission to enlarge hit areas. Do not
forward clicks from gaps, especially near destructive actions. Avoid the pattern
for isolated controls, passive or mixed-interactivity cards, spacious layouts,
reordering rows, and any collection where selecting the wrong item is costly.

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

The control tile is 44px square with the Card's 12px corners. On desktop it
expands from its fixed bottom-right corner to a maximum width of 360px, with
16px screen margins and scrolling content on short screens. Below 768px, the
adaptive surface becomes a wide bottom drawer aligned to the page gutters: 24px
by default and 48px from 640px. The bottom edge uses the same gutter and aligns
with the closed trigger; the resulting floating card keeps all four rounded
corners. It is capped at 45dvh and 320px; its content scrolls independently and
respects the bottom safe area. It opens
only through explicit activation. Escape and Close return focus to the tile;
an outside press dismisses it through the same motion path. It remains nonmodal.
Both forms sit on the floating-tools layer below persistent navigation.

The responsive `--anaphor-page-gutter` token positions both page content and the
mobile morph surface, including its trigger. Card and clipped-surface shadows are
derived from one shared set of elevation primitives.

Motion is adapted from the supplied Devouring Details Morph Surface prototype:
width and measured content height open over 270ms and close over 200ms using
`cubic-bezier(0.65, 0, 0.35, 1)`. A changed view fades and moves into place
over 200ms. Reduced motion or `animate={false}` makes geometry and view changes
immediate. The persistent action bar remains available while closed; the content
stays mounted and becomes inert immediately. The consumer chooses whether
keyboard activation disables spatial motion through the `animate` prop.

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
motion behavior. The reference rationale lives in docs/components/badge.md.

## Dropdown menus

Dropdown menus are temporary, trigger-anchored action surfaces. Their trigger is
an ordinary Anaphor Button; the panel uses a 10px control radius, restrained
layered elevation, compact grouping, and 36px items that expand to 44px for
coarse pointers. Highlight uses a quiet brand-tinted neutral, while destructive
items use the existing danger text role.

The popup enters and exits along the same path with opacity and scale from 0.95,
using the Base UI transform origin, the shared strong ease-out curve, and 180ms
duration. Its trigger keeps a stable outer box while pressed so anchor
measurement cannot move the popup; press feedback scales only the trigger's
content. Keyboard activation and Base UI instant transitions remain instant.
Reduced motion removes scale and retains a 200ms opacity fade for pointer
activation.

Pointer hover uses one shared highlight. It fades over the fast 80ms spring and
travels between enabled peers on the moderate 160ms critically damped spring.
Labels and separators interrupt the path, clicks remain bound to their actual
items, and keyboard highlighting stays immediate. Reduced motion removes travel.
The mechanical composition follows coss Menu; visual and motion decisions remain
local to Anaphor.

## Popovers

Popover composes Base UI's focus, dismissal, and positioning behavior into an
anchored settings surface. It uses the shared control radius, neutral popup
surface, and menu shadow. A separate padded body scrolls within the available
height. Popovers have no caret.

Opening fades and scales from 0.95 at the trigger origin over 180ms with
the shared ease-out curve; closing takes 125ms. Pointer, touch, and keyboard
activation share these transitions, including Escape dismissal. Typing, tabbing,
and selection remain immediate; Base UI returns focus after exit. Reduced motion
disables fades and scaling.
Stable trigger geometry preserves the anchor during button press feedback.
The component contract and examples live in docs/components/popover.md.

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

## Command palette

The manual header groups its mark, name, and quiet subtitle into one identity
row, with a separate full-width search trigger. Command palettes follow a stable
top anchor with an independently scrolling result list. Text roles own the
heading, group labels, item labels, and hints; search text remains 16px. Shared
pointer highlights are instant by default. `animateHighlight` opts into travel
within groups; keyboard updates are always immediate, and
reduced motion removes travel. The controlled package component delegates
focus, keyboard navigation, and modal dismissal to Base UI. The reference and
API rationale live in docs/components/command-palette.md.

Command rows may render compact consumer-owned content at their inline end.
The rail is presentational, remains stable while selection changes, and never
owns shortcut registration. Long labels truncate before the rail. The palette
keeps its footer-level Enter instruction but does not hardcode a per-row
affordance.

Kbd keycaps use Magda Clean Mono at its available regular weight, compact 20px
geometry on the 4px rhythm, and a quiet background with a fine inset keyline and
restrained bottom edge. `KbdGroup` composes keys without interpreting whether
they form a chord or sequence. Platform formatting and shortcut behavior remain
consumer concerns.

## Demonstration scope

The former Signal and Field Notes studies were removed under ANAPHOR-258.
The reference manual, Foundations layout examples, and Carousels remain the
demonstration surfaces. The global sidebar contains navigation only. Collapsible
examples live in the manual; the separate Source outline playground was removed.

Everyday control feedback is immediate: checkbox marks and command palette
opening/closing do not animate. Desktop sidebar geometry changes immediately;
the mobile panel retains its transform transition. Scrollable content has no
edge mask. Horizontal field labels include the gap next to their control in
their hit area. Menu elevation uses `--anaphor-shadow-menu`; dark surfaces use
a subtle light keyline and stronger neutral shadows.

The documented MorphSurface and section-navigation timing exceptions remain
unchanged. These are deliberate examples, not defaults for application controls.

## Skeletons

Loading placeholders follow actual content geometry through explicit text and box
participants. Stable shells remain visible; mock content is inert and hidden from
assistive technology. Pulse, stationary sheen, and static variants use theme
neutrals. Opacity-only 1.8s/2.4s loops are an ongoing-status exception to short
interaction timings. Reduced motion stops all effects; completion is immediate.
The API, limitations, and credits live in [Skeleton](docs/components/skeleton.md).
