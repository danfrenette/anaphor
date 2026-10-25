# Overlay design

Read the shared rules in [DESIGN.md](../../DESIGN.md) first. This reference owns
the specialized design constraints below; component API and usage remain in
[component documentation](../components/).

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

PopoverPopup owns trigger-relative transform origin through Base UI’s
`--transform-origin`. Preserve this default across sides, alignment, and collision
flips so the panel appears to grow from its anchor. Do not hardcode a center
origin in consumers; the demo may override it only for an explicit comparison.

Opening fades and scales from 0.95 at the trigger origin over 180ms with
the shared ease-out curve; closing takes 125ms. Pointer, touch, and keyboard
activation share these transitions, including Escape dismissal. Typing, tabbing,
and selection remain immediate; Base UI returns focus after exit. Reduced motion
disables fades and scaling.
Stable trigger geometry preserves the anchor during button press feedback.
The component contract and examples live in [Popover](../components/popover.md).

## Command palette

Command palettes follow a stable
top anchor with an independently scrolling result list. Text roles own the
heading, group labels, item labels, and hints; search text remains 16px. Shared
pointer highlights are instant by default. `animateHighlight` opts into travel
within groups; keyboard updates are always immediate, and
reduced motion removes travel. The controlled package component delegates
focus, keyboard navigation, and modal dismissal to Base UI. The reference and
API rationale live in [Command palette](../components/command-palette.md).

Command rows may render compact consumer-owned content at their inline end.
The rail is presentational, remains stable while selection changes, and never
owns shortcut registration. Long labels truncate before the rail. The palette
keeps its footer-level Enter instruction but does not hardcode a per-row
affordance.

## Fluid hover

Dense, stationary collections of peer actions may use one shared highlight that
follows the nearest enabled item. Use it for menus, listboxes, tabs, and compact
action lists where every item is interactive and the pointer can cross small
gaps. Labels and separators form boundaries; disabled items are skipped. Keep
keyboard feedback immediate, and remove highlight travel for reduced motion.

Fluid hover is visual guidance, not permission to enlarge hit areas. Do not
forward clicks from gaps, especially near destructive actions. Avoid the pattern
for isolated controls, passive or mixed-interactivity cards, spacious layouts,
reordering rows, and any collection where selecting the wrong item is costly.

## Tab selection reveal

Tabs keep both the normal labels and their decorative active copies stationary.
The active layer animates an inset `clip-path` to reveal the selected surface and
text together without stretching glyphs or changing layout each frame. This is
an intentional masking exception to transform-based travel, not an animation of
the tabs' position or dimensions. Keyboard selection and reduced motion remove
the transition. Mask compositing varies by browser; do not describe it as a
guaranteed GPU animation.

## API and composition

Use [Menu](../components/menu.md), [Popover](../components/popover.md), and
[Command palette](../components/command-palette.md) for consumer contracts.
