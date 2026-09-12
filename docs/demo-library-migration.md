# Build the reference manual from its own library

Status: token-first migration underway. The long-term goal remains a demo built
from library components. Token-backed Tailwind utilities are the approved
intermediate state; introducing layout components is not a prerequisite.

## First phase: color, font size, spacing, and radii

Use the existing Tailwind v4 CSS configuration in
`packages/design-system/src/styles.css`. No JavaScript Tailwind configuration or
additional styling dependency is needed.

| Category | Shared contract | Demo usage |
| --- | --- | --- |
| Color | Existing `--anaphor-*` semantic roles and light/dark mappings feed `--color-*` utilities | `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `accent-primary` |
| Font size | Existing `--text-*` scale plus `--text-title-small` for the studies' 28px mobile title | `text-ui`, `text-body`, `text-heading`, `text-title`, `text-title-small` |
| Spacing | Explicit `--spacing: 0.25rem`, using Tailwind's numeric multiplier | `gap-2` = 8px, `p-6` = 24px, `mt-12` = 48px; fractional steps preserve existing smaller gaps |
| Radii | Existing `--radius-sm`, `--radius-md`, `--radius-control`, `--radius-card` | `rounded-sm`, `rounded-md`, `rounded-control`, `rounded-card`; `rounded-full` for circles |

Supporting typography tokens `leading-reading` and `tracking-heading` keep
existing text treatments consistent without repeating literal values. Font
families already use the library's Inter and Magda definitions.

This applies the article's semantic-color and shared-scale approach while
retaining Anaphor's existing palette and sizes. We do not need a new primitive
palette just to add another alias layer, or a second numbering system for spacing.

Reference: [Maxime Heckel, Building a Design System from scratch](https://blog.maximeheckel.com/posts/building-a-design-system-from-scratch/).
Tailwind mechanism: [Theme variables](https://tailwindcss.com/docs/theme) and
[`@reference` / `@apply`](https://tailwindcss.com/docs/functions-and-directives).

## Implemented slice

- Made the library's 4px spacing rhythm explicit in Tailwind configuration.
- Added a small-title size for the studies' existing mobile heading and shared
  reading-line-height/heading-tracking utilities.
- Converted study navigation, page theme, control groups, instructions, palette
  selection, and several article compositions to Tailwind classes.
- Converted remaining study spacing, type, ordinary UI colors, and radius rules
  to token-backed `@apply` where relational or responsive selectors remain useful.
  `@reference` provides the package's theme without duplicating its stylesheet.
- Replaced repeated heading-tracking literals across the manual with the shared
  utility. Existing color/type/radius mappings remain the source of truth.

The remaining stylesheet is intentional limbo. `@apply` removes duplicated
values, not the selector itself. Runtime palette colors are authored data; shader
colors and masks belong to the artwork rather than the interface palette.

## Next slices

1. Continue replacing literal UI values with existing tokens when touching demos.
   Add a token only when the existing scale does not express the intended design.
2. Move simple remaining selectors into markup utilities when that improves
   readability. Preserve relational and responsive rules until they have a better
   owner; do not create components merely to hide class names.
3. Replace duplicated controls with existing library components. Add missing
   library capabilities only when a real example needs them.
4. Gradually graduate reusable presentation and rendering into library components,
   migrating consumers and deleting their corresponding local implementation in
   the same change.
5. Track residual experimental styling by file, capability, and exit condition.
   Once the library supports all required compositions, tighten enforcement toward
   the original component-only goal.

## Work outside the four requested categories

| Work | Why it is separate |
| --- | --- |
| Select/range primitives, checkbox rows, palette selection | Interaction semantics, keyboard support, accessible labels, and state ownership |
| Container/grid/section/navigation/skip-link primitives | Layout, reading measure, viewport sizing, breakpoints, and page structure; only their gaps/padding belong to this token pass |
| MorphSurface anchoring and responsive Card composition | Positioning, overflow, composition contracts, and responsive behavior |
| Shadows, borders, focus rings | Effects and geometry; their colors can use shared tokens, but widths, offsets, and shadows need separate decisions |
| Button press scale/duration and shared-element transitions | Motion and customization contracts; radius itself is in scope |
| Graph/Node/Edge and playback graduation | Public API, geometry, rendering, resource cleanup, and the Effect dependency |
| Shader/palette artwork | Canvas/SVG rendering, computed colors/gradients, masks, and animation; these cannot all be replaced with static theme tokens |
| Registry exports, documentation, and boundary checks | Distribution and enforcement rather than styling |

These tasks remain in the longer-term plan, but do not block token adoption.
An experiment must eventually become a supported library capability or move to
another project to satisfy the component-only endpoint.

## Verification and completion

Preserve intended appearance and behavior while replacing literal values. Use
existing browser coverage for studies, palette controls, route transitions,
themes, narrow viewports, reduced motion, and accessibility. Build production CSS
to verify token resolution across separate stylesheets. Run lint, type checking,
and relevant tests; follow the repository's full validation checklist before merging.

This phase is complete when ordinary demo colors, text sizes, gaps/padding/margins,
and radii consistently consume the shared scale, with explicitly documented
artwork exceptions. It does not imply that layout, motion, local controls, or
rendering have already moved into the library.
