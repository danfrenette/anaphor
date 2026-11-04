# Toast

Toaster renders transient notifications using Base UI Toast. Sonner informs the
collapsed stack, hover/focus expansion, and direct manager calls; Sonner and
shadcn are not runtime dependencies. Anaphor owns the neutral surface, shared
Card elevation, Phosphor icons, Button actions, and reduced-motion treatment.

```tsx
"use client";
import { Toaster, toast } from "@anaphor/system";

export function Notifications() {
  return <Toaster toastManager={toast} position="bottom-right" timeout={5000} limit={3} />;
}

// From client-side event handlers, after Notifications mounts:
toast.add({ title: "Changes saved", type: "success" });
```

Mount exactly one Toaster per manager. Toaster requires `toastManager`, `position`,
`timeout`, and `limit`. Positions are top/bottom × left/center/right. Center stacks swipe vertically;
corner stacks also swipe outward horizontally. Use
`createToastManager()` for an independent host; create it once, outside render or
in a state initializer. Children can call `useToastManager()` within that host.
Calls before a host mounts are not retained. Do not call from server code.
A server layout may render an application-owned client Notifications component.

The manager retains Base UI's `add`, `update`, `close`, and `promise` contracts.
`add` returns an ID; reusing an ID updates the existing notification. `close(id)`
dismisses one; `close()` dismisses all. Timeout is milliseconds; `0` means persistent.
Loading notifications do not expire. Promise calls return a promise that still
rejects on failure: callers must handle it. Success/error objects can set their
own timeout and description. Updates preserve unspecified content, so explicitly
clear content that should no longer appear.

Recognized types are success, error, warning, info, and loading. Other types use
the information icon. Text must communicate the outcome; color is supplemental.
Only errors use Crimson. Notifications inherit the document theme.

`actionProps` supplies button content, native attributes, and callbacks. The
renderer wraps its content in ButtonLabel. Actions do **not** automatically close:
the application calls `close(id)` when the operation succeeds. Use persistent
notifications for actions that must remain available. Avoid placing essential
validation or recovery instructions only in transient feedback.

Base UI owns announcements, timeout pausing, the visible limit, dismissal,
keyboard focus, drag tracking, and distance-based swipe dismissal. Anaphor adds
primary-pointer ownership, short-flick dismissal, and interruptible spring recovery. F6 enters the viewport; Shift+Tab from the viewport returns to the
previous control. Hover/focus expands the measured stack. A small hit-area bridge
preserves expansion while the pointer crosses gaps. Keyboard-created, updated, or dismissed feedback and keyboard expansion/collapse
settle immediately, including calls made outside the viewport. Pointer input
restores motion. Hover travel is enabled only for a fine pointer with hover support.
Reduced motion disables every transition and animation, including fades, recovery,
and spinner rotation; changing the preference during recovery settles it immediately.

Swipes follow Base UI's outward direction and axis locking. A recent outward
release above 0.5px/ms can dismiss a short swipe of at least 8px; a pause of 100ms
or an inward release does not count as a flick. Secondary pointers cannot take
over or end the primary drag. Cancelled drags and lost pointer capture recover
with a 250ms spring without bounce on mouse and touch. A new drag grabs the current
visible position; keyboard input immediately settles recovery. Swipe exits continue
beyond the released position. Normal entries travel 16px over 200ms; exits take
150ms. Excess notifications become inert and hidden.

`viewportProps` and `portalProps` forward Base UI customization, native props,
refs and portal containers. The viewport's children belong to the renderer.
The first version does not include an inbox, history, anchored notifications, or
arbitrary custom renderers. Very tall content and large
visible limits can exceed the viewport; keep copy brief and use a small limit.

Manual: `/#toast`. The examples simulate saving, undo an archive, and show a
three-item burst. The demo defaults to top-right to avoid its bottom-right playground. Its Position
setting exposes all six placements; Reset restores top-right.

References: [Sonner](https://github.com/emilkowalski/sonner) and
[Base UI Toast](https://base-ui.com/react/components/toast).
