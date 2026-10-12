# File upload

Quiet is the selected upload treatment: a thin Anaphor orange progress rail, wrapping filenames, explicit status, and nearby recovery actions. The instrument and strip explorations were retired after design review. Generic headings, guidance, footers, and file lists are consumer content.

Import `FileUpload`, `FileUploadDropzone`, `FileUploadTrigger`, and `FileUploadProgress` from `@anaphor/system`, or install the `file-upload` registry item. The [demo consumer](../../apps/demo/app/uploads/upload-example.tsx) composes existing Button, ButtonLabel, Text, Field, and FieldFeedback with these parts.

```tsx
<FileUpload multiple={true} accept=".pdf,.md,.txt" onFilesSelected={handleCandidates}>
  <FileUploadDropzone>
    <p>Drop files here</p>
    <FileUploadTrigger size="md" shape="square" tone="accent" variant="solid"
      loading={false} iconOnly={false}>
      <ButtonLabel>Choose files</ButtonLabel>
    </FileUploadTrigger>
  </FileUploadDropzone>
  {/* Consumer-owned file list, feedback, actions, and footer. */}
</FileUpload>
```

`multiple` is required. It controls native picker selection. Both picker and drop pass an ordinary `File[]` to `onFilesSelected`; neither retains, replaces, validates, uploads, nor silently truncates candidates. In a single-file consumer, validate the count of dropped files. `accept` is a picker hint; the application must validate type, size, count, content, and server policy.

The input clears after selection so the same file can be chosen again. Picker dismissal does not call the selection callback. The application must keep accepted File objects and submit them explicitly; native form serialization cannot provide the retained list. Set root `disabled` to block new candidates and the picker. It does not cancel application-owned jobs. `invalid` styles the drop surface; associate supplied FieldFeedback with the trigger through `aria-describedby`.

Native props and refs are forwarded by each part. The trigger uses Anaphor Button configuration and owns `nativeButton` and `type`. A consumer click handler may prevent the picker with `preventDefault()`. A supplied drop handler may prevent the selection callback; the surface always prevents browser navigation for drops within its boundary. Drag depth tracks nested children and resets when disabled changes without remounting composed children. Page-wide drop interception belongs to the application.

```tsx
<FileUploadProgress value={bytesTransferred} max={file.size}
  label={`Uploading ${file.name}`} valueText={`${bytesTransferred} bytes transferred`} />
<FileUploadProgress value={null} max={file.size} label={`Processing ${file.name}`} />
```

The meter uses native progress semantics with a decorative orange rail. Supply a positive finite `max` and finite `value`, or `null` for unknown work. Numerical values are bounded to zero–max; unknown work omits the value. The application supplies the phase and meaningful value text. Reaching the byte total means transfer has finished; server confirmation and processing may still be pending. Announce lifecycle transitions through consumer-owned polite status regions, not every progress tick.

Known progress transitions use the existing motion tokens. Unknown work has a travelling segment; reduced motion makes it static. Forced colors uses a system-color border and fill. Controls sit outside progress semantics. Keep initiating controls mounted during stage changes and focus a neighboring row when removing a focused file row. The changing upload subtree opts out of browser scroll anchoring. Use the picker only when the list becomes empty, with `focus({ preventScroll: true })` so focus does not move the viewport.

The demo [lifecycle owner](../../apps/demo/app/uploads/use-upload.ts) demonstrates multi-file append, partial rejection, independent runs, Cancel, Retry, and Remove. It is a simulator, not a transport adapter or storage service. Production consumers provide their own request cancellation, processing retries, persistence, deduplication, concurrency limits, and error handling according to their backend.

## Quiet composition and polish

The example uses Card for its container, with the scoped `shadow-upload` token: stacked translucent black depth in Light and one low-opacity white ring in Carbon. Footer dividers use the density-aware `--anaphor-border-hairline` token (1px, or 0.5px at 2dppx). The drop surface keeps a real input boundary and uses an independent 8px radius, separated from the 12px card by at least 24px in the wider layout.

Rows reserve a 4px meter slot in every phase, a minimum-width action slot that can grow and wrap, tabular measurements, and space for status and helper copy. Percentages sit on the metadata line so filenames keep their full measure. Filename, file icon, and actions retain their positions as work progresses. Contextual icons crossfade in a fixed inert slot; removal fades over 120ms and immediately removes the exiting row from keyboard and accessibility interaction. Reduced motion skips these transitions. Long filenames wrap naturally; batches grow the list intentionally.

