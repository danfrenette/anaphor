# Deck carousel reference review

## Current Deck: code observations

The demo's `Deck` positions every card from its integer offset to the active index: each step adds `22%` horizontal translation, `10px` vertical translation, `2deg` rotation, and `5.5%` scale reduction. It shows two cards on either side, with the nearest card painted highest. A selection updates all transforms through one `260ms` ease-out CSS transition. The stack's `z-index` order changes immediately at selection (`apps/demo/app/(manual)/carousels/deck.tsx`, `deck.css`).

`useBrowse` records touch/pen pointer-down coordinates and changes the index only on pointer-up when horizontal displacement exceeds `48px` and dominates vertical displacement. It has no pointer-move visual update, velocity measure, drag resistance, or snap-back. It ignores mouse drag (`apps/demo/app/(manual)/carousels/shared.tsx`).

## Primary-source references

| Example | What its owner documents | Useful comparison |
| --- | --- | --- |
| [Swiper Cards effect](https://swiperjs.com/swiper-api#cards-effect) and [official template](https://studio.swiperjs.com/templates/cards-swiper) | Cards sit as a compact stack; default per-slide offset is `8px`, rotation `2deg`, shadows enabled. The template describes the top card dismissing in the swipe direction while the next rises into place, with touch and desktop drag. | Our `22%` offset is roughly 80px on a 23rem card before scaling: about ten times Swiper's default edge peek. Our symmetrical fan reads more like a spread than a single deck. |
| [Motion Card stack](https://motion.dev/examples/react-card-stack) | The top photo follows left/right drag; sufficient force **or** distance sends it off-screen and cycles it to the back. Its tutorial names `drag`, `useMotionValue`, `useTransform`, and `animate`. | Our card stays still while the finger moves, then all cards translate after release. No release velocity influences the result. The full source is behind Motion+, so exact thresholds and timings are not public. |
| [Motion Gallery stack](https://motion.dev/docs/react-gallery#stack) | Swipe the top card away to reveal the next; documented defaults are a `14px` peek, `50px` depth, and four cards behind the active one. | It keeps the next item spatially behind the current card. Our next and previous previews both sit to the sides, and selecting either re-centers the entire spread. |
| [Keen-Slider draggable card](https://keen-slider.io/examples) and [docs](https://keen-slider.io/docs) | The examples include a draggable card. Keen enables touch and mouse drag by default, supports drag-speed adjustment, and distinguishes snap, free, and free-snap release modes. | A known slider gives direct pointer feedback and a selectable release model. Our touch/pen swipe is a threshold-only command, and mouse drag does nothing. This is a comparison of documented interaction capabilities, not a claim about the example's visual effect. |

## Likely reasons the Deck feels unsatisfying (inferences)

1. **Gesture and motion are disconnected.** A card that does not track the pointer can feel like a button activated by a swipe, rather than a card being moved. This is the largest contrast with the Motion and Keen examples. It is also why increasing the CSS duration may make the after-release move smoother without making the gesture feel more tactile.
2. **The stack does not commit to a physical model.** The wide, symmetrical offsets expose previous and next cards as peers. Stack examples generally keep the next card behind the active one and have the top card leave along the gesture direction. Our index change moves every visible card by one slot in unison, so there is no clear departing top card and revealed successor.
3. **Depth may snap despite smooth transforms.** `z-index` changes as soon as the selected index changes. During the 260ms interpolation, the incoming card can suddenly paint over the outgoing one. That discontinuity may read as a jerk even though position and opacity interpolate. Verify this frame by frame before changing timings again.
4. **Desktop affordance is incomplete.** The reference interactions document mouse drag; our handler explicitly excludes mouse pointers. The neighboring card buttons are clickable, but a desktop user who tries to drag the card sees no response.

## Smallest useful experiment

Prototype one gesture-driven card: while dragging, map the active card's horizontal transform to pointer distance and modest rotation; on release, either snap back or send it out in the same direction, then promote the next card. Keep the current keyboard/pager controls and reduced-motion behavior. Compare that against the current fixed 260ms selection in normal-speed and frame-by-frame playback before selecting a final motion model.
