# Carousel motion review — accepted Rail and Deck

Dan selected the restrained original Deck movement after rejecting a staged
clearance experiment. The delivered Deck uses 220ms transform/opacity transitions
with Anaphor's ease-out curve; depth order updates immediately. Keyboard and
reduced-motion selection stop spatial movement. CSS transitions retarget from
interpolated positions without a custom animation engine.

Rail delegates drag momentum and click suppression to stable Embla 8.6. Its
programmatic keyboard and reduced-motion navigation use immediate jumps. Its
pager follows finite snap boundaries, without a misleading current-card counter.

Exposed Deck previews are native selection buttons beside inert child contents.
Selecting one focuses the carousel, preserving keyboard continuity and preventing
hidden card links from opening.

The accepted motion is approved in the earlier design exploration. Browser
coverage in `e2e/carousel.spec.ts` verifies navigation and immediate keyboard /
reduced-motion outcomes on the delivered implementation. See
[the execution receipt](../verification/receipts/carousels-2026-10-07.md) for
actual results and limits. No physical-device, Firefox or frame-rate certification
is claimed.
