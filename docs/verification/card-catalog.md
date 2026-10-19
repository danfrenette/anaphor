# Card catalog

Visit `/#card`. Anatomy, Actions & footers, Edge-to-edge content, Showcase,
and Playground use quiet headings and inline code for reference examples.
Cards retain their own surfaces and elevation. The logo showcase uses the
shared AnaphorMark, with captions outside its framed preview.

Run `pnpm exec playwright test e2e/card-catalog.spec.ts e2e/manual.spec.ts --grep 'card catalog|cards compose|card copy|reference card|showcase previews' --workers=2`.
Check code disclosure by keyboard, variant/reset controls, clipboard feedback,
the reference link, accessibility in both themes, and narrow reflow.
The macOS Card and Showcase baselines were refreshed for this layout;
Linux baselines require verification in the pinned CI environment.
