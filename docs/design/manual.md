# Reference manual design

Read the shared rules in [DESIGN.md](../../DESIGN.md) first. This reference owns
the specialized design constraints below; component API and usage remain in
[component documentation](../components/).

## Identity

The manual wordmark uses the 1.5rem heading token beside the 36px mark. Center
them vertically in the identity row, then lower the Bell Gothic wordmark by 2px
to align its visible capitals with the mark rather than its font line box.
The manual header groups its mark, name, and quiet subtitle into one identity
row, with a separate full-width search trigger.

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

## Demonstration scope

The former Signal and Field Notes studies were removed under ANAPHOR-258.
The reference manual, Foundations layout examples, and Carousels remain the
demonstration surfaces. The global sidebar contains navigation only. Collapsible
examples live in the manual; the separate Source outline playground was removed.

Everyday control feedback is immediate: checkbox marks and command palette
opening/closing do not animate. Workspace sidebar pointer toggles coordinate
the rail and content with a gentle spring entrance and a shorter exit; keyboard
and reduced-motion toggles settle immediately. See the
[sidebar motion contract](../components/sidebar.md) for timing and composition.
The mobile panel retains its transform transition. Scrollable content has no
edge mask. Horizontal field labels include the gap next to their control in
their hit area. Menu elevation uses `--anaphor-shadow-menu`; dark surfaces use
a subtle light keyline and stronger neutral shadows.

The documented MorphSurface and section-navigation timing exceptions remain
unchanged. These are deliberate examples, not defaults for application controls.

## API and composition

Use [Adaptive surface](../components/adaptive-surface.md) and
[Sidebar](../components/sidebar.md) for consumer contracts and examples.
