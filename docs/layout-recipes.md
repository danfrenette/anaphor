# Layout recipes

Status: first-pass recipes, demonstrated in `/studies`. These are compositions,
not new package tokens or mandatory layout components. Tailwind's spacing scale,
CSS Grid and flexbox remain the implementation vocabulary.

## Design rationale

[Refactoring UI](https://refactoringui.com/) informs the approach: start with a
feature rather than a grid, constrain recurring choices, establish hierarchy,
and leave unused space when it improves comprehension. The values below are
Anaphor proposals, not values prescribed by the book.

## Application: scan, inspect, act

Signal uses a centered outer canvas capped at 96rem, including its inline inset.
The inset consumes the existing page-gutter token but caps it at 3rem: 24px on
small viewports, 48px from 40rem. Dense applications need not inherit the manual's
80px desktop gutter. The existing navigation rail remains independent.

- 8px within a metric or filter group; 16px between header controls.
- 24px panel padding and sibling-panel gap; 32px after the summary; 48px before
  the next major task group. These are direct spacing choices, not aliases.
- Three equal summary columns represent comparable metrics. The analysis uses
  a 2:1 split with an 18rem minimum supporting panel, not a twelve-column mandate.
- Below 56rem of **available workspace content**, analysis becomes one column;
  the supporting field becomes horizontal. Below 40rem, metrics and field stack.
  These thresholds reserve room for the actual panel content, independently of
  whether the manual sidebar is expanded.
- Title actions and panel controls wrap in document order. The data table owns
  horizontal overflow; the page does not. Preserve the table's existing behavior
  until the separate data-table work is ready.

Use this recipe for a data workspace, not automatically for settings forms or
small dialogs. Let those tasks occupy less space.

## Editorial: read, pause, continue

Field Notes caps its outer canvas at 70rem with the same 24–48px inset. The text
track uses the existing 65ch reading token. Header, paragraphs, quotes and footer
share that track; the interactive figure spans the wider canvas through subgrid.
At small sizes both tracks converge without negative margins or viewport overflow.

- Paragraphs have 24px separation and the shared reading line-height.
- Section headings have 48px effective separation from a preceding paragraph
  (24px paragraph margin plus 24px heading margin in grid flow), with 16px below.
- The header-to-body gap is 48px; article entry is 64px, reduced to 48px on mobile.
- Metadata is subordinate; the article remains the primary content. There is no
  empty margin-note rail until a real annotation requires one.
- Wide media is optional. Prose never expands just to fill an available screen.

## Paper and promotion

Show these as application/editorial layout examples, with wide and narrow frames,
not as a universal grid or new primitive token scale. Preserve semantic document
order when laying out the frames. Record outer bounds, insets, reading measure,
group spacing and collapse behavior beside the examples.

Promote a recipe value to a shared token only after another real consumer needs
the same contract. Keep the existing public spacing and typography APIs intact.
