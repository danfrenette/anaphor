# Diff

`Diff` renders one file's changes with Pierre Diffs. Linear Diffs supplies the
composition reference; Anaphor owns typography, surfaces, controls, and focus.
The catalog at `/#diff` compares layouts, line emphasis, and file states, followed
by a configurable playground using complete before/after files.

```tsx
const [layout, setLayout] = useState<"unified" | "split">("unified");
const [wrap, setWrap] = useState(false);

<Diff
  source={{ kind: "files", before, after }}
  layout={layout}
  wrap={wrap}
  controls={true}
  context="collapsed"
  maxHeight={null}
  onLayoutChange={setLayout}
  onWrapChange={setWrap}
/>
```

Import `Diff`, `DiffProps`, `DiffSource`, `DiffNote`, and `DiffAnnotations` from `@anaphor/system`. The source
registry item is `danfrenette/anaphor/diff`.

## Source and ownership

- `files`: complete `before` and `after` objects with `name` and `contents`.
  Use null on one side for additions/deletions. Different names describe renames.
- `patch`: a single-file unified `patch` and a fallback `path`. Multiple files and
  invalid patches produce an explicit status. Patch context cannot be expanded
  beyond the supplied source. Supply complete files to enable full expansion.
- `unchanged`: a complete `file` and nonempty `excerpts` of inclusive one-based
  `{ start, end }` ranges. Ranges are sorted and overlapping/adjacent ranges merge
  for display. Invalid bounds produce an explicit status; they are never clamped.
  Omitted regions expand through the same Pierre controls, retaining original
  numbering. Use `context="expanded"` to inspect all supplied source.
- `unavailable`: a `path` and a reader-facing `reason`, including binary changes or
  a missing patch. Binary previews are outside this component.

Fetching, PR provenance, authentication, persistence, and authorship of explanation text belong
to the consuming application. No tour document schema changes are included.
The application must identify truncated source through `notice`; the component
cannot infer whether its supplied contents are complete.

## Reading

All configuration is explicit. `layout`, `wrap`, `controls`, `context`, and
`maxHeight` are required. Layout and wrapping are controlled, so one application
control can coordinate several instances. Built-in controls appear when their
callbacks are provided. At widths below 640px, the effective layout becomes
unified without overwriting the application's preferred layout.

`context="collapsed"` shows change hunks with expandable unchanged regions when
full files exist. `expanded` shows the whole file. `maxHeight={null}` follows
page flow; a numeric value bounds the code region. Collapse remains local and uses the shared Collapsible’s 200ms ease-out height
transition, with transitions removed for reduced motion. The divider belongs
to the panel so the collapsed file has a single outer border.
Copy patch is available for patch input; Copy new file is available only with
complete after contents. Native code selection is available in either mode.

`highlightedLines` uses original one-based line numbers, `start`, `end`, and
`side: "additions" | "deletions"`. `revealKey` requests an immediate scroll to a
rendered highlighted range when it changes. It does not steal keyboard focus.
For a range outside the displayed hunks, supply expanded context before revealing
it. Line emphasis is controlled; interactive reader range selection is not included.
Legacy `revealKey` keeps its page-flow scrolling behavior when `maxHeight` is null.
Authored-note reveal below opens the file and expands its context automatically.

## Initial limits

This first version uses Pierre's file renderer without a virtualizer. Bounded
height limits the visible surface, not work performed. Very large files still
need a measured virtualization pass before use at repository-viewer scale.
Changed-file excerpts still use supplied patch hunks. Arbitrary slicing of changed
files is outside this API; `unchanged` supports authored excerpts of a complete
unchanged file. Full-file context expansion remains available.

## Verification

See [the diff recipe](../verification/diff.md). Design refinement should preserve
keyboard controls, original line numbers, explicit source limits, narrow reflow,
and both themes. Change colors retain Pierre's semantic green/red signals with
explicit plus/minus markers; orange is reserved for emphasis and focus.

## Reading controls and composition

Pierre's dedicated unified/split sprite glyphs and GitHub Octicons WrapIcon
represent the reading controls. The original Pierre paths are read from its
public sprite export without globally shared symbol IDs. The controls sit in the file header next to Copy, with explanatory
hover/focus tooltips and accessible names. They remain available when the code is
collapsed. The header wraps within narrow surfaces; there is no separate toolbar
or help button. The catalog displays additional file states directly, each with its own file disclosure. Diff has no tour-specific data contract; articles, documentation,
reviews, and tours can compose their own prose around the same renderer.