Remove and Cancel use existing Button/Tooltip parts with explicit accessible names and 40px desktop targets (44px on coarse pointers). Per-file and batch initiating actions stay mounted through completion; the batch action becomes focusable and unavailable when no files are ready. The example scopes neutral focus and the 0.96 press scale without changing other Anaphor controls. The demo reuses PlaygroundControls, shared Select/Range/Check fields, and the manual’s MorphSurface instead of a separate floating tool.

Action colors use the existing semantic Button tones: Choose/Add is always accent/solid, Upload and Retry are accent/outline, batch Upload is accent/solid, and Remove is danger/ghost. Cancel remains neutral/ghost because it interrupts work and keeps the file. Inactive upload/completion labels stay neutral. No palette values change. The footer owns the page theme switcher; the upload example has no duplicate switcher.

## Surface and layout review

The upload keeps its existing card depth. Enabled solid/outlined actions use the upload-action shadow tokens; outlines have a translucent shadow edge instead of a heavy solid keyline. Light gets a compact stacked shadow; Carbon gets one white ring. Disabled and completed controls lose elevation and use a quiet neutral fill. The drop target remains a real form boundary, with neutral fill during rejection and lower emphasis when disabled.

Rows use spacing for grouping instead of repeated separator lines. Identity, metadata, measurement, and status share the same leading text edge; actions remain in a trailing zone with 12px separation. The card’s 24px inset gives the drop target an independent surface. The status/actions arrangement uses the named upload container at 28rem, rather than the viewport. The metric reserves one line even when empty, so phase changes do not change the row height. Mirror layout in the shared controls exercises RTL, including progress origin and travel direction.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `packages/design-system/src/components/file-upload.tsx:64` | Disabled selection used the strongest gray fill and retained dark label text. | Neutral fill, muted labels, quieter dotted boundary. | Surface emphasis: unavailable input should recede. |
| MEDIUM | `apps/demo/app/uploads/upload-example.tsx:72` and `:79` | Viewport breakpoint and fixed English button width. | Container query, growing/wrapping action labels, stable minimum sizes. | Adaptivity: a narrow canvas inside a wide window must stack its own controls. |
| MEDIUM | `apps/demo/app/uploads/upload-example.tsx:61` | A reserved percentage column squeezed long filenames. | Percentage sits beside metadata with a reserved line height. | Order by importance: file identity gets the full leading measure. |
| MEDIUM | `packages/design-system/src/components/file-upload.tsx:130` and `apps/demo/app/uploads/upload-demo.tsx:27` | Known/unknown progress assumed left-to-right direction. | Mirrored fill origin and activity direction; local RTL control. | Logical layout: measurement follows the component’s reading direction. |
| LOW | `apps/demo/app/uploads/upload-example.tsx:13` and `:89`; `packages/design-system/src/styles.css:31` and `:94` | Action outlines and tooltips had heavy/double edges. | Soft action shadows, single tooltip edge, flat disabled states. | Depth: translucency gives interactive objects separation without harsh borders. |
| LOW | `apps/demo/app/uploads/upload-example.tsx:63` | Empty percentage text had a shorter line box than measured text. | The metric reserves one line height in every phase. | Stable geometry: showing a value must not move the next file. |
| LOW | `apps/demo/app/uploads/upload-example.tsx:52` and `:67` | Repeated file separators and unrelated leading edges. | Space between files; meter and status align with filename. | Grouping/alignment: space and shared edges carry ownership before extra lines. |

Browser review covered empty, selected, rejected, disabled, uploading, finishing, processing, complete, and both recoverable failures; Light/Carbon; 320px and 1440px viewport overrides; a 390px canvas inside a wide window; and the RTL mirror. The long-file row kept the same height through selected/uploading/processing/complete/transfer failure after reserving the metadata line. Progress remained indeterminate during processing, with no numerical value. No visible text or page overflow appeared in the narrow check. Interaction/type tests, scoped lint, production build, and registry generation passed.

Not verified: actual 200% browser zoom, translated/pseudo-localized labels, physical OS file drag/drop, forced-colors rendering, and high-DPI hairline rendering. Synthetic drag tests remain the current evidence for disabled and nested drop behavior. The approval below covers the inspected states and widths.

Approve
