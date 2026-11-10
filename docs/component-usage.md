# Component usage

Browse the [live reference manual](https://anaphor.vercel.app) for interactive
examples. These notes cover composition and integration; detailed component
contracts live in [components/](components/).

## Card composition

Card is a passive container with a 12px radius and a theme-neutral surface.
Compose optional `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
`CardContent`, and `CardFooter` from `@anaphor/system`. They live in
one module and work in Server Components without a client boundary.

Sections own 24px padding, with shared spacing between adjacent sections.
Place edge-to-edge media directly inside Card and use `rounded-t-card` when
it touches the top corners. Card does not clip content or focus rings.
Use `CardTitle as="h2"` (or another heading level) when the default `h3`
does not fit the page hierarchy. Put navigation and actions in controls
inside the card; Card itself has no interactive behavior.
Use `CardTitle className="font-mono"` for monospaced headings; combine it with
`text-label tracking-[0.08em] uppercase` for the manual’s technical labels.

## Breadcrumb

Compose `Breadcrumb`, `BreadcrumbList`, and `BreadcrumbItem` with native
`BreadcrumbLink` or `BreadcrumbButton`. `BreadcrumbCurrent` carries explicit
page/location semantics; `BreadcrumbSeparator` stays outside targets.
See [Breadcrumb](components/breadcrumb.md) and `/#breadcrumb`.

## Tag button

`TagButton` composes Button into a round, wrapping action pill. Use `ButtonLabel`
for its text and compose decorative icons beside it. Size, tone, variant and
loading stay explicit; shape, text-bearing layout and native non-submitting
button semantics belong to the component. Callers own tag actions and state.
See [Tag button](components/tag-button.md) and the manual at `/#tag-button`.

## Button variants

Choose `solid`, `outline`, `ghost`, or `soft` independently of the `accent`,
`neutral`, or `danger` tone. For a destructive action, use `tone="danger"`;
the hold button pairs that tone with the soft variant and a clipped reveal.

## Button composition

Group all button text inside `ButtonLabel`, including interpolated or formatted
text. Icons sit alongside it; icon-only buttons use an accessible name.

```tsx
import { Button, ButtonLabel } from "@anaphor/system";

<Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid">
  <ButtonLabel>Save {count} items</ButtonLabel>
</Button>
```

Use `iconOnly` for an icon without text and supply `aria-label`. The same
`size` values apply; `shape="round"` makes the square target circular. While
loading, the spinner crossfades with the icon without changing the dimensions.
Text buttons smoothly make room for the spinner while keeping their label.
`loading` blocks activation and preserves focus and color; `disabled` applies
the gray treatment. Combine both for a gray loading button. Reduced motion
disables the transition and spinner rotation.

`ButtonLabel` renders a span and owns the optical text offset. Raw text is not
automatically wrapped or adjusted.

For a button rendered as an anchor, pass `nativeButton={false}` and
`render={<a href="#card" />}`. Base UI retains button semantics (including
Space activation) and blocks ordinary pointer/keyboard navigation while loading
or disabled. Use a plain anchor for ordinary link semantics.


## Morph Surface

`MorphSurface` accepts `open`, `onOpenChange`, `title`, `icon`, and `children`. Position
its wrapper at the desired bottom-right anchor. It supplies the trigger, close
control, clipped reveal, viewport bounds, and keyboard focus return.

Inline and portaled content share Escape handling. Children can consume Escape
before it closes the surface. Optional `onInteractionChange` reports whether focus
is in the open content or a pointer is held on the surface, allowing a consumer to
pin its own selection. Closed content stays mounted but becomes inert immediately.

Pointer and keyboard activation reveal from the bottom right over 300ms. The
surface fades out over 200ms, with geometry collapse delayed by 80ms so it does
not mask the fade; the shared dot follows its own spring. Text remains unscaled,
reduced motion keeps only the 200ms opacity fade, and interrupted reveals reverse
from their current state. Escape, the close button, and an outside press all use
that same dismissal path.

Its animation is adapted from the user-supplied **Devouring Details Morph Surface**
prototype ([reference](https://devouringdetails.com/resources/component-library)).
The reference's fonts and global stylesheet are not included; our existing tokens
provide the surface, text, and accent colors.

## Input and field feedback

`Input` wraps Base UI Input with our theme, `sm`/`md`/`lg` sizes (default `md`),
16px text, and a 44px minimum height on coarse pointers. Numeric `size` values
pass through to the native attribute. Native input props and refs remain available;
`className` also accepts Base UI's state callback.

Compose `Field`, `FieldLabel`, `Input`, and `FieldDescription` to associate labels
and descriptions automatically. `FieldError` wraps Base UI's error display;
for externally controlled errors, render it conditionally with `match={true}`.
Field props, native refs, render composition, and state-aware classes pass through.

`FieldFeedback` belongs inside `Field` and accepts `hint`, `error`, `invalid`,
and an optional `id`. It reserves space for both messages and uses one live
accessible description alongside the animated visual text. Supply the error
before it is shown so its space can be reserved. Reduced motion removes motion.
Use it instead of a separate description/error pair when you want the animated
hint-to-error treatment.

Base UI's default `onSubmit` validation revalidates after submission. Our example
uses a native form with `noValidate` and explicitly controls `Field invalid` to
preserve the policy below; the wrapper does not install a validation engine.

The form owns validation: validate on blur or submit, clear the displayed error
on the first edit, and do not revalidate during typing pauses. Clearing feedback
does not mean the value is valid. The demo uses native email validity and performs
no network requests. Ordinary valid fields return to neutral.

## Checkbox

`Checkbox` is a thin Base UI wrapper with a 20px box, 6px corners, and built-in
Phosphor check/mixed marks. Compose it with `Field orientation="horizontal"` and a sibling `FieldLabel`
for a 44px label target. Put the label and description in `FieldContent` when
the row needs supporting text. Checkbox stays focused on the control itself.

Controlled and uncontrolled values, native form props, `inputRef`, read-only,
and disabled behavior pass through to Base UI. `indeterminate` represents a
partially selected set: derive it from child values, with `checked={false}` for
the mixed state. Activation then selects the set; it is not a third toggle step.

Selection and label color update immediately. Unchecked checkbox and unselected radio labels use muted
text; selected and mixed labels use primary text. Disabled labels use muted text
at 60% opacity, regardless of selection. This applies to sibling labels and
labels nested in `FieldContent`, without dimming the row or its description.
The checkbox mark stays light in both themes so it contrasts with the accent
fill. Required validation belongs to the consuming form. The demo presents the
required state without a standalone submission flow.

Use `CheckboxGroup` for a paintable `div`. Use `useCheckboxPaint()` when an
existing element already owns the group, such as an ordered list. Spread all
returned handlers on that element and place each `Checkbox` in its own `Field`.
If you have handlers for the same events, call them before the paint handlers.

```tsx
const paint = useCheckboxPaint();
return <ol {...paint}>
  <li><Field orientation="horizontal"><Checkbox /><FieldLabel>Updates</FieldLabel></Field></li>
  <li><Field orientation="horizontal"><Checkbox /><FieldLabel>Reminders</FieldLabel></Field></li>
</ol>;
```

A mouse or pen drag applies the starting checkbox's next state to the enabled,
editable checkboxes it visits. Each is painted once per gesture. Touch, keyboard,
and single clicks retain their usual behavior. Controlled checkboxes keep using
`checked` and `onCheckedChange`. The hook is available from `@anaphor/system`
and the installed `checkbox` registry module. Registry consumers also install
`field` for the `Field` and `FieldLabel` composition.

## Typography

Use `Text` variants for headings, body copy, interface text, labels, captions,
and code. Wrap native article or rendered Markdown content in `Prose` for
consistent spacing and 90% text alpha. Headings use Bell Gothic Black.
See [Typography](components/typography.md) for the API and examples.

## Workspace shell

Compose a full-width top strip, left and right sidebars, an inset content card,
and optional bottom utilities with `WorkspaceShell`. The card is the only
required region; see [Workspace shell](components/workspace-shell.md) for
the component API and [its verification recipe](verification/workspace-shell.md).

## Dropdown menu

Use `Menu`, `MenuTrigger`, and `MenuPopup` for a trigger-anchored list of actions;
groups, labels, separators, shortcuts, and a destructive item treatment are also
included. Base UI owns focus, keyboard navigation, collision handling, dismissal,
and focus return. The popup scales from Base UI's trigger-relative transform
origin over 180ms while the trigger keeps a stable outer box. Pointer movement
glides one shared highlight between nearby enabled actions without forwarding
gap clicks; labels and separators break the path. Keyboard highlighting is
immediate, and reduced motion removes travel. The reference manual includes a
file-actions example.

## Shared Tailwind tokens

The library's `src/styles-base.css` owns the Tailwind v4 configuration consumed by the
manual and copied by the registry. Use semantic color utilities (`bg-background`,
`text-muted-foreground`, `border-border`), named text sizes (`text-ui`,
`text-body`, `text-heading`, `text-title-small`, `text-title`), and named radii
(`rounded-sm`, `rounded-md`, `rounded-control`, `rounded-card`). Numeric spacing
uses the configured 4px base: `gap-2` is 8px and `p-6` is 24px. Keep Tailwind's
numbering instead of introducing another spacing scale.

Layout defaults are exported from the same stylesheet: `max-w-workspace`
(96rem), `max-w-editorial` (70rem), `max-w-reading` (65ch), and `px-page-inset`
(the responsive page gutter capped at 3rem). See `/foundations#layout-reference`
and [layout recipes](layout-recipes.md) for cross-project imports, overrides,
and the distinction between shared variables and composition-specific spacing.

Prefer utilities directly in demo markup. For remaining relational/responsive
CSS, `@reference "@anaphor/system/styles.css"` makes the same tokens available to
`@apply` without emitting a second copy of the library styles. Dynamic artwork
colors and rendering geometry remain local while those experiments mature.

## Field composition

`Field` keeps Base UI's automatic labels, descriptions, validation, render
composition, refs, and state-aware classes. Its default vertical layout is
unchanged. Use `orientation="horizontal"` for checkbox rows; the label has a
44px minimum target. `FieldContent` groups a label and description beside the
control without manual indentation. `FieldGroup` stacks related fields with
16px gaps and makes checkbox rows paintable by mouse or pen drag. Touch keeps
native scrolling, and each checkbox still works independently by click, tap,
or Space. It is a layout div, so keep a native fieldset/legend when the group
needs a semantic name. Both wrappers accept native div props and refs.

```tsx
<FieldGroup>
  <Field orientation="horizontal">
    <Checkbox name="updates" />
    <FieldContent>
      <FieldLabel>Keep me updated</FieldLabel>
      <FieldDescription>Occasional product news.</FieldDescription>
    </FieldContent>
  </Field>
</FieldGroup>
```

The composition vocabulary borrows from shadcn/ui Field; behavior remains a thin
Base UI wrapper in the style of Coss. FieldFeedback and the consuming form's
validation timing are unchanged.

### Section navigation and shortcuts

The main manual uses `ContentSections` and `Section` for document navigation. `j`/`k`
move between visible sections in DOM order, `gg` selects the first, and `Shift+G`
selects the last. Navigation stops at the ends. Each move focuses the section so
Tab continues into its content, scrolls below the configured header offset in
100 ms, and updates `useContentSections().activeId`. Reduced motion jumps immediately.
Wheel, touch, or pointer interaction interrupts the scroll; repeated navigation
retargets from its current position. Ordinary scrolling also updates active state.
By default, navigation scrolls the document viewport. Pass `scrollContainerRef`
to `ContentSections` to navigate inside a scrollable card body, as the manual does.

```tsx
import { ContentSections, Section, useContentSections, useShortcut } from "@anaphor/system";

<ContentSections defaultScope>
  <Section id="introduction"><h1>Introduction</h1></Section>
  <Section id="details"><h2>Details</h2></Section>
</ContentSections>
```

`useContentSections` exposes `activeId`, `goTo(id)`, `next()`, `previous()`, `first()`,
and `last()`. Place a consumer-owned contents navigation inside `ContentSections` to
share that state. `Section` renders a native section (or `as="header"`), requires
a unique stable ID, and supports normal HTML attributes. Hidden/inert sections
are skipped. Navigation scrolls the viewport or the supplied `scrollContainerRef`.
Set `--anaphor-section-offset` on `ContentSections` to clear a sticky header; it
defaults to zero. For example, use
`[--anaphor-section-offset:calc(var(--header-height)+var(--spacing)*8)]`
and use the same `--header-height` variable for the header. Both native anchor
scrolling and keyboard navigation use the section’s computed `scroll-margin-top`.

Use `enabled={false}` to disable shortcuts. Override `bindings.next`, `previous`,
`first`, or `last` with TanStack hotkey strings or sequence arrays; set a binding
to `null` to disable just that action. A focused group owns its shortcuts. Only
one group per page should opt into `defaultScope`, which handles focus outside
all groups. Nested groups own their own sections and shortcuts.

`useShortcut("Mod+B", callback, options)` registers an application shortcut;
`useShortcut(["G", "G"], callback)` registers a sequence. It uses TanStack Hotkeys'
matcher with a 1,000 ms default timeout. Focus changes, window blur, composition,
and mismatching keys cancel partial sequences. Held keys never complete a
sequence; single shortcuts repeat only with `repeat: true`.

Options include `enabled`, `scope` (an element ref), `defaultScope`, `timeout`,
`preventDefault`, and an event-time `when` predicate. Focused inner scopes take
precedence over outer/global shortcuts; equal scopes resolve in registration
order. Already-handled events are respected. Editing fields and composite widgets
are excluded unless `allowInInputs` or `allowInWidgets` is explicitly enabled.
Use `data-shortcuts="off"` on a custom widget to opt out. Modal dialogs suppress
background shortcuts; a scope inside the dialog can handle its own keys. Custom
modal implementations without `aria-modal` can mark their open surface with
`data-shortcut-modal`. AdaptiveSurface does this automatically.

Stable IDs support incoming hash links and normal contents links. Passive scrolling
and keyboard navigation do not rewrite the URL or add history entries. Shortcut
hints, help interfaces, and remapping controls belong to the consumer. Local widget
Escape and arrow behavior remains owned by its accessible component.

## Themes and the persistent surface

Install theming on its own, or use the full `ui` install:

```sh
pnpm dlx shadcn@latest add danfrenette/anaphor/theme
```

```tsx
import { ThemeProvider, ThemeToggle } from "@/components/ui/theme";

<ThemeProvider>
  <ThemeToggle />
  {children}
</ThemeProvider>
```

For server-rendered apps, add `suppressHydrationWarning` to the root `<html>`.
The provider follows the system initially, stores explicit choices under
`anaphor-theme`, and synchronizes them across tabs. It accepts next-themes
provider options (including `nonce` for CSP). `useTheme()` exposes the theme
state, `setTheme("system")`, and `toggleTheme(element)` for custom controls.
ThemeToggle reveals the new theme from the button using a 350ms circular clip path
with ease-in-out timing;
unsupported browsers, keyboard activation, and reduced-motion users get an immediate
change. Color transitions are disabled during theme changes.

`MorphSurface` is a nonmodal, persistent surface on both desktop and mobile.
Pass `bar={({ panelId }) => ...}` to compose its resting actions; associate
expansion buttons with that panel ID using `aria-controls` and `aria-expanded`.
Control `open`, set `viewKey` when content changes, and use `wide` for code.
The surface measures content and animates its height, keeps its bar available,
and respects reduced motion. Set `animate={false}` for keyboard interactions and
`focusOnOpen={false}` when tabs should retain focus. Escape and its close action restore trigger focus;
an outside press closes without stealing focus. It does not trap focus or
block page scrolling.

The manual pairs a direct Theme action with Controls and Code tabs. The tabs share
the system indicator and hover treatment; keyboard focus and selection are immediate.
Controls follow the section
in view, stay pinned while a control has focus or a pointer is held, and become
unavailable outside configurable sections. Code shows minimal installation and
usage examples, with horizontally scrollable text and separate copy buttons.

## Collapsible sections

Compose reusable disclosures and a nested Sidebar outline with controlled or initial state. See [Collapsible](components/collapsible.md) for examples, keyboard behavior, and the Pierre Trees evaluation.

## Change tours

The tour reader composes business cases, the shared [Diff](components/diff.md), and
[MediaViewer](components/media-viewer.md). Tour adapters own pinned source, capture annotations,
verification facts, and asset URLs. See [local tour verification](verification/local-tours.md).

## Toast notifications

`Toaster` uses Base UI for notification state and accessibility, with an
Anaphor stack inspired by Sonner. Mount one per manager, supplying `toastManager`,
`position`, `timeout`, and `limit`; use `toast.add`, `update`, `close`, or `promise`
from client code. `createToastManager` creates an isolated host. See
[Toast](components/toast.md) and the manual at `/#toast`.
