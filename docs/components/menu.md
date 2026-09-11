# Dropdown menu

A trigger-anchored list of actions built on Base UI Menu. The exported `Menu*`
names follow Base UI and coss ui.

```tsx
<Menu>
  <MenuTrigger render={<Button variant="outline" />}>File actions</MenuTrigger>
  <MenuPopup align="start">
    <MenuGroup>
      <MenuGroupLabel>Document</MenuGroupLabel>
      <MenuItem>Rename</MenuItem>
      <MenuItem>Move to…</MenuItem>
    </MenuGroup>
    <MenuSeparator />
    <MenuItem variant="destructive">Delete</MenuItem>
  </MenuPopup>
</Menu>
```

Base UI owns focus, dismissal, collision handling, keyboard navigation, and focus
return. `MenuPopup` owns the portal and positioner, defaults to a 6px gap, and
accepts `side`, `align`, their offsets, `anchor`, and `portalProps`.

Items have a 36px minimum height, expanding to 44px for coarse pointers. Use
`MenuGroupLabel` for named groups, `MenuSeparator` between distinct groups, and
`MenuShortcut` only as a visible hint—the application still owns the shortcut.
`variant="destructive"` is reserved for destructive actions.

## Motion

Pointer-opened menus use opacity and scale from `0.95` over 180ms with the shared
strong ease-out curve. The transform origin is supplied by Base UI, so the menu
appears to grow from its trigger and reverses along the same path on exit. Base
UI marks keyboard activation as instant, so repeated key-driven actions never wait
for motion. Reduced motion removes scale and keeps a 200ms opacity fade for pointer
activation.

## Reference decisions

[coss Menu](https://coss.com/ui/docs/components/menu) supplies the mechanical
composition: a Base UI root, trigger, portal, positioner, popup, groups, items,
labels, separators, and shortcuts. Anaphor applies its own typography, 4px rhythm,
control geometry, color roles, touch targets, and restrained elevation.

[Devouring Details Button](https://devouringdetails.com/system/button) informs
the tactile trigger and the separation between shape, surface, and behavior. The
dropdown reuses Anaphor Button rather than introducing a parallel trigger style.
