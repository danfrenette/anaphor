# Breadcrumb

Compose navigation paths from native elements. `Breadcrumb` is a labeled nav;
`BreadcrumbList` is an ordered list; `BreadcrumbItem` groups a control and its
separator. Links navigate to URLs, buttons invoke in-place browsing callbacks,
and `BreadcrumbCurrent` is passive current-location text. No router, tree state,
automatic current item, collapsed path or overflow menu is included.

```tsx
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbButton,
  BreadcrumbSeparator,
} from "@anaphor/system";

<Breadcrumb aria-label="Browsing path">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbButton onClick={browseChapter} aria-label="1 Research methods">1</BreadcrumbButton>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbButton aria-current="location" onClick={browseSection}
        aria-label="1.2 Sampling">1.2</BreadcrumbButton>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

Use `BreadcrumbLink href="/library"` for ordinary anchor behavior and native
modifier-click/new-tab support. It does not add button semantics. Use
`BreadcrumbButton` for native Enter/Space activation; it owns `type="button"`
to avoid submitting surrounding forms. Native props and refs pass through.
`Breadcrumb` requires `aria-label`; links require `href`. Passive current text
requires an explicit `aria-current="page"` or `"location"`, with no fake link
role or tab stop. A current button or link receives `aria-current` from its caller.

Ancestors-only paths are supported: omit the current item when the current node
already has a heading. Consumers own navigation callbacks, current semantics,
URL changes and focus after navigation removes an activated ancestor control.
The demo moves focus to the updated heading in that case.

Place each separator at the start of its following BreadcrumbItem. It stays
outside click targets, is hidden from assistive technology and wraps with the
following control instead of becoming an orphan. Separators align with the first
text baseline when a label wraps. Supply `/` as text or compose
a decorative Phosphor glyph; the component does not infer or inject separators.

Labels use the system's small interface type. Controls have 28px desktop minimum
targets and 44px coarse-pointer targets. Items and unusually long words wrap;
focus outlines remain visible. Current items retain the same weight and change
color rather than causing text reflow. No new animation or dependency is added.
Structural and leaf components are server-compatible; callback ownership creates
the consumer's client boundary.

Install with `pnpm dlx shadcn@latest add danfrenette/anaphor/breadcrumb`.
The manual uses the primitives for its location header and demonstrates links,
clickable current paths, ancestors-only browsing and long labels at `/#breadcrumb`.
