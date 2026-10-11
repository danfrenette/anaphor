# Sidebar

The sidebar is a composable Anaphor component. The system owns its responsive
layout, open state, resize rail, keyboard shortcut, and motion; an application
supplies only its navigation groups and destinations.

Use `layout="workspace"` on `SidebarProvider` inside [Workspace shell](workspace-shell.md).
That mode makes desktop panels part of the shared canvas, without a vertical
border or separate background. The default `layout="standalone"` retains the
original in-flow grid and surface.

```tsx
<SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}>
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
    <SidebarTrigger target="desktop" />
    <SidebarInsetContent className="mx-auto max-w-5xl">
      {/* page content */}
    </SidebarInsetContent>
  </SidebarInset>
</SidebarProvider>
```

`SidebarMenuButton` keeps the current destination on a stronger selected layer
that springs between destinations. Fine pointers receive a separate, dimmer
highlight that starts from selection and follows the nearest item. Pointer
updates are coalesced to the next animation frame, so a busy mouse cannot force
more than one measurement per frame. The hover layer fades out over the selected
item without replacing selection.

`SidebarProvider` accepts `side="left"` (the default), `side="right"`, or
`side="both"`. A single `Sidebar` follows the provider's chosen edge. For
`side="both"`, render two `Sidebar` elements with explicit sides around one
`SidebarInset`:

```tsx
<SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false} side="both">
  <Sidebar side="left" aria-label="Navigation">{/* navigation */}</Sidebar>
  <Sidebar side="right" aria-label="Context tools">{/* task context */}</Sidebar>
  <SidebarInset>{/* page content */}</SidebarInset>
</SidebarProvider>
```

At wide desktop widths, both panels share the provider's open state. From the
`md` breakpoint until `lg`, the right panel is hidden so the reading area keeps
usable width. On mobile, `both` uses one left modal drawer and omits the right
panel, retaining one focus trap and one dismissal path. Each desktop rail stores
its own width in `both` mode. The
right rail grows toward the page for pointer and arrow-key resizing.

Pointer toggles take 240ms to open and 160ms to close, with the shared ease-out
curve. In a workspace, one progress value coordinates the rail, card boundary,
and aligned content. Their gutter stays constant throughout the transition,
including a reversal. Surface transforms avoid animating layout dimensions;
card children counter-scale so text and controls keep their natural scale.
Wrap independently centered or aligned page content in `SidebarInsetContent`
(and put its `max-width` / auto margins on that component) to register its position.
Content adopts its destination layout once and may rewrap at narrower widths.
Standalone sidebars retain position-only layout projection. Keyboard toggles and
reduced-motion preferences settle positions immediately. Closed desktop panels
are inert immediately, including while their exit is still visible.
Menu hover and selection continue to use the shared spring tiers.

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

Keep resizing off with `resizable={false}`. To enable it, set `resizable={true}` on
`SidebarProvider` and render `SidebarRail` inside `Sidebar`. Drag the rail to
resize within the width limits, or focus it and use Left/Right arrows. Clicking
the rail or pressing Enter/Space collapses the sidebar. Its width token is
resolved on the provider so each sidebar can resize independently.

With `shortcut="b"`, the desktop trigger responds to Command+B or Control+B. Keyboard
toggles are intentionally instant; pointer toggles retain the spatial motion.
Set `shortcut`
to another key or `null` on `SidebarProvider` when an application owns that
shortcut. Use `target="mobile"` for the trigger shown below the `md` breakpoint.

Provider configuration is explicit: `shortcut` and `resizable` are required.
Use `mode="uncontrolled"` with `defaultOpen` for component-owned state, or
`mode="controlled"` with `open` and `onOpenChange` for caller-owned state.
Controlled providers reject `defaultOpen`; uncontrolled providers reject `open`.
Triggers require `target`, and menu buttons require `isActive`.
