# Diff reading controls: icon sources

Checked 2026-10-15. Scope: unified, split, and line wrapping in the reusable Diff component. This is source research and a design recommendation, not a usability study.

## Recommendation

Use **Octicons `RowsIcon`, `ColumnsIcon`, and `WrapIcon`** together for the three reading controls, at 16px, beside Copy in the file header. The dedicated wrap symbol communicates more than the existing elbow arrow; using one family for all three keeps their geometry coherent. This is a design judgment. The official catalog documents each React export: [Rows](https://primer.style/octicons/icon/rows-16/), [Columns](https://primer.style/octicons/icon/columns-16/), [Wrap](https://primer.style/octicons/icon/wrap-16/).

Document a narrow exception to [Anaphor's Phosphor convention](../../DESIGN.md#iconography): Diff's three reading controls use Octicons for their matching layout and dedicated wrapping symbols. Phosphor remains the default elsewhere. Rows and Columns are layout metaphors, not intrinsically unambiguous diff commands; retain the accessible names and tooltips “Unified view,” “Split view,” and “Wrap lines.” Removing the separate question-mark help control is a product decision, not a property of the library.

## Verified options

| Source | Concrete candidates | Integration and tradeoff |
| --- | --- | --- |
| GitHub Octicons | `RowsIcon`, `ColumnsIcon`, `WrapIcon` | Official React components from `@primer/octicons-react`; each catalog page above demonstrates `size={16}`. Rows/columns provide a matching pair and wrap has its own dedicated glyph. [MIT license](https://github.com/primer/octicons/blob/main/LICENSE). |
| Phosphor | `RowsIcon`, `ColumnsIcon`, `ArrowElbowDownLeftIcon`; also `TextColumnsIcon` and `TextAlignLeftIcon` | React package already used here. The elbow arrow is an approximation for wrapping; text alignment/columns risk suggesting formatting controls. [Rows SVG](https://github.com/phosphor-icons/core/blob/main/assets/regular/rows.svg), [Columns SVG](https://github.com/phosphor-icons/core/blob/main/assets/regular/columns.svg), [official React integration and MIT license](https://github.com/phosphor-icons/react). Names also checked in installed `@phosphor-icons/react` 2.1.10 declarations. No `TextWrap`/`Wrap` component was found in that installed package; this is version-scoped, not a claim about every future catalog. |
| Pierre Diffs | `diffs-icon-diff-unified`, `diffs-icon-diff-split` | Actual diff-specific symbols containing plus/minus marks; shipped as `SVGSpriteSheet` with `SVGSpriteNames`, rather than individual React icon components. No wrapping symbol in the inspected sprite. Verified against installed `@pierre/diffs` 1.5.2 `dist/sprite.d.ts` and `dist/index.d.ts`, and [upstream sprite source](https://github.com/pierrecomputer/pierre/blob/main/packages/diffs/src/sprite.ts). The project uses [Apache-2.0](https://github.com/pierrecomputer/pierre). A viable pair, but requires sprite integration and another source for wrapping. |
| Lucide | `rows-2`, `columns-2`, `text-wrap` | Another complete visual vocabulary: [rows-2](https://lucide.dev/icons/rows-2), [columns-2](https://lucide.dev/icons/columns-2), [text-wrap](https://lucide.dev/icons/text-wrap). [License](https://lucide.dev/license) includes ISC and MIT attribution. Not selected because Octicons provides the desired trio without needing a second alternative family. |

## Octokit and provenance

**Octicons** is the GitHub icon library. **Octokit** is the GitHub API SDK for browsers, Node.js, and Deno; it is not the relevant icon dependency. [Octokit repository](https://github.com/octokit/octokit.js), [Octicons React package](https://github.com/primer/octicons/tree/main/lib/octicons_react).

Phosphor describes its own core repository as the source of truth for its SVG assets and catalog. Its React package builds on that icon family. The inspected primary documentation does not establish that Phosphor derives from or wraps Octicons; do not state that relationship as fact. [Phosphor core](https://github.com/phosphor-icons/core), [Phosphor React](https://github.com/phosphor-icons/react).

## React integration

```tsx
import { ColumnsIcon, RowsIcon, WrapIcon } from "@primer/octicons-react";

<RowsIcon size={16} aria-hidden="true" />
<ColumnsIcon size={16} aria-hidden="true" />
<WrapIcon size={16} aria-hidden="true" />
```

The official [package manifest](https://github.com/primer/octicons/blob/main/lib/octicons_react/package.json) reported version **19.40.0** when inspected, `react >=16.3`, `sideEffects: false`, a root export, and individual icon subpath exports. Confirm the registry version during installation; upstream repository metadata is not proof of a particular npm dist-tag. The catalog's root named imports are the directly documented integration. No new package was installed as part of this research.

Button labels and selected state belong to Anaphor's controls, with decorative SVGs inside. The icons do not supply the interaction semantics. Keep the existing toggle behavior and shared tooltip primitives when moving them into the file header.

## Subsequent visual trial

The user requested Pierre's dedicated unified/split pair alongside Octicons'
`WrapIcon`. The current header uses that combination, preserving the upstream
16px paths. The copy icon remains Phosphor `Copy` in the shared CardCopyButton;
it is not a custom drawing. This trial supersedes the initial coherent-trio
recommendation above and remains open to visual refinement.

The subsequent copy trial replaces only Diff's idle copy glyph with Octicons
`CopyIcon`; other CardCopyButton consumers retain Phosphor. The shared success
checkmark remains unchanged.

Octicons also exports `UnwrapIcon` (verified in installed 19.40.0,
`dist/icons/UnwrapIcon.mjs`). The reading control now pairs it with `WrapIcon`
to indicate the next action. Only the alternate unified/split action is shown.
