# A dedicated Collapsible playground

The manual sidebar now contains navigation rather than an embedded book outline.
Choose **Playgrounds → Collapsible playground** to explore the same nested chapter
example. The former Studies pages are retired, and their Card/carousel links now
lead to the corresponding existing manual references.

This implements [ANAPHOR-258](https://linear.app/anaphor/issue/ANAPHOR-258/remove-out-of-place-dropdown-example).
The ticket screenshots identify the Source outline disclosures; the separate Menu
component remains in the manual. Orange selection edges are removed from the
outline, while a neutral background, heavier text and `aria-current` show selection.

## Finding and using the outline

[The shared navigation data](https://github.com/danfrenette/anaphor/blob/1eed1db2942b29fc4631735b39371993cfedb975/apps/demo/app/demo-shell.tsx)
provides the sidebar entry, command-search entry and breadcrumb. On a narrow
screen, selecting the entry closes the navigation drawer and opens the playground.
The [new server route](https://github.com/danfrenette/anaphor/blob/1eed1db2942b29fc4631735b39371993cfedb975/apps/demo/app/(manual)/collapsible-playground/page.tsx)
composes the existing client outline; it does not add another disclosure API.

[SourceOutline](https://github.com/danfrenette/anaphor/blob/1eed1db2942b29fc4631735b39371993cfedb975/apps/demo/app/source-outline.tsx)
owns selection above the independently expanded chapters. Closing and reopening a
chapter preserves the selected section. Leaving the route and returning restores
the example's documented initial state; persistence across navigation is not a new
claim. Enter and Space toggle disclosures, and Tab visits visible controls. This
remains a list of disclosures rather than an ARIA tree.

## Retiring Studies without dead links

The Studies overview, Signal dashboard, Field Notes article, and their private
CSS/figure/shader are deleted. Their three URLs now return 404. Existing Card and
carousel links lead to `/foundations#layout-reference`, `/#motion` or `/#principles`
as appropriate. Package layout tokens and their executable Foundations reference
remain available. This retirement does not change the source registry or stored data.

## Verification and review

Implementation revision: `1eed1db2942b29fc4631735b39371993cfedb975`, based on fetched
`main` at `14d85d9223072aca20c8ba2cf5ce2d15fd508d8a`. The isolated delivery branch
excludes unrelated local button, upload-documentation and research changes.

The [Collapsible recipe](../verification/collapsible.md) covers independent
expansion/selection, keyboard/focus, narrow wrapping, themes and accessibility.
The existing Studies route tests now assert retirement, and the Card, carousel,
layout and theme tests follow their current destinations. Browser assertions first
failed for the missing playground route and for the still-served Studies overview
before the corresponding implementation slices.

The [verification receipt](../verification/receipts/collapsible-playground-2026-10-14.md)
records commands and provenance. Full lint and strict types passed. The bounded
integration run passed 164 tests with one native-only skip. The full production
browser attempt passed 310 tests with 43 device/support skips; one mobile focus
check and two macOS screenshot crops required follow-up. A fresh final-revision
strict run passed all 14 affected checks, including those three paths. The reviewed
macOS snapshots reflect stable one-pixel crop changes, without relaxed tolerances.
Registry Button and complete-UI installation/build/browser checks passed.

An isolated browser also exercised the new sidebar entry and command-search
result at 1280px light and 320px dark, confirmed the outline is absent from global
navigation, selection has a contrasting neutral background and no left border,
and observed no page errors. Native physical touch and Linux visual-baseline
execution were not performed locally; CI uses the existing Linux baselines.

Fresh Standards, Spec, Principles and Execution reviews inspected the change.
Principles identified that relocated selected rows initially shared the surrounding
background; the follow-up uses the existing neutral `muted` token for selection
and hover. Source review confirmed that correction. Security, concurrency and
performance passes are inapplicable: this change introduces no authentication,
external input, asynchronous writers, queries or hot loops. Compatibility review
accounts for deliberately retired URLs returning 404.

## Review and rollback

Review the outline's selected/hover treatment in both themes, sidebar/search
navigation on a narrow screen, and the intentional removal of old Studies URLs.
Reverting the two implementation commits restores the old routes and embedded
outline. No data migration, provider configuration, merge or deployment is part
of this change.
