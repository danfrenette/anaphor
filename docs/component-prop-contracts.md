# Component prop contracts

Component-owned configuration is explicit. A prop that previously received a
default is required at the call site; the implementation does not silently
substitute that default. Demos, documentation, and registry consumers supply
the intended values.

This is a breaking source API change. Existing consumers must supply omitted
options such as Button size, shape, loading, iconOnly, and rendering mode;
Badge size, shape, and variant; Card variant; Input size; Field orientation;
MenuPopup positioning; and the element and variant for typography.

## Disclosures, menus, and contextual information

Use Anaphor's exported controls for every application disclosure and dropdown.
`Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` own expandable
supporting content. `Menu` and `Select` own their respective action and choice
menus. Native `<details>` and `<summary>` are not substitutes for these controls.
Design mockups must show the shared control treatment rather than a browser
summary marker. Inspect expanded state, keyboard activation, and focus return
before handing off a working implementation.

Use `Popover` for short explanations attached to evidence icons. Give each
trigger an accessible name and support click, keyboard, and touch activation.
Keep the card navigation link and its popover buttons as separate targets;
a link must not contain interactive buttons. Keep required evidence gaps visible
in the case as text, even when an icon's meaning is explained in a popover.

Media proof remains visible beside the supported claim. A screenshot preview and
an explicit MediaViewer action belong in the main reading path; receipt
and provenance disclosures supplement the media rather than hide its entry point.
Recordings retain inline moment navigation until the shared API supports a
complete playback handoff.

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

`FieldItem` requires `orientation`, matching Field's layout contract. RadioGroup
and Radio preserve Base UI's generic value/state and rendering props; the
indicator uses Checkbox's fixed geometry rather than adding visual configuration.
`radio-group.types.tsx` checks value inference and public refs/composition.

`TagButton` deliberately owns round shape, text-bearing layout, native rendering
and non-submitting button type. Its remaining Button configuration (`size`,
`tone`, `variant`, `loading`) stays explicit. See [Tag button](components/tag-button.md).

`Breadcrumb` requires an accessible navigation label; `BreadcrumbLink` requires
its href; passive `BreadcrumbCurrent` requires explicit page/location semantics.
`BreadcrumbButton` owns the non-submitting native button type. Separators are
explicit decorative children grouped inside their following item, outside targets.
See [Breadcrumb](components/breadcrumb.md).
