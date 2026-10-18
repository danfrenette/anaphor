# Rail and Deck carousels

**Outcome:** A Reference manual reader browses related reading through the accepted
finite Rail and Deck directions from [ANAPHOR-223](https://linear.app/anaphor/issue/ANAPHOR-223/explore-related-content-through-an-expressive-card-carousel).
Rail supports mouse/touch dragging without opening dragged links. Deck supports
pager navigation, exposed preview selection, and touch swipes; only its active
card exposes a reading link. Keyboard input retains usable focus, and keyboard
and reduced-motion navigation settle without spatial animation.

**Entry points:** The Manual index's **Rail and Deck** link, `/carousels?tab=rail`,
and `/carousels?tab=deck`. `/proto/carousel?v=1` redirects to Rail, `v=2` to Deck,
and other versions to Rail. The selected tab survives refresh via the URL.

**Prerequisites:** Installed project dependencies, Playwright Chromium and WebKit,
and a free port 3105. See [Development](../../README.md#development) and
[Testing](../../TESTING.md). No credentials, account, external data, or seeded
state are required. Preserve existing local changes.

**Launch / doctor:** Run the command below from the repository root. The existing
Playwright configuration builds the current production demo, starts its own server
on `http://127.0.0.1:3105`, waits for readiness, and stops that server when the run
ends. It deliberately does not reuse a preexisting server. Record HEAD and dirty
source before the run; HEAD alone does not identify an uncommitted build. The tests
confirm the expected named carousel region is usable before exercising it.

**Drive:** `pnpm exec playwright test e2e/carousel.spec.ts --workers=2`.
This runs the configured desktop Chromium and 320px mobile WebKit projects.
The file is discovered by the existing full browser suite and CI without a new
configuration. It covers:

- Rail Home/End and arrow navigation, finite disabled boundaries, pager focus,
  and absence of a misleading current-card announcement.
- Deck exposed preview click/tap, keyboard preview activation and focus return
  to the carousel; one accessible reading link; Home/End and boundary behavior.
- Desktop dragging over a Rail reading link, movement into the collection,
  suppressed navigation after dragging, then ordinary link activation after Home.
- Trusted Chromium touch movement through both styles at 320px. The test uses a
  separate mobile context and browser CDP input, then closes that owned context.
- Manual navigation, tab changes, URL persistence after refresh, and old-route
  redirects with a visible destination carousel.
- Ordinary Next clicks with reduced motion, frame-stable card positions,
  immediate keyboard navigation with normal motion enabled, and visible focus.
- Light/dark WCAG 2/2.2 AA axe scans of `#content` (including contrast), no page
  errors, horizontal reflow, 44px pager targets, and overview/pager screenshots.

**Assertions:** Next and Previous reach finite collection boundaries without
wrapping. Rail links remain usable after a drag, and focus stays usable at a
disabled pager. Deck preview selection does not open an inactive card's link.
The selected style is restored from the URL. Motion preference and keyboard input
produce stable card positions rather than spatial animation. Both themes retain
accessible controls and fit the viewport; floating Manual tools must not prevent
an ordinary pager click. Expected outcomes come from accepted exploration notes,
not internal carousel state or library calls.

**Evidence:** Keep command output, pass/fail/skip counts, source revision and dirty
patch/content hashes in a run receipt. Playwright retains failing screenshots and
traces under `test-results/`. Theme tests attach overview and pager viewport
screenshots there. Preserve artifacts before a later Playwright run clears that
directory. Screenshots are review evidence, not automatically approved visual
regression baselines. The first executed receipt is
[2026-10-07 carousel browser coverage](receipts/carousels-2026-10-07.md).

**Cleanup / limits:** The harness stops only its owned production server; verify
port 3105 is no longer listening before finishing. Preserve failure evidence.
The WebKit project intentionally skips the desktop mouse-drag case and Chromium
CDP touch-movement case; WebKit still exercises preview taps, navigation, focus,
motion, routes, themes, axe and reflow. Trusted automated touch is browser input,
not physical hardware. Native Safari touch movement, Firefox, screen-reader
speech, 200% zoom, and frame-rate profiling remain outside this recipe. A passing
focused run does not claim full factory release verification.

## Catalog presentation

The page uses the Carousels title, a quiet Playground heading, and Rail/Deck
tabs with contextual guidance and shared code disclosures. Snippets identify
these as demo-owned compositions, not package exports. Reset remounts only the
selected carousel, leaving the tab and its URL unchanged. The browser suite also
checks reset and the matching code disclosure in each tab.

Local-preview screenshot capture was blocked by the browser tool’s URL policy
during the catalog cleanup. Automated production browser coverage is separate
from that local-preview evidence.
