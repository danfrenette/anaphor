# Upload interaction design and implementation research

Checked October 11, 2026 for [ANAPHOR-254](https://linear.app/anaphor/issue/ANAPHOR-254/select-and-track-file-uploads-consistently-across-anaphor-apps). The requested experience is **“seamless and delightful.”**

Build around one persistent file identity, an honest progress meter, and recovery in place. Keep the Paper selection surface as the baseline; explore more tactile progress treatment without changing the underlying journey. Anaphor should share picker/drop interaction and composable presentation. Each application owns validation policy, retained files, transport, processing, and routing.

## What the existing design establishes

The [Paper intake designs](https://app.paper.design/file/01M42PK0D2R1T2VM43565CWF9B/p-3-0) show a dashed selection surface, a visible Choose file action, accepted-format guidance, and a file that proceeds through selected, uploading, extracting, and ready states. A 390px specimen wraps long filenames and stacks actions; another shows recoverable extraction failure. The lifecycle boards represent alternative states of one file, rather than a queue.

The [Autodidact planning document](https://linear.app/anaphor/document/autodidact-app-structure-and-layout-planning-8172478058a4) proposes explicit Upload file after selection. Retention and extraction are distinct; Open Prepare is an application action. File limits, duplicate rules, background execution, and the final format subset remain application decisions. A shared uploader must not imply that selection immediately starts a network request or that 100% transferred means the source is ready.

Paper provides composition, not executable behavior. Its current meter is a 4px neutral rail. Orange measured progress and a recessed track would be proposed alternatives. Shipped typography and tokens govern implementation: the web heading role uses Bell Gothic Black at 900, while the desktop Paper font uses 700. The bright-label/orange-solid contrast exception remains an explicit exception. See [foundation guidance](../foundations.md).

Local source inspected at `d6de71b6c868a43ab0a7888b86398f5580bd3fd6`, including the working tree. The ticket cites an earlier inspected revision. Existing unrelated local changes are outside this research.

## The visual language to borrow

The useful tradition is the **instrument panel**: fixed labels, a quiet recessed channel, a measured trace, and a readout that changes without disturbing its surroundings. The digital counterpart is **object continuity**: the file stays identifiable while the system changes its status.

This process constrains composition. Filename and metadata need stable lanes; numerical values need tabular figures; motion belongs to the changing measurement or status. A bounded amount of orange identifies the active transfer. Neutral surfaces carry structure, Crimson marks errors, and text communicates success without requiring a new green palette. These choices follow [Anaphor's design direction](../../DESIGN.md), rather than importing a reference's identity.

Useful vocabulary:

- **Object continuity:** preserve the same file and its placement through lifecycle changes.
- **Determinate progress:** a known measured amount against a known total.
- **Indeterminate activity:** visible work with no meaningful total.
- **Status crossfade:** replace stage text within a stable region.
- **Damped interpolation:** smooth measured updates without bounce or overshoot.
- **Recessed track:** a shallow channel that makes the fill read as a measurement.
- **Progressive disclosure:** show recovery or cancellation only when applicable.
- **Recovery in place:** preserve identity and useful input when an operation fails.

### Reference shortlist

These are useful references for specific mechanics, rather than an engagement ranking. X likes/replies below come from first-party syndication metadata retrieved October 11, 2026. They are modestly engaged creator posts; current view counts were not verified.

| Reference | Evidence | What to borrow for Anaphor |
| --- | --- | --- |
| [Aaron Iker upload tray](https://x.com/aaroniker_me/status/1146762319873093633), July 4, 2019 | 247 likes, 5 replies; live video inspected. Credits Jakub Antalík's concept. | A compact status surface, thin bottom rail, and controls beside the work. Borrow the placement; pause/ETA require real transport support and batch tracking is outside this ticket. |
| [Aaron Iker drag/drop upload](https://x.com/aaroniker_me/status/1145655354920976386), July 1, 2019 | 203 likes, 6 replies; creator post and implementation link verified, animation not replayed. Credits Jakub Antalík. | Candidate for studying the selection-to-completion transition. Evaluate the motion before borrowing its choreography. |
| [Aaron Iker upload buttons](https://x.com/aaroniker_me/status/1205055637320806400), December 12, 2019 | 166 likes, 3 replies; original post links the coded example. | A small terminal icon handoff could punctuate completion. Keep the file's full lifecycle outside the button. |
| [mymind Markdown and PDF drop](https://x.com/mymind/status/1984314359485550873), October 31, 2025 | 123 likes, 2 replies; first-party post describes Markdown becoming a note card and distinct PDF card styling. | Make the selected file immediately recognizable. Use file-type identity where helpful; text uploads do not need invented thumbnail imagery. |
| [Jakub Antalík's Frame.io upload flow](https://dribbble.com/shots/4649007-Micro-interactions-in-the-file-upload-flow) | Creator describes a conceptual desktop iteration emphasizing pause/cancel feedback and continuity. | Keep actions responsive and preserve task identity. The concept does not establish present-day product behavior. |
| [Interior progress meter](https://www.interior.dev/docs/progress-bar) | Live replay and displayed component source inspected. | Stable readout, shallow track, and restrained transition from unknown to measured work. |

The corresponding X metadata is available through the first-party endpoints for [upload tray](https://cdn.syndication.twimg.com/tweet-result?id=1146762319873093633&lang=en&token=0), [drag/drop](https://cdn.syndication.twimg.com/tweet-result?id=1145655354920976386&lang=en&token=0), [upload buttons](https://cdn.syndication.twimg.com/tweet-result?id=1205055637320806400&lang=en&token=0), and [mymind](https://cdn.syndication.twimg.com/tweet-result?id=1984314359485550873&lang=en&token=0). Counts may change and endpoint availability is variable.

[Frame.io's current Transfer documentation](https://help.frame.io/en/articles/5063743-upload-and-download-in-frame-io-transfer) is a useful product counterpart: background activity stays reachable through Transfers, with individual progress and cancellation. A native desktop transfer app has different lifetime guarantees from a web page. Reachable in-page status is useful here; navigation persistence needs application ownership.

### Interior progress reference

[Interior's live meter](https://www.interior.dev/docs/progress-bar) pairs a filename with a right-aligned numerical readout, a slim continuous fill, and a subtly recessed track. Its displayed source animates the fill with `scaleX` and crossfades pending text with percentage text. Borrow the stable readout, restrained depth, and transition between unknown and measured work.

The page's prop table lists `segments`, `ceiling`, and `crawl`, but its displayed source omits them and its inspected live demo is continuous. Treat those entries as documentation drift. The usage example also sets 100 on XHR `load` without checking HTTP status. Adapt the visual idea; establish upload success independently. Avoid a synthetic crawl toward a percentage ceiling.

### Motion judgment

[Emil's Good vs Great Animations](https://emilkowal.ski/ui/good-vs-great-animations) explains origin, easing, and when interpolation helps. Apply that judgment narrowly: progress grows from its start edge, status text changes softly, and direct keyboard actions respond immediately. Anaphor already has [motion utilities](../../packages/design-system/src/lib/motion.ts) and Motion installed. New springs or a new animation dependency are not prerequisites.

## Design rules for the prototype

These constraints were accepted for the prototype on October 11, 2026. The treatment remains a choice to make in the running study; no Paper or public design-system changes have been promoted.

1. **Keep file identity visible.** Preserve filename and metadata through upload, processing, error, and retry. A replacement rejected by validation leaves the previous valid file intact.
2. **Keep the drop boundary stationary.** Change border, tone, and instruction on file hover; avoid resizing or moving the target. A nested icon or button must not cause flicker.
3. **Use one animated indicator per file.** During measured transfer, animate the meter. During unknown processing, use one indeterminate treatment beside an honest stage label. Avoid simultaneous spinner, shimmer, moving meter, and pulsing text.
4. **Show only measured percentages.** Smooth received values with no overshoot. At transfer completion, distinguish server acknowledgment and processing from the app's final outcome.
5. **Keep stage and action placement predictable.** Crossfade stage text in its own region. Let long filenames and errors grow naturally; do not fix the entire component height or truncate the filename.
6. **Make recovery quieter than the failure.** Put actionable feedback and a supplied Retry action beside the affected file. Retain useful input. Never show retry or cancellation that the consumer cannot execute.
7. **Use Anaphor's existing signal palette.** Neutral structure, orange action/focus/measurement, Crimson error. Confirm completion with a small check and text; do not add a success-color system for this component.
8. **Keep feedback immediate and accessible.** Native picker remains visible as an action, coarse-pointer targets reach 44px, meaningful stages are announced politely, and reduced motion replaces travel with static state. Keyboard selection does not wait for an entrance animation.

## Directions worth comparing

The differences should be visible at real size, with the same file and timing. Start from Paper defaults; proposed alternatives belong in an isolated study until selected.

| Direction | Appearance and behavior | Why try it |
| --- | --- | --- |
| Quiet rail | Paper's thin neutral track, wrapping filename, byte metadata, clear stage and supplied actions | Strongest baseline for faithful reproduction and compact app use |
| Recessed instrument | A shallow 8px track with restrained orange fill, tabular readout, and no bounce | Closest adaptation of Interior; adds tactility through the measurement itself |
| Inline activity strip | Filename remains above a compact status/action line, with progress along its lower edge; completion settles into a check and text in that line | Adapts the upload tray's economy to one file, testing whether a compact handoff carries the delight without a heavier meter |

For product UI with three identifiable approaches, `emil-get-creative` routes the next experiment to **emil-prototype**. A random-seed visual generator would not resolve this decision. Use repeatable real-file scenarios and a direction picker instead.

Rules are continuity, truthful measurements, keyboard parity, and existing foundations. Modes are the three treatments above. Possible study knobs are track height 4–8px, bounded feedback timing 150–250ms, viewport width, long-filename fixture, and lifecycle state. Treat these as proposed study bounds to verify, not new public component props. Include Light/Carbon, reduced motion, and Reset. Replay fast, slow, unknown-total, and failed transfers from deterministic fixtures; use a real selected File object for selection behavior.

## Reuse map

| Need | Existing owner | Implementation consequence |
| --- | --- | --- |
| Choose, Upload, Remove, Cancel, Retry | [Button and ButtonLabel](../../packages/design-system/src/components/button.tsx) | Preserve required size, shape, tone, variant, loading, iconOnly, nativeButton, and type configuration. Button already owns press/loading behavior and coarse-pointer geometry. |
| Filename, metadata, stage, readout | [Text](../../packages/design-system/src/components/text.tsx) | Use UI/caption roles for identity/status and code role where a literal measurement benefits from mono. Add tabular figures to changing numbers. Keep `min-w-0` and wrapping. |
| Guidance and rejected selection | [Field](../../packages/design-system/src/components/field.tsx), [FieldFeedback](../../packages/design-system/src/components/field-feedback.tsx) | Reuse presentation and its reserved hint/error region. Explicitly associate feedback with the focusable picker trigger; wrapping a hidden input in Field is insufficient proof. |
| Native input integration | [Input](../../packages/design-system/src/components/input.tsx), backed by Base UI Field.Control | Inspect registration and ref behavior in the working example. File policy must receive actual File objects, not Field's DOM filename string. A private native file input remains a reasonable choice if it avoids inappropriate text-field styling or validation. |
| Layout, focus, color, geometry | [Package CSS](../../packages/design-system/src/styles.css) and [layout recipes](../layout-recipes.md) | Consume semantic tokens and the existing spacing rhythm. Keep uploader geometry local; do not copy Paper's physical widths into a universal component contract. |
| Measured/unknown meter | Base UI Progress, already available in the installed dependency | Evaluate a small internal composition. It supports `value={null}` for unknown work and named progress semantics. Keep its completion state scoped to the measured task. Export a separate Anaphor Progress only if the working composition establishes the need. |
| Specimen controls | [PlaygroundControls](../../apps/demo/app/playground-host.tsx) and [playground fields](../../apps/demo/app/playground-fields.tsx) | Register local typed settings and Reset through the existing host; no component-specific branches in the shared host. |
| Optional contained entry | [AdaptiveSurface](../../packages/design-system/src/components/adaptive-surface.tsx) | Reuse if an app later chooses a contained surface. The current dedicated-page draft needs no new modal or drawer. |

[Base UI Progress](https://base-ui.com/react/components/progress) supplies Root, Label, Track, Indicator, and Value. Its installed 1.9.0 Root reports a bounded value and does not add a live announcement for each byte. Its default Indicator changes width; a transform-based custom indicator must explicitly override that behavior and be checked in both directions. Begin with the simplest rendering that achieves the selected treatment.

## Selection and state ownership

Keep the shared contract small: a native selection mechanism, a drop surface, a composable picker trigger, and slots for content, status, feedback, and supplied actions. Exact exported names and props should emerge from the package-consuming specimen. Avoid a generic UploadItem or job engine.

Both picker and drop copy their File objects into the same ordinary selection data shape and invoke one candidate-selection path. The specimen consumer applies its validator there, then commits a valid selection or supplies associated rejection feedback. This proves identical policy for both paths without making network work part of Anaphor.

Keep three concepts distinct: the accepted file, a proposed replacement, and feedback about the last rejected attempt. Picker dismissal changes none of them. Clearing the native input permits selecting the same file again; it does not clear the application's accepted File. Native `cancel` can also fire when the same unchanged selection is chosen. [MDN file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file), [MDN cancel](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/cancel_event), [Adobe FileTrigger source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/FileTrigger.tsx).

Resetting the hidden input also means ordinary form serialization cannot serve as the retained selection contract. The consumer explicitly submits its accepted File; drop selection follows that same path. Base UI Field may present invalid state, but its filename-string validation must not become a second file-policy pipeline.

The `accept` attribute guides the picker but is not validation. Keep size/type/count policy in the consumer; do not silently take the first file from a multi-file drop in a single-file example. Give actionable feedback. Content verification and server validation belong to the application. If validation is asynchronous, guard against obsolete results after replacement, removal, disable, or unmount. Start with synchronous size/type policy unless a real consumer requires more. [MDN file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file), [React race prevention](https://react.dev/reference/react/useEffect#fetching-data-with-effects).

Track drag presence at the stable surface boundary, using a depth counter or equivalent. Reset on drop and actual exit, including disable. During hover, inspect item kinds; read files synchronously during drop, before awaiting anything. Within this surface, suppress browser-default drops even for links/text, then reject non-file data without selection. This is stricter than MDN's sample, which preserves link defaults, because the ticket requires no navigation from non-file drops. Avoid global listeners in every shared instance; page-wide file-drop protection should be an explicit application integration. [MDN drop guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop), [DataTransfer.files](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files).

[React Aria FileTrigger](https://react-aria.adobe.com/FileTrigger) and [DropZone](https://react-aria.adobe.com/DropZone) are useful interaction references. They do not justify adding React Aria to a package already based on Base UI for this scoped native interaction.

[IBM Carbon's uploader guidance](https://www.carbondesignsystem.com/building-blocks/core/components/file-uploader/guidelines) reinforces nearby format/size guidance, form-aligned sizing, keyboard picking, and actionable file errors. [Uppy's Status Bar](https://uppy.io/docs/status-bar/) offers a useful checklist of progress, recovery, and transport-dependent pause behavior. Borrow the state coverage; neither reference requires importing its UI shell or upload engine.

## Progress and accessible feedback

The consumer supplies measured values and phase labels. XHR upload progress is one application-side option when bytes are required; use `lengthComputable` before deriving a fraction. Check HTTP success and subsequent server outcome separately. `loadend` happens on success, failure, abort, and timeout. Keep transport adapters outside the design system. [MDN XHR upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload).

Label the progress task specifically, such as uploading the named file. Known work supplies min/max/current value and useful value text; unknown work omits the current numerical value. Keep controls outside the progressbar subtree. Announce accepted selection, rejection, stage change, completion, and recoverable failure through coordinated polite status regions. Avoid duplicating FieldFeedback's existing status announcement or placing percentage text in a live region. [WAI-ARIA progressbar](https://www.w3.org/TR/wai-aria-1.2/#progressbar), [WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

Preserve focus on the initiating control while work changes. If Remove deletes the focused action, return focus to the picker. Avoid unmounting a focused upload action during its loading transition; Anaphor Button already supports focus retention during loading. Completion should not automatically navigate or move focus to a new call to action.

Reduced motion uses a static stage indicator and immediate measured fill. Forced colors needs real outlines/borders, system-color track/fill, and readable text; shadows alone cannot carry structure or focus. [Reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), [forced colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors).

## Implementation sequence and proof

1. **Establish the selection contract.** Build a package-consuming specimen from the Paper surface, existing controls, real File objects, and one consumer validator. Prove picker/drop parity, dismissal, invalid replacement, same-file reselection, disabled guards, nested drag transitions, and non-file drops.
2. **Compare the treatments.** After reviewing the design rules, use the three directions above with one repeatable lifecycle. Choose defaults from actual wide/narrow and Light/Carbon use. Demonstrate simulated transport explicitly; it does not prove retained storage or extraction.
3. **Finish lifecycle composition.** Show long filename, metadata, measured upload, unknown processing, completion, and recoverable failure. Optional callbacks govern action visibility. Verify truthful 100%-transferred/processing behavior and focus after actions disappear.
4. **Distribute the proven contract.** Add explicit package exports, registry item/files/dependencies, concise docs, and the single-file consumer example. Follow [architecture](../../ARCHITECTURE.md) and [prop contracts](../component-prop-contracts.md). Promote independent Progress only if warranted.
5. **Verify at the boundaries.** Run appropriate component/type tests, browser checks at wide/390px widths in both themes, reduced-motion and forced-color checks, and registry-consumer installation/build checks. Use the [testing contract](../../TESTING.md) and add a recipe in [verification](../verification/README.md).

The decisive edge cases are an existing valid file followed by a rejected replacement; picker Escape with selection retained; a fast A/B validation race if async is supported; a disabled surface receiving a drop; a link dropped over a nested child; a long filename beside actions at 390px; and transfer reaching 100% while processing remains unknown. Verify accessible names, feedback associations, and screen-reader stage announcements directly. Static images and automated contrast checks alone cannot establish those behaviors.

## Selected direction

On October 11, 2026, Dan selected **Quiet** and retired Recessed instrument and Activity strip. The thin rail now uses Anaphor orange. Selection supports multiple files, each with independent progress, cancellation, retry, and removal. The title and footer are generic; application-specific AI-analysis copy is removed.

The selected direction is available at [the file-upload example](http://127.0.0.1:3010/#file-upload). The temporary comparison route and direction picker have been removed. See [the shared contract](../components/file-upload.md) and [verification recipe](../verification/file-upload.md).

The consumer keeps selected File objects in memory and appends new accepted candidates. Rejected candidates do not discard earlier files or valid siblings. Selection is real; transfer, acknowledgment, and processing remain simulated. The demo’s PDF/Markdown/plain-text and 10 MB policy is application code, not a design-system restriction.
