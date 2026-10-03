# Skeleton components: X references and implementation research

Checked 2026-10-03. Research for an Anaphor component built from shadcn/ui's Base UI starting point; no component implementation is included.

## Findings

Prioritize **one coordinated shimmer across a layout**, **placeholders that inherit real geometry**, and **a deliberate handoff to loaded content**. This is a curated design judgment, not an exhaustive ranking of X.

Technical claims below rely on primary documentation. Original X text and inspected layouts are distinguished from unverified media and performance.

## Shortlist

| Reference | Distinctive idea | X evidence | Best use for Anaphor |
| --- | --- | --- | --- |
| Corbin / `sync-skeleton`, with Simon Goellner's CSS exploration | A shared highlight traverses separate shapes coherently | [Original post](https://x.com/crutchcorn/status/1968814077246873831), text verified in browser | Primary motion reference |
| goodfuture / Boneyard | Generate responsive skeleton geometry from the rendered application during development/build | [Original thread](https://x.com/0xGoodfuture/status/2039818750568878245), also linked by its own repository; text verified in browser | Layout accuracy and authoring reference |
| Adobe React Spectrum / Devon Govett lead | Render actual components with mock content and replace supported leaves with placeholders | [Original post](https://x.com/devongovett/status/1838980741197447529), text verified in browser | Composition and typography reference |
| Aejkatappaja / Phantom UI | Measure real DOM at runtime and overlay placeholders | Discovered through indexed X reposts; original creator post not recovered | Alternative architecture to evaluate, not a default dependency |
| Adobe ImageCoordinator | Reveal a related group of images together | Original Devon post not recovered; behavior verified in Adobe's own docs | Loading-to-content transition reference |

### 1. Shared shimmer: Corbin and Simon Goellner

[Corbin's original post](https://x.com/crutchcorn/status/1968814077246873831), dated September 18, 2025, describes a persistent line across elements and credits an @edpratti mockup. The [Sync Skeleton repository](https://github.com/crutchcorn/sync-skeleton) supplies a CSS-only implementation. [Simon Goellner's CodePen](https://codepen.io/simeydotme/pen/azdzoQE) explicitly credits [Corbin's X post](https://x.com/crutchcorn/status/1968814077246873831) and links the package. Its example includes heading, avatar, multiline text, and differently sized blocks: useful for seeing whether the effect reads as one moving light across the composition.

The [current CSS](https://github.com/crutchcorn/sync-skeleton/blob/main/package/skeleton.css) animates an inherited registered custom property on `:root`, uses viewport-relative fixed backgrounds, and includes a pause at the end of the sweep. It disables the animation for reduced motion. That is stronger synchronization than separately starting the same keyframes on every newly mounted rectangle.

**Visual check:** the [official Tailwind playground](https://play.tailwindcss.com/nFhJkx8koT?file=css) rendered a dark card composition with an image block, text bars, and avatar/byline placeholders. Layout was inspected; performance was not profiled.

**Our adaptation:** prototype a restrained, neutral shared sweep. Keep its ownership within a loading region where possible. A global root animation and fixed backgrounds require deliberate evaluation in dialogs, transformed ancestors, scrolling surfaces, and late-mounted regions. Do not equate “CSS-only” with “compositor-only”: this implementation updates gradient inputs.

### 2. Generated geometry: goodfuture's Boneyard

The [original X thread](https://x.com/0xGoodfuture/status/2039818750568878245) was verified in the browser; its videos could not play. The [repository](https://github.com/0xGF/boneyard) links that same thread and documents a headless-browser capture step that produces responsive `.bones.json` layouts. Runtime components read the registered geometry. It supports pulse, shimmer, static rendering, optional staggering, and fade transitions. The [creator's demo](https://boneyard.vercel.app/overview) is the useful next visual reference.

**Why it is interesting:** layout correspondence becomes an authoring workflow rather than repeated manual approximation.

**Our adaptation:** borrow the accuracy standard, initially using shared layout recipes and deterministic dimensions. A capture pipeline is a substantial commitment for a small primitive; adopt it only if many complex consumers make hand-maintained placeholders costly. Test intermediate container widths, font changes, and content-length variation before accepting pixel-perfect claims.

### 3. Real-component placeholders: Adobe Spectrum

[Devon Govett's September 25, 2024 post](https://x.com/devongovett/status/1838980741197447529) describes using real components and mock content. [Spectrum's Skeleton](https://react-spectrum.adobe.com/Skeleton) wraps real components populated with mock content. Its documented integration replaces supported text, images, icons, links, badges, status lights, and meters with placeholders; form components are disabled while loading. This is a design-system integration, not proof that arbitrary DOM can be wrapped without adaptation.

**Visual check:** the official dark-mode demo showed a 4:3 image placeholder, a heading bar, three paragraph bars, and an icon square beside a caption bar. That demonstrates a richer silhouette than identical fixed-height text stripes.

**Our adaptation:** match the actual typography, line count, media aspect ratio, and responsive grid. For a future content-aware wrapper, explicitly define which Anaphor components participate. Keep the first shadcn-compatible shape primitive small; add this behavior only when an actual consumer needs it.

### 4. Runtime layout extraction: Phantom UI

[Phantom UI's source repository](https://github.com/Aejkatappaja/phantom-ui) describes a Lit Web Component that makes text invisible, measures leaf elements with `getBoundingClientRect`, and overlays shimmer blocks. Container backgrounds and borders remain visible. Its [own documentation and demo](https://aejkatappaja.github.io/phantom-ui/) are primary references. X reposts led to the project, but no original author post was verified.

**Why it is interesting:** the loading view follows the component's current DOM without a separate build capture step.

**Our adaptation:** retain real card structure and replace only unavailable content. Runtime measurement introduces lifecycle and first-render considerations that the basic server-safe Skeleton does not need. Treat this as a separate exploratory wrapper, not a prerequisite for implementing loading states.

### 5. Coordinated reveal: Adobe ImageCoordinator

[Adobe's Image documentation](https://react-spectrum.adobe.com/Image) shows a coordinator that reveals a group once its images have loaded, alongside individual image skeletons and custom error rendering. This concerns the end of loading rather than the appearance of the placeholder.

**Our adaptation:** try one short opacity handoff per card or small image group. Bound the group so one slow asset cannot hold an entire page indefinitely; define partial failures and never-loaded assets before adopting all-at-once reveal. Useful data should not wait for decorative media.

## Supporting references

- [Mat Simon's implementation](https://www.matsimon.dev/blog/simple-skeleton-loaders) explains uniform shimmer using `background-attachment: fixed`, with HTML/CSS layouts and a wrapper escape hatch. It is a primary technical reference, not a verified X example. The important distinction is spatial alignment of the highlight; sharing a duration alone does not achieve it.
- [MUI's data-grid design issue](https://github.com/mui/mui-x/issues/1685) documents placeholders that respect cell alignment and vary text-bar lengths, while retaining existing rows and using linear progress for refresh. It also links [Sidney's June 24, 2022 X post](https://x.com/nots_dney/status/1540318871923486720), whose verified text describes subtle row skeletons built with MUI React. Its video did not play; do not attribute MUI's other benchmarks to it. For Anaphor, use deterministic widths appropriate to each column, rather than fresh randomness on render.
- [shadcn's current text-shimmer utility](https://ui.shadcn.com/docs/utils/shimmer) is a separate CSS effect for visible text, with a default two-second sweep and configurable duration/spread. It can suit a real status phrase; it does not replace a layout skeleton or justify decorative brand-colored placeholders.

## shadcn starting point

The [current Base UI Skeleton docs](https://ui.shadcn.com/docs/components/base/skeleton) show the familiar `Skeleton` API with caller-provided dimensions and avatar, card, text, form, and table examples. The [upstream base source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/skeleton.tsx) is a small `div` with normal div props, `data-slot="skeleton"`, `cn`, and `animate-pulse`. It has no Base UI import, hooks, or client directive. The current source includes a style hook named `cn-skeleton`; this is the upstream base template, not a verified generated `base-nova` output.

**Our adaptation:** preserve normal HTML composition and the public shape API. There is no need to add a headless behavior dependency for a decorative placeholder. Use Anaphor's own CSS and tokens rather than copying every upstream style decision.

## Proposed direction for Anaphor

These are recommendations to test, not findings that the sources prove universally superior. They follow the [local design contract](../../DESIGN.md) and the existing [foundation roles](../foundations.md).

1. **Accurate quiet shapes.** Keep the shell, rules, alignment, and media ratios stable. Use neutral colors derived from the existing theme; orange retains its action/focus meaning. Choose corners based on the represented element, rather than making every line a pill.
2. **One coherent loading rhythm.** Compare the upstream pulse against a subtle shared sweep across a compact card or table region. If the sweep cannot meet browser/performance requirements simply, a grouped opacity pulse is a credible fallback.
3. **A brief handoff.** Propose a 150–200ms opacity transition when content arrives, with no bounce, displacement, or forced minimum wait. Loading loops may need roughly 1.5–2 seconds; that is an explicit proposed exception for continuous status feedback, separate from the contract's 150–250ms transition guidance. Document the exception if adopted.
4. **Static reduced motion.** Preserve the silhouette and loading semantics while stopping the loop and skipping the reveal transition.
5. **Separate shapes from loading ownership.** The primitive remains server-safe and decorative. A consumer or optional region wrapper owns fetching, busy state, delayed display decisions, errors, retries, and completion. Avoid loading announcements on every individual bar.

Compare **pulse**, **shared sweep**, and **static** on the same Anaphor card and dense data row, with a loaded-state toggle. Keep the API provisional until this study reveals what needs to vary.

Before implementation is considered ready, verify stable geometry at 320px and zoomed layouts, hydration, multiple mount times, dark/light themes, reduced motion, focus behavior, a meaningful loading announcement, and performance with many rows. For accessibility semantics, use the [WAI-ARIA definition of `aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy) and [status role](https://www.w3.org/TR/wai-aria-1.2/#status); decorative placeholders should not become focusable fake controls.

## Evidence limits

Original X text was verified for Corbin, goodfuture, Devon Govett, and Sidney. X videos were not visually assessed; the Boneyard and Sidney players reported unavailable media. Phantom UI and ImageCoordinator retain incomplete original-post provenance. The Sync Skeleton playground and Adobe Skeleton layouts were visually inspected. No package was installed and no performance claim was benchmarked.
