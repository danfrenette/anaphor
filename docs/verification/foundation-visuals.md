# Visual foundation references

**Outcome:** Readers find Shadows, Spacing, Radius, and one combined Typography
reference from Foundations or manual search. Samples document the shipped system
without introducing new tokens or changing component defaults.

**Entry points:** `/shadows`, `/spacing`, `/radius`, `/typography`.
The original `/#typography` anchor links to the combined typography page.

**Drive:** Run `pnpm exec playwright test e2e/foundation-visuals.spec.ts
e2e/typography.spec.ts e2e/typography-specimen.spec.ts
e2e/manual-index-review.spec.ts e2e/command-palette.spec.ts e2e/sections.spec.ts`.
The Playwright config builds and serves the manual on port 3105.

**Assertions:** All three new links navigate from the desktop rail and mobile
drawer with matching breadcrumb context. Light and dark references have readable
content without horizontal page overflow. Spacing bars use the live base token;
radius samples use named radius variables; shadows use existing theme-aware
formulas. Typography search returns one destination containing the overview and
reading experiments, whose controls and reset remain local to the specimen.

**Visual review:** Inspect desktop and 320px layouts in both themes. Compare
shadow treatments on the same surface; confirm radius differences and spacing
bar lengths are visible. No new visual baselines are accepted automatically.

**Cleanup:** Record checks against the tested working tree and stop only the
server started for the review.
