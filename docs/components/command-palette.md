# Command palette

`CommandPalette` is a controlled search dialog. It takes typed items with unique
IDs, labels, groups, optional icons, search keywords, and disabled states. Extra
consumer fields survive in the inferred `onSelect` item type. Consumers own the
trigger, open state, and effects; the package owns filtering, focus, dismissal,
and presentation. It uses the existing Base UI Autocomplete and Dialog primitives.

```tsx
const [open, setOpen] = useState(false);
useShortcut("Mod+K", () => setOpen(true), { allowInInputs: true });

<CommandPalette
  open={open}
  onOpenChange={setOpen}
  title="Search the manual"
  animateHighlight={false}
  items={[{ id: "button", label: "Button", group: "Components", href: "/#button", shortcut: ["G", "B"] }]}
  renderTrailing={item => (
    <KbdGroup aria-label="G then B">
      {item.shortcut.map(key => <Kbd key={key}>{key}</Kbd>)}
    </KbdGroup>
  )}
  onSelect={item => navigate(item.href)}
/>
```

`useShortcut` uses TanStack Hotkeys. `Mod+K` means Command-K on macOS and
Control-K elsewhere. The palette does not register or interpret that binding;
the consumer owns shortcut behavior. Escape, the close control, and outside
presses dismiss; focus returns to the invoking control. A new opening clears the previous query.
Search matches label, group, and keywords, ignoring case and surrounding spaces.
Arrow keys navigate results; Enter runs the highlighted command. Disabled items
cannot execute. Empty results provide an explicit recovery message.

`renderTrailing(item)` adds compact, presentational content at the inline end of
an item. The palette owns its alignment and truncates a long label before the
rail; the consumer owns the rail's content and accessibility. It is not included
in filtering and must not contain interactive controls. Use `Kbd` and
`KbdGroup` for shortcut hints, or return another non-interactive icon or label.
The hint does not register a shortcut—the application wires the corresponding
behavior independently. Without `renderTrailing`, the row has no trailing
affordance; the footer still explains the palette-owned Enter behavior.

## Composition and inspiration

- [shadcn/ui Command](https://ui.shadcn.com/docs/components/base/command):
  the Basic, Shortcuts, Groups, and Scrollable examples establish the familiar
  search-first anatomy, grouped destinations, keyboard hints, and bounded list.
  The [documentation launcher](https://github.com/shadcn-ui/ui/blob/main/apps/v4/components/command-menu.tsx)
  is the closest application example to this manual.
- [Fluid Functionalism](https://www.fluidfunctionalism.com/): one traveling
  highlight can communicate pointer movement when `animateHighlight` is enabled.
  It defaults to `false`: frequent commands should respond immediately. Existing Anaphor springs own the
  timing; keyboard changes and reduced motion are immediate. Group changes
  start a fresh highlight rather than traveling through a heading.
- [Interior](https://www.interior.dev/): stable text and search geometry, restrained
  feedback, and a finished dismiss/reopen cycle. This is principle-level
  inspiration, not a claim that Interior supplies this command component.
- [Devouring Details](https://devouringdetails.com/): ergonomic interaction,
  responsive interfaces, and purposeful motion govern these choices. The public
  principles and this repository's established rules are the reference; no
  private course material was copied.

Anaphor's `Text` roles compose the surface: Bell Gothic subheading, Inter UI
labels and categorical group names, and caption-sized keyboard instructions.
The search input stays at 16px. Floating tools use the shared card radius and
shadow. Opening and closing are immediate for this frequently used control.
The top anchor is stable during filtering. Desktop opening focuses search;
coarse-pointer opening focuses the dialog so it does not summon a virtual
keyboard before the user asks to type. The search icon does not block input hits.

## Manual shell

The sidebar header carries identity in a compact mark/name/subtitle row. Search lives in the bottom bar, where it remains available across pages and no longer repeats in the sidebar. The mobile close button has its own column.
The unsupported New component action and misleading brand chevron are removed.
Search uses the same destination data as navigation, so it cannot advertise
unsupported pages. The manual uses the instant default. The Command palette section explains the
philosophy and provides a separate example with morph-surface controls for
highlight animation, icons, and shortcut hints. Reset restores instant highlights,
visible icons, and visible shortcuts.
