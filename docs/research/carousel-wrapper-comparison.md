# shadcn Base carousel comparison

Reviewed 2026-10-07. [Official documentation](https://ui.shadcn.com/docs/components/base/carousel) and [current wrapper source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/carousel.tsx) were read. GitHub Contents API confirmed upstream source blob `67bb25fa3ad927545ee1b80189cd7e9c9c3ca96a`; the actual current source was downloaded separately, avoiding reliance on cached documentation alone.

## Verified baseline

[PR29](https://github.com/danfrenette/anaphor/pull/29) is open and draft, head `eeff32e0e67beab978b29aa1aea4c302a02b1a3a`, branch `codex/carousel-browser-coverage`. Its worktree `/private/tmp/anaphor-carousel-browser-coverage` was clean before this change. The six carousel files and `e2e/carousel.spec.ts` in the primary dirty checkout `/Users/danfrenette/code/anaphor` byte-matched that PR head. The primary checkout remains on `main` at checkpoint `eee91fa`; no blanket checkout/reset was performed. Existing sidebar and other changes were preserved.

## Comparison

| Area | Current shadcn wrapper | Anaphor decision |
| --- | --- | --- |
| Composition/API | Compound root/content/item/controls, shared context and API callback | Useful model for later Rail extraction. Current Rail/Deck are demo-local, not exported reusable APIs. Keep different engines/state models separate. |
| Keyboard/focus | Captures Left/Right; calls animated previous/next | Keep bubbling handler, modifier guard, Home/End, instant keyboard movement, explicit focus continuity. Future editable consumers need a child-input policy. |
| ARIA | Carousel region and slide groups; caller supplies labels | Adopt named slide groups using note titles in both styles. Retain named regions, inert preview contents and native selection buttons. No Rail counter. |
| Boundaries | Embla boundary flags disable controls | Equivalent flags already used. Keep Anaphor's explicit focusable-disabled controls and 44px targets; don't copy floating control placement. |
| Events | Registers reInit/select; cleanup removes only select | Keep existing removal of select/reInit/settle. No imported cleanup regression. |
| Options/plugins | Forwards options/plugins; orientation overrides axis | Future adapter can derive Embla types directly. No plugins or extra configuration needed by accepted demo. |
| Orientation | Supports horizontal/vertical layout; keys remain Left/Right | Accepted layouts remain horizontal. A future vertical contract must align key semantics with layout. |
| Reduced motion | No explicit media handling or instant-keyboard flag | Keep Rail jump policy and Deck's selected 220ms/reduced-motion CSS behavior. |

Conclusion: retain Embla and Anaphor materials, motion, focus and lifecycle policies. Use shadcn's composition as a reference for a future narrowly scoped reusable Rail adapter, not as a wholesale replacement or an assumption that Deck should use scrolling. Implemented only the material semantics improvement: each note now has a named slide group.

## Change and verification

Applied the same narrow changes to PR worktree and primary checkout so the existing development preview reflects them:

- `apps/demo/app/(manual)/carousels/rail.tsx`: named slide group on each note wrapper.
- `apps/demo/app/(manual)/carousels/deck.tsx`: named slide group outside inert preview contents.
- `e2e/carousel.spec.ts`: assertion that the first note is a named group with slide roledescription.
- This comparison document.

Executed in the PR worktree: demo `tsc --noEmit --incremental false`, ESLint for carousel sources and carousel tests, and `git diff --check`: pass. `pnpm exec playwright test e2e/carousel.spec.ts --grep 'remains accessible' --workers=2 --reporter=list`: **8 passed**, covering both styles, light/dark themes, desktop Chromium and 320px WebKit. Production build succeeded as part of that harness; axe scans and existing viewport/target checks passed. Existing full interaction receipts remain at `docs/verification/receipts/carousels-2026-10-07.md`; this semantics-only update did not rerun unaffected drag/navigation scenarios. No new physical-device, screen-reader speech, or FPS claim.

Dan subsequently authorized committing and publishing this focused follow-up to existing draft PR29. No dependency, API, motion, counter, or styling changes are included. The verification above applies to the executable changes being published; the original full interaction receipt remains bound to its earlier tested revision.
