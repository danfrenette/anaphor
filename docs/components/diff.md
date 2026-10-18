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

Import `Diff`, `DiffProps`, and `DiffSource` from `@anaphor/system`. The source
registry item is `danfrenette/anaphor/diff`.

## Source and ownership

- `files`: complete `before` and `after` objects with `name` and `contents`.
  Use null on one side for additions/deletions. Different names describe renames.
- `patch`: a single-file unified `patch` and a fallback `path`. Multiple files and
  invalid patches produce an explicit status. Patch context cannot be expanded
  beyond the supplied source. Supply complete files to enable full expansion.
- `unavailable`: a `path` and a reader-facing `reason`, including binary changes or
  a missing patch. Binary previews are outside this component.

Fetching, PR provenance, authentication, persistence, and explanation text belong
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
it. Line emphasis is controlled; interactive range selection and comments are
not included. A collapsed file stays collapsed until the reader opens it.

## Initial limits

This first version uses Pierre's file renderer without a virtualizer. Bounded
height limits the visible surface, not work performed. Very large files still
need a measured virtualization pass before use at repository-viewer scale.
The excerpt example supplies one patch hunk; arbitrary range slicing from a full
file is not yet an API. Full-file context expansion is supported independently.

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
