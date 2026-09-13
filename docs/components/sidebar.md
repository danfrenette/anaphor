# Sidebar

The sidebar is a composable Anaphor component. The system owns its responsive
layout, open state, resize rail, keyboard shortcut, and motion; an application
supplies only its navigation groups and destinations.

```tsx
<SidebarProvider>
  <Sidebar>
    <SidebarHeader>{/* identity and actions */}</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Components</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive render={<a href="#button" />}>
              Button
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>{/* status */}</SidebarFooter>
    <SidebarClose />
  </Sidebar>
  <SidebarInset>
    <SidebarTrigger />
    {/* page content */}
  </SidebarInset>
</SidebarProvider>
```

`SidebarMenuButton` keeps the current destination on a stronger selected layer
that springs between destinations. Fine pointers receive a separate, dimmer
highlight that starts from selection and follows the nearest item. Pointer
updates are coalesced to the next animation frame, so a busy mouse cannot force
more than one measurement per frame. The hover layer fades out over the selected
item without replacing selection.

Motion uses the shared `spring.fast`, `spring.moderate`, and `spring.slow`
tiers. Hover fades quickly and travels at the moderate tier, selection travel is moderate, and the larger canvas shift
is slow. Closing is one tier quicker than opening. Reduced-motion preferences
preserve opacity and color feedback while removing positional travel.

Desktop and mobile layout are controlled by Tailwind breakpoint and pointer
variants. `AdaptiveSurfaceProvider` uses a shared media-query subscription only
where the interaction modality changes: the desktop sidebar is in-flow and the
mobile sidebar is a modal dialog with focus containment, scroll locking,
outside/Escape dismissal, and focus return. It does not synchronize viewport
state through an effect. The default width,
mobile width, resize limits, and transition duration use
`--anaphor-sidebar-*` tokens and can be overridden at a composition boundary.
Typography, spacing, touch targets, colors, and breakpoints use Anaphor and
Tailwind design-system values.

Resizing is disabled by default. To enable it, set `resizable` on
`SidebarProvider` and render `SidebarRail` inside `Sidebar`. Drag the rail to
resize within the width limits, or focus it and use Left/Right arrows. Clicking
the rail or pressing Enter/Space collapses the sidebar. Its width token is
resolved on the provider so each sidebar can resize independently.

The default desktop trigger responds to Command+B or Control+B. Keyboard
toggles are intentionally instant; pointer toggles retain the spatial motion.
Set `shortcut`
to another key or `null` on `SidebarProvider` when an application owns that
shortcut. Use `target="mobile"` for the trigger shown below the `md` breakpoint.
