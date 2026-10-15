# Annotated media

`AnnotatedScreenshot` and `VideoEvidence` pair captured behavior with an authored
text account. Import them from `@anaphor/system`, or install the `annotated-media`
registry item. They accept ordinary media URLs and have no tour, persistence,
authentication, or Next.js dependency. The application owns source validation,
asset hashes, revision labels, and evidence applicability.

```tsx
import { AnnotatedScreenshot, VideoEvidence } from "@anaphor/system";

<AnnotatedScreenshot
  src="/evidence/reader.png"
  alt="The local tour reader with its Refresh action at the top right"
  width={1440}
  height={960}
  title="Imported tour"
  description="The imported tour can be read without sign-in. Refresh requests the next revision."
  callouts={[
    { id: "refresh", x: 0.85, y: 0.08, label: "Refresh loads the latest imported revision." },
  ]}
  enlargeLabel="Enlarge screenshot"
  closeLabel="Close screenshot"
  unavailableLabel="Screenshot unavailable"
/>

<VideoEvidence
  src="/evidence/refresh.webm"
  title="Explicit refresh"
  description="The reader retains its current revision until Refresh is selected. The updated problem statement then appears."
  moments={[
    { id: "before", seconds: 0, label: "Original revision remains visible" },
    { id: "refresh", seconds: 12.5, label: "Select Refresh" },
    { id: "after", seconds: 16, label: "Updated statement appears" },
  ]}
  unavailableLabel="Video unavailable"
  captions={{ src: "/evidence/refresh.vtt", srcLang: "en", label: "English" }}
/>
```

Supply the actual screenshot's positive intrinsic `width` and `height`; the browser
reserves its aspect ratio while it loads. Each `ScreenshotCallout` has a stable
`id`, a prose `label`, and normalized `x`/`y` coordinates between zero and one,
measured from the image's top-left corner. The caller validates coordinates and
anchors them to the exact captured asset. Source-order numbers match an ordered
text list; the markers are decorative, so screen readers read each explanation
once. Keep callout centers sufficiently inset to leave their number visible.
Markers scale their positions with the image while their text retains its size.

The explicit Enlarge action opens a Base UI modal dialog. Escape and Close dismiss
it and restore trigger focus. The modal includes the image, text account, and
callout list. It scrolls within viewport margins and has no spatial animation.
Native `figure` attributes and refs pass through both public components; `className`
composes with their layout. Required content and action labels have no silent
substitutes. An empty `callouts` or `moments` array means no annotations.

`VideoMoment` has a stable `id`, a prose `label`, and finite nonnegative `seconds`
within the recording's duration. The component formats labels as minutes and
seconds, seeks to the supplied fractional position, then focuses the video. It
does not start playback. Native controls remain available, playback never starts
automatically, and only metadata is preloaded. Supply optional `poster` content
when useful. Captions use a native WebVTT `track`; the author supplies them for
speech and meaningful audio. The required `description` must give a useful text
account of observable behavior, including the outcomes highlighted by moments.

Pass `src={null}` when no file is available. A failed media load also shows the
required `unavailableLabel`, retains the title, explanation, and annotations, and
calls optional `onMediaError`. Unavailable screenshots have no Enlarge action;
unavailable videos keep their timestamp labels as disabled actions. Providing a
different source displays the replacement. Remount the component to retry a
previously failed URL. Native media URLs remain the application's responsibility.

Both media elements use the shared 1px inset `--anaphor-image-outline` token.
There are no custom playback controls, remote requests beyond normal browser
media loading, or application-level evidence decisions.

The [component integration tests](../../packages/design-system/test/annotated-media.test.tsx)
exercise keyboard enlargement and focus return, native video seeking without
playback, and failure/replacement behavior through the public package API. Actual
image scaling, media decoding, narrow reflow, theme appearance, and browser focus
remain part of the [local-tour recipe](../verification/local-tours.md).
