# Media viewer

## Scope and entry

The public `MediaViewer` controls an image, a recording, or a finite collection.
The manual demonstrates it at `/#media-viewer`, alphabetized under Content.
`docs/components/media-viewer.md` owns the public prop contract. Fixtures under
`apps/demo/public/media` are illustrative and carry no product-verification claim.

## Automated consumer checks

Run `pnpm test -- packages/design-system/test/media-viewer.test.tsx`,
`pnpm typecheck`, and `pnpm test:browser e2e/media-viewer.spec.ts
 e2e/manual-index-review.spec.ts`. The browser harness builds the demo and serves
port 3105, using desktop Chromium and 320px WebKit. Run `pnpm test:registry` for
independent media-viewer source installation and complete-UI compilation.

## Inspection recipe

1. Open `/#media-viewer`. Confirm the Content index is alphabetical and opens
   the Media viewer section. Open Individual image using the keyboard.
2. Confirm the complete image fits its stage. Choose Actual size and scroll to
   inspect the original pixels. Choose Fit again. Close using the labelled button;
   focus returns to the opener.
3. Open Mixed collection. Previous is disabled at the first item, Next at the
   last. Inspect the image at actual size, navigate away and return: size and
   scroll position remain. Close and reopen: the image starts in Fit.
4. Navigate to the recording. It starts paused. Play, seek, and navigate away.
   Return to find it paused at its retained position. Captions and controls stay
   usable independently of the supporting panel. Close and reopen to inspect
   timestamp and available preference retention.
5. Switch Annotations/Evidence in the central console; there is one supporting
   panel, on the right when wide and below when narrow. Hide details maximizes
   media space. Arrow keys in tabs and video controls do not change items.
6. Open Unavailable asset. Caption, explanation, and retry remain available.
   Exercise retry, then close with Escape. A missing active item has an explicit
   unavailable state and can still be closed.
7. Repeat in light/dark themes, reduced motion, at 320px, in a short window,
   and at 200% browser zoom. Inspect focus visibility, long text wrapping,
   bounded scrolling, and pointer/touch targets. Backdrop presses must not close.

## Boundaries

The viewer owns inspection, finite navigation, and modal focus. Consumers own
annotation selection and content, source identity, asset validity, and receipt
policy. The screenshot callout and recording-moment components are separate
packages; this viewer does not claim their acceptance criteria. Inline/video
handoff and moment validation require the recording component integration.
