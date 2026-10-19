# Bottom bar

`BottomBar` is a full-width surface for persistent utilities and concise status. `BottomBarGroup` separates start and end content, `BottomBarAction` supplies an interactive target, and `BottomBarStatus` truncates passive text when space is tight.

```tsx
<BottomBar aria-label="Workspace utilities">
  <BottomBarGroup>
    <BottomBarAction render={<a href="/help" />} aria-label="Help">
      <Question aria-hidden="true" />Help
    </BottomBarAction>
    <BottomBarStatus>All changes saved</BottomBarStatus>
  </BottomBarGroup>
  <BottomBarGroup>
    <BottomBarAction onClick={openSearch} aria-label="Search workspace">
      <MagnifyingGlass aria-hidden="true" />Search
    </BottomBarAction>
  </BottomBarGroup>
</BottomBar>
```

The component handles its surface, grouping, action states, and safe-area padding. In a [Workspace shell](workspace-shell.md), use `appearance="integrated"` to join the shared canvas without a top border. The shell places it in the bottom row, so the content card needs no bar-specific padding and the sidebar needs no height subtraction. The manual defines `--anaphor-bottom-bar-height` only while the bar is mounted so its portaled morph surface can sit above it. The default appearance remains available in standalone layouts.

The manual keeps global Search and Theme in the bottom bar. The sidebar carries navigation and identity; the morph surface carries only contextual Controls and Code. Its closed toolbar clears the bar by one gutter, and the final article has enough scroll padding to clear both surfaces.

Actions are at least 40px high on fine pointers and 44px on coarse pointers. Icon-only actions need an accessible name. Keyboard focus remains visible; reduced-motion users do not get press movement. Keep long labels and shortcuts out of narrow widths rather than allowing the utility groups to collide.

This composition draws from the current Linear desktop shell's restrained, full-width utility bar. The [bottom-bar research](../research/desktop-bottom-bars.md) records the inspected references and the limits of each source. The library parts are primitives for this shell, not a claim that shadcn/ui or Coss UI ship the same component.

## Catalog

The reference section presents Anatomy, Appearances, and Playground with code
disclosures. Each preview owns its local Help feedback and command selection.
Playground controls change appearance, status visibility, and action labels;
Reset restores only that preview. The containing workspace uses `@container`
so `@sm:inline` action labels follow preview width rather than viewport width.
Actions keep accessible names when labels hide, and status truncates as space
narrows. These previews stay in document flow.
