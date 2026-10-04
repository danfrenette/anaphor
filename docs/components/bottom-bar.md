# Bottom bar

`BottomBar` is a full-width shell surface for persistent utilities and concise status. The manual uses it below the sidebar and article. `BottomBarGroup` separates start and end content, `BottomBarAction` supplies an interactive target, and `BottomBarStatus` truncates passive text when space is tight.

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

The component handles its surface, grouping, action states, and safe-area padding. The application decides whether the bar is fixed or in normal flow. For a fixed bar, reserve its height under scrollable content and shorten any full-height sidebar by the same amount. The manual defines `--anaphor-bottom-bar-height` on the root, including the bottom safe area, so its portaled morph surface can also sit above the bar.

The manual keeps global Search and Theme in the bottom bar. The sidebar carries navigation and identity; the morph surface carries only contextual Controls and Code. Its closed toolbar clears the bar by one gutter, and the final article has enough scroll padding to clear both surfaces.

Actions are at least 40px high on fine pointers and 44px on coarse pointers. Icon-only actions need an accessible name. Keyboard focus remains visible; reduced-motion users do not get press movement. Keep long labels and shortcuts out of narrow widths rather than allowing the utility groups to collide.

This composition draws from the current Linear desktop shell's restrained, full-width utility bar. The [bottom-bar research](../research/desktop-bottom-bars.md) records the inspected references and the limits of each source. The library parts are primitives for this shell, not a claim that shadcn/ui or Coss UI ship the same component.
