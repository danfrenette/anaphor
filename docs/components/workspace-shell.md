# Workspace shell

`WorkspaceShell` places a content card on a continuous application canvas. Its
top row, left navigation, right context, and bottom utilities are independent,
optional regions. The card is the only required region. Omitted regions take no
space and leave no divider or focusable placeholder.

```tsx
<Tabs defaultValue="overview" className="contents">
  <WorkspaceShell>
    <SidebarProvider mode="uncontrolled" defaultOpen={true}
      shortcut="b" resizable={false} side="both" layout="workspace">
      <WorkspaceTopBar>
        <div className="col-start-2 flex items-center px-2">
          <TabsList aria-label="Workspace views">
            <TabsTab value="overview">Overview</TabsTab>
            <TabsTab value="activity">Activity</TabsTab>
          </TabsList>
          {/* Supply add and close actions here if the application needs them. */}
        </div>
      </WorkspaceTopBar>
      <Sidebar side="left" aria-label="Navigation">{/* navigation */}</Sidebar>
      <Sidebar side="right" aria-label="Context">{/* context */}</Sidebar>
      <SidebarInset>
        <WorkspaceCard>
          <WorkspaceCardHeader>{/* breadcrumb or page actions */}</WorkspaceCardHeader>
          <WorkspaceCardBody>
            <TabsPanel value="overview">{/* overview */}</TabsPanel>
            <TabsPanel value="activity">{/* activity */}</TabsPanel>
          </WorkspaceCardBody>
        </WorkspaceCard>
      </SidebarInset>
      <BottomBar appearance="integrated" aria-label="Utilities">
        {/* groups and actions */}
      </BottomBar>
    </SidebarProvider>
  </WorkspaceShell>
</Tabs>
```

`WorkspaceTopBar`, either `Sidebar`, `WorkspaceCardHeader`, and `BottomBar` may
be omitted. A top row may contain controls without tabs. `Tabs` owns selection
and keyboard navigation; the application supplies labels, panels, and optional
add or close controls. The breadcrumb belongs inside `WorkspaceCardHeader`.
Keep the card body as the scroll container for long content. If using
`ContentSections`, pass its `scrollContainerRef` to the body so active section
tracking and section navigation follow that scroll container.

The shell fills the viewport by default. For an embedded preview, override its
position and height, for example `className="relative inset-auto h-80"`. It
provides three grid columns and three rows; the top and bottom span all columns.
The left and right columns size to their contents, or collapse when omitted.
On desktop, the card has its own gutter, background, radius, and shadow. Sidebars in
`layout="workspace"` and the integrated bottom bar use the shell's canvas
without outer borders. Standalone sidebar and bottom bar appearances remain
available for compositions outside this shell.

At medium widths the second sidebar hides. On mobile, the sidebar uses a modal
drawer and the card becomes a flush page surface without a desktop gutter,
rounded perimeter, or shadow. The card body and utilities remain reachable.
When a bottom bar is omitted, no height should be reserved for it. Floating controls that need
clearance can use `--anaphor-bottom-bar-height` only while a bar is mounted.

Workspace sidebar toggles keep the rail and content-card boundary separated by
the same gutter on every frame. The shared transition transforms the card surface
and counter-scales its contents, keeping text at its natural scale. Use
`SidebarInsetContent` for independently aligned content. Keyboard toggles,
reduced motion, viewport changes, and text direction changes settle the destination
layout immediately.
