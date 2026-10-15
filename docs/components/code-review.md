# Code review

`CodeReview` presents captured source at pinned revisions. It uses Pierre Diffs
for syntax, line numbers, change indicators, line selection, and collapsed diff
context. It has no repository, network, authentication, or tour dependency.

```tsx
import { CodeReview } from "@anaphor/system";

<CodeReview
  aria-label="Explicit refresh"
  before={{
    path: "reader.ts",
    revision: "base-sha",
    content: "const refresh = false;\n",
    href: "https://github.com/owner/repo/blob/base-sha/reader.ts",
  }}
  after={{
    path: "reader.ts",
    revision: "head-sha",
    content: "const refresh = true;\n",
    href: "https://github.com/owner/repo/blob/head-sha/reader.ts",
  }}
  theme="light"
  regions={[{
    id: "refresh",
    label: "Refresh policy",
    side: "after",
    startLine: 1,
    endLine: 1,
  }]}
  notes={[{
    id: "policy",
    side: "after",
    startLine: 1,
    endLine: 1,
    children: "The reader refreshes only after an explicit action.",
  }]}
/>
```

Supply `before`, `after`, `regions`, `notes`, and `theme` explicitly. At least
one source must exist. Use `null` for an absent side of an added or deleted file;
an empty string is a captured empty file. Equal contents produce an unchanged
source view. Native figure attributes, class names, and the figure ref pass through.
Use `aria-label` or `aria-labelledby` to name the review in its surrounding page.

Each source contains `path`, `revision`, and complete `content` starting at file
line 1. `href` is optional. Consumers own URL validation and must pin links to
the declared path and revision. Captured bytes supply the code; opening the
component never fetches the source link. Do not insert a sliced excerpt and
claim that its first line retains the original file number.

Regions identify authored reading ranges. Their stable `id`, `label`, `side`,
`startLine`, and `endLine` supply jump controls and inline range labels. Authored rows retain a separate orange inset marker; the reader selection remains independent. Notes use
that same range shape, a stable `id`, and React `children` for the explanation.
Ranges use inclusive, positive, one-based file line numbers. Consumers validate
that ranges exist on the declared side and use unique IDs within each list.
Notes anchor at the range's first line and state its complete range. Author
regions and notes for the important claims rather than every changed line.

Reader gutter selection is transient and independent of authored annotations.
Its status and Clear action do not edit the source or author annotations.
Selecting a region expands captured context and focuses its inline explanation; the full-context disclosure also
provides both complete source texts for ordinary reading and copying. Pinned source links and full revisions sit inside Source and full context; the main caption shows only the file path. The view covers the captured files, not the complete PR.

The default source viewport is at most 24rem high, including for entirely added files. Expanding full context removes that height limit. Source text and original line numbers are never sliced or rewritten.

The diff is unified in containers narrower than 760px and split in wider
containers. Code wraps to retain narrow-page reflow. Shared typography, surface,
focus, and selection tokens apply to Pierre's shadow surface; syntax uses its
GitHub high-contrast light/dark themes. Pass the resolved application theme. Without a
ResizeObserver the view remains unified.

Region controls, Clear, and design-system context Collapsible support keyboard use. Main
diff gutter selection uses Pierre's pointer interaction; text remains selectable
and complete source text remains available through the disclosure. Browser
verification must cover shadow-surface source correspondence, context expansion,
region jumps, reader selection, both themes, and narrow layout. Component tests
cover provenance, authored annotation semantics, full captured text, unchanged
files, and empty added/deleted files. Registry installation must supply
`@pierre/diffs` as a runtime dependency.

The source viewport is a keyboard-focusable group. Authored ranges use an inset
marker; classic plus/minus indicators distinguish changes without relying on
color. High-contrast syntax themes preserve readable comments on shared surfaces.

The initial bounded viewport starts at the first authored range without scrolling the page. The main narrative can lead directly from the slice heading to annotated code; source provenance remains available on request.
