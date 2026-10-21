# Media viewer

`MediaViewer` enlarges a supplied image, recording, or finite mixed collection.
It uses Base UI Dialog for modality and Video.js 10.1 (`@videojs/react`) for video.
The browser's native video controls remain available independently of supporting
content. Still images use native image rendering; no image service or extra
lightbox library is required.

## Consumer contract

Import `MediaViewer` and its types from `@anaphor/system`. Supply `open`,
`onOpenChange`, `items`, `activeItemId`, `onActiveItemChange`, and `initialPanel`
(`"annotations"`, `"evidence"`, or `null`). The consumer owns opening and collection
selection. An empty collection or absent selected ID remains a closable dialog
with an explicit unavailable state.

Each `MediaViewerItem` requires a stable `id`, `sourceKey`, `title`, `kind`, and
`src`. Change `sourceKey` when captured bytes or associated track assets change;
a URL change also resets the source. Optional `caption`, `annotations`, and
`evidence` are React content. Supply the same authored content used inline.
The viewer does not interpret receipts or evidence validity.

Images additionally require `alt`, `width`, and `height`, describing capture
pixels. Invalid dimensions produce an explicit unavailable state. Optional
`reveal: { x, y, key }` uses normalized capture coordinates between zero and one.
Changing `key` requests a new reveal; invalid coordinates are ignored. A request
waits until the image is loaded and active, then is consumed once. Re-rendering
the same request or returning to the item preserves subsequent manual panning. Reveal scrolls
the bounded inspection area without changing zoom or moving focus. Fit shows the
complete capture; Actual size assigns one capture pixel to one CSS pixel. This
does not promise a physical display pixel at browser zoom or on high-DPI screens.

Videos may supply `poster` and `tracks`. Each track supplies `src`, `srcLang`,
`label`, `kind` (`"captions"` or `"subtitles"`), and explicit `default`. Playback
uses `VideoPlayer` and `Video` from the v10 video preset with native controls,
inline playback, metadata preload, and no autoplay. Source URLs must be playable
by the browser; this component does not introduce a streaming adapter.

`renderConsole(item)` adds consumer controls to the bottom central console.
Annotations and Evidence tabs control one supporting panel: beside media on wide
windows and below it on narrow windows. Hide details restores media space.
Hide details returns focus to its console tab. Long titles have a bounded
scroll region so Close and the bottom console remain reachable.
The console shares the system's rounded floating-surface vocabulary and tokens;
it does not mount a second MorphSurface panel or independent dismissal handler.

## State and interaction

Previous and Next stop at collection ends. Single media omits collection controls.
No swiping, wheel navigation, thumbnails, or auto-advance is installed. Arrow keys
navigate only when the dialog container itself has focus. Inputs, tabs, media
controls, and consumer annotation widgets retain their own arrow behavior.

Close and Escape dismiss; backdrop presses do not. Base UI owns nested Escape
and the focus trap. Focus returns to the original opener. Supply `returnFocus`
with a stable element ref when the opener may disappear while the viewer is open.

Images retain size and scroll while moving through an open collection; reopening
starts Fit. Videos pause when leaving an item or closing. Timestamps, supported
volume/mute/rate, and selected caption tracks are retained for that source while
the `MediaViewer` remains mounted. A replacement source starts fresh. Only the
active video may play. Native browser capabilities govern volume and captions.

The consumer owns selected annotation IDs and their state above content that
unmounts when tabs or items change. This lets inline and enlarged views use the
same selection. Media failure does not remove the authored account or supporting
panel; Retry reloads the failed asset. The package does not retrieve logical
assets, validate hashes, or fetch provenance.

## Boundaries and next packages

This is the shared viewer prerequisite. Screenshot callout placement and authored
recording moment navigation belong to their separate evidence components. Inline
recording handoff must transfer timestamp and supported preferences while pausing
both directions; this viewer alone does not yet provide that adapter. PR47's tour
adapter also needs to carry poster and caption assets through its media contract.
Neither dependency changes tour schema policy inside this package.

Consumer tests cover finite navigation, focus return, Fit reset, source replacement,
failure/retry, explicit invalid dimensions, missing selection, supporting tabs,
and arrow isolation. Browser verification owns real media decoding, pixel sizing,
scroll retention, focus behavior, themes, narrow and short windows, zoom, and
accessibility. See the media viewer recipe for executed coverage.