See [the primary-source icon research](../research/diff-control-icons.md) for the
Octicons/Pierre/Phosphor comparison and the focused iconography exception.

The diff header uses Octicons `CopyIcon` through CardCopyButton’s optional
`icon` content slot. Clipboard handling, accessible feedback, and the success
checkmark remain shared; other copy buttons retain their Phosphor icon.

Only the alternative layout action is shown: Switch to split view in unified
mode, and Switch to unified view in split mode. At narrow widths, the split
action is disabled. WrapIcon and UnwrapIcon similarly show the next action.
The example starts without line emphasis. Locate the guard highlights line 20,
adds an explanatory label, and offers Clear highlight. The orange marker denotes
application-supplied emphasis, not a change type.

## Authored notes

```tsx
const notes: DiffNote[] = [{
  id: "guard",
  title: "Stop at a missing section",
  body: <p>Unknown sections return no next section.</p>,
  presentation: "inline",
  range: { side: "after", start: 20, end: 22 },
}];
const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
const [revealKey, setRevealKey] = useState(0);

// An external explanation can use this action while reusing notes[].body.
function locate(note: DiffNote) {
  setActiveNoteId(note.id);
  setRevealKey(key => key + 1);
}

<Diff source={source} layout="unified" wrap controls={false}
  context="collapsed" maxHeight={280}
  annotations={{ notes, activeNoteId, onActiveNoteChange: setActiveNoteId, revealKey }}
/>
```

`annotations` is optional content. When present, its notes, active ID (or null),
and change callback are explicit. Each note needs a unique stable `id`, `title`,
React `body`, `presentation: "inline" | "popover"`, and one inclusive range with
`side: "before" | "after"`. Array order determines the visible number. Keep source
and note identities stable between reading interactions; replace them when the
captured source or authored notes change. The application resets its controlled
active ID and reveal key for a new evidence item.

Notes appear after their range's final line, grouped when they share that anchor.
Numbered inline titles start collapsed; popovers open on activation and return
focus on dismissal. Opening a note requests active emphasis through the callback.
Changing only the active ID does not request scrolling. Existing `highlightedLines`
remains available; an active authored note takes precedence over that legacy emphasis. An invalid
active note clears emphasis rather than falling back to an unrelated legacy range.

Changing `annotations.revealKey` follows the currently active note. A repeat request
for the same note needs a new key. It opens the file and expands all available
context, then reveals the first target line within the numeric `maxHeight` viewport.
It retains the invoking focus and does not scroll the page or open the explanation.
With `maxHeight={null}`, note reveal expands and emphasizes without scrolling;
use a numeric bound for tour inspection. Existing `context` still specifies the
initial context; a reveal's expanded context remains until source replacement.
Very tall ranges reveal their beginning; the rest stays available by scrolling.

Pure renames with complete contents render annotated context without manufacturing
changes. Invalid/out-of-source note ranges, including gaps in partial patches, show
an unavailable-target message with an operable explanation outside the code slots.
They never highlight a different line. Source failure does not discard authored
explanations. Notes, external lists, and source identity validation remain app-owned;
this component neither stores comments nor fetches source.

The Content sidebar links directly to Authored notes at `/#authored-notes`
(overlaps, same-anchor notes, both sides, an external context reveal) and Unchanged
excerpts at `/#unchanged-excerpts` (multiple regions, long content). Both are Diff
compositions, with independent inspection state. Sidebar and page order are alphabetical. File states
also demonstrate notes on additions, deletions, pure renames, and unavailable source.

Shared component audit: Collapsible owns inline disclosure and file collapse;
Popover owns contextual positioning/dismissal/focus return; Button/ButtonLabel own
controls; Tooltip and CardCopyButton retain existing header behavior. No shared
primitive API change is needed for this package. The source registry adds Popover
as a dependency and exercises its installed annotation consumer.

The package and source registry pin Pierre Diffs to `1.5.2`, the verified renderer.
Version `1.6.0` does not register the GitHub high-contrast themes used here by default;
a fresh registry consumer fails to render code with `UnregisteredThemeError`.
Upgrade the theme integration and rerun independent consumer verification together
before changing this pin.
