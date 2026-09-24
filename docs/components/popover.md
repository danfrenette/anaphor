# Popover

An anchored panel for settings, filters, and other small interactive tasks.
Built on Base UI Popover, following [shadcn's composition](https://ui.shadcn.com/docs/components/base/popover)
and [Coss's popup structure](https://coss.com/ui/docs/components/popover).
Anaphor owns the surface, spacing, typography, and motion.

## Composition

```tsx
import {
  Button, ButtonLabel, Popover, PopoverTrigger, PopoverPopup,
  PopoverBody, PopoverTitle, PopoverDescription, PopoverClose,
} from "@anaphor/system";

<Popover>
  <PopoverTrigger render={
    <Button nativeButton type="button" variant="outline" tone="neutral"
      size="md" shape="square" iconOnly={false} loading={false} />
  }>
    <ButtonLabel>Preferences</ButtonLabel>
  </PopoverTrigger>
  <PopoverPopup side="bottom" align="start" sideOffset={8}
    positionerProps={{ collisionPadding: 16 }}>
    <PopoverBody>
      <PopoverTitle>Preferences</PopoverTitle>
      <PopoverDescription>Changes apply immediately.</PopoverDescription>
      {/* Compose fields or other interactive content here. */}
      <PopoverClose render={
        <Button nativeButton type="button" variant="outline" tone="neutral"
          size="md" shape="square" iconOnly={false} loading={false} />
      }>
        <ButtonLabel>Done</ButtonLabel>
      </PopoverClose>
    </PopoverBody>
  </PopoverPopup>
</Popover>
```

`Popover` preserves Base UI's controlled (`open`, `onOpenChange`) and uncontrolled
(`defaultOpen`) modes. Upstream props retain their optionality. Change-event
details, including cancellation, pass through unchanged.

`PopoverPopup` requires `side`, `align`, and `sideOffset`. `positionerProps`
exposes anchors, alignment offsets, collision boundaries, collision padding, and
collision avoidance without overriding those required placement props.
`portalProps` supports a custom portal container or mounting policy. Popup refs,
stateful class names, `initialFocus`, and `finalFocus` pass through to Base UI.

`PopoverBody` provides 16px padding and bounds scrolling to the available height.
The popup uses a 320px width capped by the available space
and viewport gutters; callers can override width through `className`.

## Interaction and accessibility

Open through the trigger. Title and description parts name and describe the
dialog; provide an `aria-label` if omitting the title. Tab navigates ordinary
controls. Opening with a keyboard focuses the first focusable control; touch
follows Base UI's behavior of focusing the panel to avoid opening the keyboard.
Escape and Close return focus to the trigger. Outside activation dismisses the
panel while allowing the outside target to receive focus.

Nested menus retain their own keyboard navigation and dismissal. The shared
primitive handles layering and focus relationships. `modal` remains an upstream
option; modal or trapped-focus consumers must include a Close control as required
by Base UI. The demo uses the nonmodal behavior.

## Surface and motion

Use the shared control radius, neutral surface, popup border and menu shadow.
Opening transitions opacity and scale from 0.95 at the trigger origin
over 180ms with the shared ease-out curve. Closing takes 125ms. Pointer, touch,
and keyboard activation use the same transitions, including Escape dismissal.
Typing, tabbing, and selection do not wait for motion. Base UI returns focus
after the exit transition completes.
Reduced motion disables transitions and scaling entirely. Trigger press feedback
scales its Button content, preserving stable anchor geometry.

This applies the emil-animations guidance for brief origin-aware motion without
adding an animation dependency. Shared moving popovers, hover-opening examples,
and automatic mobile drawer conversion are deferred.

## Delivery

The component is exported from `@anaphor/system` and installable as
`danfrenette/anaphor/popover` through the registry. It is included in the aggregate
`ui` item. The manual's Components → Popover section has placement, alignment,
and offset controls, with editable content and a nested menu.
