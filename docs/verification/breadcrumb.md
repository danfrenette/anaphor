# Breadcrumb

Visit `/#breadcrumb`. Link navigation uses ordinary links; current text is
not focusable. Chapter browsing includes a clickable current location; Enter,
Space and pointer activation browse ancestors without changing URL. Explore next
subsection returns deeper into the example. Section ancestry omits the current
item; activating an ancestor moves focus to its updated heading.

Run `pnpm exec playwright test e2e/breadcrumb.spec.ts e2e/manual-index-review.spec.ts --workers=2`
and `pnpm exec vitest run packages/design-system/test/breadcrumb.test.tsx`.
Run `pnpm --recursive typecheck` for native props, refs and current semantics.
Run `pnpm test:registry` for the complete-UI source installation.

Inspect desktop and 320px light/Carbon: long paths and unbroken labels must fit,
separators stay outside targets and attached to their following item, current
labels are legible, focus outlines remain visible, and coarse-pointer link/button
targets measure at least 44px. Verify disabled buttons cannot activate or submit
a form. Check reduced motion retains immediate interaction feedback. Physical
touch, dedicated screen-reader checks and 200% zoom remain manual acceptance.

## Local verification — 2026-11-01

- `pnpm --recursive typecheck`: package/demo and public native-prop/ref fixtures
  passed. Root `pnpm exec tsc --noEmit` still reports only the six existing
  Buffer type incompatibilities in `e2e/local-tours.spec.ts`.
- `pnpm lint`: passed with the existing DataTable React Compiler warning.
- `pnpm exec vitest run packages/design-system/test/breadcrumb.test.tsx`:
  2 passed (native links/current semantics, keyboard/pointer buttons, refs,
  disabled ancestors, non-submitting form behavior).
- `pnpm test --maxWorkers=2`: 237 passed, 6 skipped. The final follow-up changed
  only example copy/path composition, an empty-ancestry guard and disabled-hover
  color; the focused production browser recipe was rerun afterward.
- Production build and Breadcrumb/manual-index Chromium + 320px WebKit recipe:
  15 passed, 1 intentional desktop skip. The final rerun passed the same matrix.
  Covered location header integration, native links, actionable current location,
  ancestor-only navigation/focus, long-word reflow, coarse targets, reduced motion
  and light/dark accessibility. Viewport captures were visually inspected.
- `pnpm test:registry`: passed for independent existing items and complete UI,
  including Breadcrumb source installation/build/rendering. The final disabled
  hover-color utility was verified through the demo production build rather than
  another full registry run. Breadcrumb-only install is outside this matrix.
- `git diff --check`: passed.

The new module is server-compatible native-element composition with no new runtime
state or dependencies. The manual location header is the first real upstream
consumer; Autodidact adoption remains separate. Screenshots live under
`test-results/breadcrumb-*`; the local preview is `http://127.0.0.1:3002/#breadcrumb`.
Full browser-suite regression, Linux baselines, physical touch, dedicated
screen-reader and 200% zoom checks were not run. No hosted CI or PR-ready claim.

## Review refinements — 2026-11-01

Breadcrumb items now align separators with the label's first baseline, including
multiline native links and current text. The research-methodology link and its
code specimen both target a matching local example at
`/#breadcrumb-research-source` rather than the unrelated TagButton section.

The production Breadcrumb/manual-index browser recipe passed with 17 tests and
one intentional desktop skip in Chromium and 320px WebKit. It now asserts
separator/first-line centers remain within 1px and checks the research source's
URL and visible heading after navigation. The browser harness production build
and diff whitespace check passed. Existing unrun coverage and root tour type
errors recorded above remain unchanged.
