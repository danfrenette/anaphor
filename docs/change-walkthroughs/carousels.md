# Rail and Deck: related reading in the Reference manual

A reader can open **Carousels → Rail and Deck** in the Reference manual and browse
five related notes without losing the page context. Rail keeps neighboring notes
visible and supports dragging. Deck brings one note forward while leaving nearby
cards available for direct selection. Both use Anaphor's existing typography,
colors, card surfaces, and controls.

This walkthrough covers [ANAPHOR-223](https://linear.app/anaphor/issue/ANAPHOR-223/explore-related-content-through-an-expressive-card-carousel)
and merged [PR #29](https://github.com/danfrenette/anaphor/pull/29). The
implementation links are pinned to its final head
[`c2f6bcd`](https://github.com/danfrenette/anaphor/commit/c2f6bcdb86e804896efbcc740872fe371e411711);
the merge commit is
[`5464b82`](https://github.com/danfrenette/anaphor/commit/5464b82b2879255a8a388c228c97eae4bda15efd).
The accepted direction came from an exploration of Rail, Deck, and Index. Dan
selected Rail and Deck, then selected the restrained original Deck movement after
rejecting a more pronounced clearance animation.

## From the manual to a note

The [manual sidebar](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/demo-shell.tsx#L108-L111)
links to `/carousels`. The [page and tabs](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/carousels/carousel-tabs.tsx#L6-L19)
choose Rail or Deck from `?tab=` and update that URL when the reader switches
styles, so a refresh or shared link preserves the choice. Earlier
`/proto/carousel?v=1` and `v=2` links
[redirect](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/proto/carousel/page.tsx#L1-L6)
to the matching demo.

Both styles render the same
[five story cards](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/carousels/shared.tsx#L5-L24).
Each card links to an existing manual note or foundation page; no remote content
or additional service is required. The shared pager supplies previous and next
actions. Rail hides its current/total counter because free dragging does not
imply one unambiguous current card.

## How each style moves

[Rail](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/carousels/rail.tsx#L6-L34)
uses Embla 8.6 for finite dragging, momentum, and suppression of a link click
after a drag. Its one effect subscribes to Embla selection and reinitialization
events, copies snap and boundary information into React, and removes those
listeners on cleanup. Arrow keys and Home/End jump directly to a snap; reduced
motion makes pager moves immediate. Named slide groups let assistive technology
identify the notes.

[Deck](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/carousels/deck.tsx#L6-L28)
keeps a single active reading card. Nearby cards expose native selection buttons;
their reading links are inert and hidden from the accessibility tree until the
card becomes active. Selecting a preview returns focus to the carousel. Its
[browse handler](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/carousels/shared.tsx#L25-L31)
clamps navigation at the first and last notes, handles keys, and recognizes
horizontal touch swipes. The
[Deck transition](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/apps/demo/app/carousels/deck.css#L1-L8)
uses a 220ms transform and opacity change; keyboard selection and reduced-motion
preferences remove that spatial movement.

The exploratory Index direction and staged Deck clearance were rejected in the
accepted design review. The [shadcn Base wrapper comparison](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/docs/research/carousel-wrapper-comparison.md)
led to named slides but retained demo-local Rail and Deck implementations because
they use different movement models. No reusable package API was added.

## Verification and deployment state

The [carousel verification recipe](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/docs/verification/carousels.md)
and [local execution receipt](https://github.com/danfrenette/anaphor/blob/c2f6bcdb86e804896efbcc740872fe371e411711/docs/verification/receipts/carousels-2026-10-07.md)
cover navigation, drag and touch input, focus, finite boundaries, reduced motion,
URL persistence, both themes, narrow reflow, and axe scans. The original
implementation passed 20 focused browser tests with 2 intentional input-path
skips; the named-slide follow-up passed 8 focused checks. These were supplied
results, not rerun for this documentation change.

[CI run 89](https://github.com/danfrenette/anaphor/actions/runs/37716182517)
passed code quality, the full Demo browser suite, and registry consumer checks
on the final PR head. Candidate visual baselines were intentionally skipped and
are not approved. Physical device swipes, screen-reader speech, and Firefox were
outside the focused local recipe.

The [PR deployment](https://vercel.com/danrfrenettes-projects/anaphor/FJXFivf35rCnixKyhFwfCVEAFLPV)
and [merge deployment](https://vercel.com/danrfrenettes-projects/anaphor/534ZnvCBP5ZJctKEK4fonzYy18si)
were blocked before building because the `anaphor` Vercel account is not a
member of the project team. Vercel's membership and redeploy flow quotes an
additional $20 per month; no access or billing change had been submitted when
this walkthrough was written. On October 8, the public
[`/carousels` route](https://anaphor.vercel.app/carousels) returned 404 while the
older manual remained available. [ANAPHOR-225](https://linear.app/anaphor/issue/ANAPHOR-225/restore-vercel-deployment-for-merged-carousel)
tracks resolution and production verification.
