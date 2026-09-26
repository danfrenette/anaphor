# Component prop contracts

Component-owned configuration is explicit. A prop that previously received a
default is required at the call site; the implementation does not silently
substitute that default. Demos, documentation, and registry consumers supply
the intended values.

This is a breaking source API change. Existing consumers must supply omitted
options such as Button size, shape, loading, iconOnly, and rendering mode;
Badge size, shape, and variant; Card variant; Input size; Field orientation;
MenuPopup positioning; and the element and variant for typography.

## Configuration-dependent props

| Component | Configuration | Required | Rejected |
| --- | --- | --- | --- |
| SidebarProvider | `mode="controlled"` | `open`, `onOpenChange`, `shortcut`, `resizable` | `defaultOpen` |
| SidebarProvider | `mode="uncontrolled"` | `defaultOpen`, `shortcut`, `resizable` | `open` |
| Button | `variant="solid"`, `"outline"`, `"ghost"`, or `"soft"` | shared button options, `tone="accent"`, `"neutral"`, or `"danger"` | — |
| Button | `nativeButton={true}` | `type` | — |
| Button | `nativeButton={false}` | `render` | `type` |

The rendering mode is a discriminated union. `?: never` forbids a property in a branch; it
does not provide an optional configuration value. Runtime fallback casts and
non-null assertions are not needed to consume these types.

Independent states remain independent. For example, loading and disabled can
coexist, as can a card's description, action, and footer. Forcing them into
mutually exclusive states would remove supported behavior.

Genuinely optional content, callbacks, positioning anchors, and native/third-party
passthrough attributes remain optional. This pass does not redefine upstream
React or Base UI APIs. The button playground configures variant and tone
independently. `HoldButton` uses the shared soft variant and accepts a tone,
duration, and completion callback; it owns the hold input behavior while
consumers own the completed action.

`configuration.types.tsx` checks valid combinations and compile-time rejection
of invalid ones. `text.types.tsx` checks native element refs and events.
