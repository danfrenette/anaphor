# Kbd

`Kbd` presents one keyboard key. `KbdGroup` composes keys into a chord or
ordered sequence. Both render native `kbd` elements, forward their native
attributes, and remain presentational: displaying a key never registers a
shortcut.

```tsx
<Kbd>Esc</Kbd>

<KbdGroup aria-label="Command K">
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>

<KbdGroup aria-label="G then A">
  <Kbd>G</Kbd>
  <Kbd>A</Kbd>
</KbdGroup>
```

Kbd uses Magda Clean Mono at its available regular weight. A 20px keycap,
20px minimum width, 4px horizontal padding, and 4px radius follow the shared
spacing rhythm. The background, inset keyline, and restrained bottom edge make
the key legible without turning it into an interactive control. Keycaps ignore
pointer events and text selection so controls containing them keep ownership of
interaction.

`KbdGroup` only arranges its children with a 4px gap. It does not infer whether
keys form a chord or sequence and does not add punctuation. Add a literal
separator when the surrounding notation requires one. Symbol-only shortcuts
need an accessible label such as `aria-label="Command K"`; decorative icons
inside a key should be hidden from assistive technology.

Applications own platform selection and formatting. TanStack Hotkeys can format
`Mod` as Command on macOS and Control on Windows or Linux, but Kbd deliberately
accepts rendered children rather than a shortcut binding. A shortcut-aware
formatter belongs in a separate composition.

## References

[coss Kbd](https://coss.com/ui/docs/components/kbd) supplies the small `Kbd`
and `KbdGroup` composition and native-attribute passthrough. [shadcn/ui
Kbd](https://ui.shadcn.com/docs/components/base/kbd) demonstrates the same
primitive across buttons, tooltips, input groups, and command rows. Anaphor
keeps that architecture while applying its own mono typography, geometry,
surface treatment, and accessibility guidance.
