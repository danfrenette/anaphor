# Adaptive surface

`AdaptiveSurfaceProvider` lets one surface remain in-flow on desktop and become
a modal dialog on mobile. It owns the semantic switch—focus containment, scroll
locking, dismissal, and focus return—while the consumer continues to own its
layout and visual styling.

```tsx
<AdaptiveSurfaceProvider mobileQuery="(max-width: 47.999rem)"
  desktopOpen={desktopOpen}
  mobileOpen={mobileOpen}
  onDesktopOpenChange={setDesktopOpen}
  onMobileOpenChange={setMobileOpen}
>
  <AdaptiveSurfaceTrigger>Open filters</AdaptiveSurfaceTrigger>
  <AdaptiveSurfacePortal>
    <AdaptiveSurfaceBackdrop className="fixed inset-0 bg-black/35" />
    <AdaptiveSurfacePopup render={<aside />}>{children}</AdaptiveSurfacePopup>
  </AdaptiveSurfacePortal>
</AdaptiveSurfaceProvider>
```

The required `mobileQuery` in this example matches Tailwind's `md` boundary.
Use a different query when a surface changes modality at another boundary. Visual responsiveness
should still use Tailwind variants; the query exists only because modal and
in-flow surfaces have different accessibility behavior.

The query is consumed with `useSyncExternalStore` and shared by query string,
so multiple adaptive surfaces do not need separate resize effects or copied
viewport state. `AdaptiveSurfaceClose` supplies the required in-dialog close
control for touch screen readers.
