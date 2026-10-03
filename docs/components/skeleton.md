# Skeleton

Skeleton separates the placeholder from the loading lifecycle. The shape primitive
follows shadcn/ui; the content-aware composition keeps the actual layout mounted.
There is no duplicate loading template, browser measurement, generated geometry,
or additional dependency.

## Content-driven geometry

```tsx
<SkeletonRegion isLoading={isLoading} variant="pulse" label="Loading article">
  <article>
    <SkeletonBox>
      <img src={cover} alt="" width={800} height={600} />
    </SkeletonBox>
    <Text as="h2" variant="heading">
      <SkeletonText>{article?.title ?? "Representative article title"}</SkeletonText>
    </Text>
    <Text as="p" variant="body">
      <SkeletonText>{article?.summary ?? placeholderSummary}</SkeletonText>
    </Text>
  </article>
</SkeletonRegion>
```

`SkeletonText` accepts plain text or a number and follows its inherited font metrics,
line wrapping, and inline fragment widths. It renders ordinary text outside a
loading region. Use it inside Text for the intended typography; do not put links,
icons, or rich markup inside it. `SkeletonBox` preserves its real child's dimensions
and hides it while loading. Media still needs its normal intrinsic width/height or
aspect ratio, just as it does when loaded. Use a box for icons or compact controls.
Both participants remain normal content outside the region.

Apply grid/flex layout to a child container, not to the region itself: the region
adds inner wrappers for busy state and interaction blocking.

Use representative mock data before the real data arrives. The skeleton removes
manual placeholder sizing, but it cannot predict the final text length or an image's
unknown aspect ratio. Different mock and actual content can still change layout.
Reserve real media dimensions and choose representative text lengths. The demo
uses identical content in both states to isolate this geometry contract.

The region does not infer arbitrary DOM leaves. Mark unavailable content explicitly;
leave stable card shells and separators unmarked. Do not nest loading regions:
use sibling regions for independently loaded content. Children remain mounted,
so their effects and requests continue. Do not render mock-data portals inside the
region: browser `inert` cannot cover portaled content outside its subtree.

## API

| Component | Contract |
| --- | --- |
| `Skeleton` | Decorative empty div; required `variant`; normal div attributes and sizing classes. No children. |
| `SkeletonRegion` | Required `isLoading`, `variant`, and localized loading `label`; normal div attributes. Its inner wrapper owns busy state and interaction blocking. |
| `SkeletonText` | Inline span; plain text/number children and normal span attributes. No width or line-count props. |
| `SkeletonBox` | Div around media or controls; normal div attributes. Child content reserves all space. |

Use `<Skeleton variant="pulse" className="h-5 w-32" />` when an explicit shape is
appropriate. Use the region composition when content should supply the dimensions.
Configuration is explicit, matching the system's component prop contract.

## Effects and accessibility

- **Pulse:** opacity breathes from 1 to 0.5 over 1.8 seconds.
- **Sheen:** a stationary directional neutral gradient breathes to 0.72 opacity over
  2.4 seconds. It is intentionally not a traveling or globally synchronized shimmer.
- **Static:** solid neutral silhouettes with no animation.

The long loops communicate an ongoing wait, an explicit exception to the usual
150–250ms interaction timing. Only opacity animates; no layout, background position,
registered property, or filter is animated. Completion and effect-tab changes are
immediate. Reduced motion and forced colors stop all skeleton animation. Forced
colors uses the system GrayText color for placeholder surfaces.

While loading, the content subtree is inert and hidden from assistive technology.
A single status label remains outside the busy subtree; it clears on completion.
Focus stays outside the inert content. Consumers must move focus to a sensible
persistent control before starting a load that would hide the focused element.
For background refreshes, retain the existing usable content rather than replacing
it with a loading region. Fetching, errors, retries, and optional delayed display
remain the application's responsibility.

## Credits and differences

- **shadcn/ui:** the small div primitive, native prop forwarding, class composition,
  and `data-slot="skeleton"` follow the [Base UI Skeleton source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/skeleton.tsx)
  and [documentation](https://ui.shadcn.com/docs/components/base/skeleton). Our
  effects, CSS, and content-aware composition are local implementations.
- **Devon Govett / Adobe React Spectrum:** [original X post](https://x.com/devongovett/status/1838980741197447529)
  and [Spectrum Skeleton](https://react-spectrum.adobe.com/Skeleton) informed using
  real components with mock content. Our explicit text/box participants use CSS
  instead of importing Spectrum or adding context support to every component.
- **goodfuture / Boneyard:** [original thread](https://x.com/0xGoodfuture/status/2039818750568878245)
  and [source](https://github.com/0xGF/boneyard) informed the goal of avoiding a
  manually resized duplicate layout. We do not use its Playwright capture pipeline,
  generated geometry, or code.
- **Corbin Crutchley and Simon Goellner:** [original post](https://x.com/crutchcorn/status/1968814077246873831),
  [Sync Skeleton](https://github.com/crutchcorn/sync-skeleton), and
  [Simon’s experiment](https://codepen.io/simeydotme/pen/azdzoQE) informed the exploration
  of a gentle highlight. Our sheen uses a stationary gradient and opacity; it does
  not reproduce their shared moving sweep or borrow their implementation.

The [research note](../research/skeleton-components.md) records the broader shortlist
and evidence limitations. No code from Boneyard, Spectrum, Phantom UI, or Sync
Skeleton is included.
