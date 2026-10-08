# Carousel exploration — ANAPHOR-223

This records the accepted Rail and Deck directions from Dan's October 6
exploration, carried into the Reference manual with durable browser coverage.
Issue: https://linear.app/anaphor/issue/ANAPHOR-223/explore-related-content-through-an-expressive-card-carousel

## Reference evidence

Requested reference: https://jakub.kr/writing/the-invisible-side-of-design-engineering .
The public article did not contain the carousel. After Dan authenticated, the
reference was exercised in Zen at
https://interfaces.dev/magazine/issues/the-invisible-side-of-design-engineering .
No reference source code, article copy, or paid assets are included here.

Observed behavior:

- Five interactive examples: Performance, Increased hit areas, Gaps between
  items, Reduced motion, and Locales. Each card contains comparison controls.
- A broad active card, rounded corners, quiet elevation, narrow neighboring
  previews, and subdued outer edges. Desktop comparisons use two columns.
- Circular Previous/Next controls, a caption, and a Slide N of 5 announcement.
  Only active example controls appeared in the accessibility tree.
- Next after card 5 returns to 1. ArrowRight with Next focused did not advance;
  one desktop title drag selected text. These observations do not prove that
  keyboard or drag navigation is absent everywhere.
- In 402×874 touch-simulated responsive mode, comparisons stacked vertically,
  with centered navigation. Taps worked; one simulated drag did not advance.
- Movement maintained neighboring cards in the row. Timing, springs, offscreen
  mounting, and reference reduced-motion behavior were not measured.

Side previews plausibly make a collection discoverable while reserving a large
working area for the active item. A translated row and inert neighboring content
are implementation inferences, not claims about the reference's internals.

## Accepted Anaphor direction

The authorized creative exploration compared Rail, Deck, and Index at real size.
Dan selected Rail and Deck. The rejected Index and exploratory picker are not
part of this delivered implementation.

**Rail** keeps equal-weight cards visible for scanning. Embla 8.6 supplies mouse
and touch drag physics, momentum, click suppression, finite navigation, and
immediate programmatic jumps. There is no current/total counter: multiple cards
can be visible at once. Snap boundaries drive pager enabled state.

**Deck** gives one card full interaction with inert neighboring card contents.
Native buttons over exposed previews select those cards without opening their
child links. Selection returns focus to the carousel. Dan rejected a larger
staged clearance animation as jarring; the accepted motion is simultaneous
220ms transform/opacity transition with immediate depth ordering. Keyboard and
reduced-motion changes are immediate. Touch swipes advance the finite collection.

Both styles use Anaphor Card/Text/Button, shared typography, token colors,
spacing rhythm and elevation. Illustrations and note copy are original sample
material. Finite boundaries, disabled end controls, and no autoplay remain the
accepted behavior. This is a demo-local composition, with no new package exports
or registry component admission.

## Routes and verification

The manual's Carousels group opens `/carousels`. Tabs select Rail or Deck and
update `?tab=rail` or `?tab=deck`, retaining the chosen style across refresh.
`/proto/carousel?v=1` redirects to Rail and `v=2` to Deck; other versions use Rail.

[The feature recipe](../verification/carousels.md) records repeatable browser
checks. [The execution receipt](../verification/receipts/carousels-2026-10-07.md)
records the tested revision, ordinary-click pager regression, and remaining limits.
Mouse drag, trusted Chromium touch at 320px, keyboard/focus, finite boundaries,
reduced motion, both themes, accessibility and route persistence are exercised.
Screenshots are evidence rather than approved visual-regression baselines.

Sources for the chosen Rail library: [Embla v8 options](https://www.embla-carousel.com/docs/v8/api/options)
and [methods](https://www.embla-carousel.com/docs/v8/api/methods).
