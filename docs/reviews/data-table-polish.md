# Data table polish audit

Verdict: **Approve with changes** (2026-10-17).

Scope: the Data Table catalog and playground, reviewed against emil-surfaces,
emil-ui-polish, and emil-ui-review. This is not a whole-catalog accessibility audit.

## Fixed

- `apps/demo/app/data-table-demo.tsx:15` and
  `apps/demo/app/data-table-playground.tsx:141`: a rounded overflow region clipped
  the square collapsed grid border. The rounded region now owns the perimeter;
  zero-spacing separate cells draw only interior rules. Existing small/medium
  radius and semantic color tokens remain the source of truth.
- `apps/demo/app/table-fluid-hover.tsx:16`: the highlight assumed every row began
  at x=0 and was square. Full-grid cards are inset by 12px with an 8px radius.
  The layer now follows the row's horizontal position and computed radius.
  Touch devices retain no hover layer; reduced motion remains immediate.

## Should fix

1. **Reserve the loaded layout across states.**
   `apps/demo/app/data-table-playground.tsx:135`: Records renders selection,
   six rows, and pagination; Loading substitutes four 40px bars, while Empty
   and Error use a 256px minimum height. The selection and footer also disappear.
   These compositions cannot preserve the same footprint, particularly for tall
   narrow cards. Use density/layout-aware placeholders and reserve the footer and
   selection space. This follows emil-ui-polish's layout-stability guidance.
2. **Reserve filter-reset space.**
   `apps/demo/app/data-table-playground.tsx:133`: typing the first character mounts
   Reset filters in the wrapping toolbar, reducing the search width or adding a
   line. Reserve its slot, as Clear selection already does, or put the action in
   a stable filter summary row.
3. **Use the existing hairline token for table separators.**
   `apps/demo/app/data-table-playground.tsx:69` and
   `apps/demo/app/data-table-demo.tsx:8`: border utilities keep gridlines at 1px.
   The existing `--anaphor-border-hairline` becomes 0.5px on high-density displays.
   Adopt it for fine separators without changing form-field boundaries. No new
   color, radius, or thickness token is needed (emil-surfaces).

## Optional / project conventions

- Sort targets use a 32px desktop minimum and 44px on coarse pointers
  (`data-table-playground.tsx:146`). Emil's polish guide prefers 40px on desktop;
  increasing the desktop hit area would improve acquisition, but should be balanced
  with the catalog's compact density convention.
- Keep Anaphor's documented focus color. Emil's neutral-only recommendation conflicts
  with the established focus token; a local table override would fragment the system.
- Keep table borders as separators. Adding raised shadows would misrepresent the
  surface: emil-surfaces explicitly retains borders for table grids.

## Evidence and limits

Visual inspection of the local preview confirmed continuous full-grid corners in
light and dark themes. Browser regressions cover comparisons, code disclosure,
selection, filtering, column controls, row actions, rounded border ownership, and
inset hover geometry/no hover on touch. No new package component or token was added.
This pass does not claim a complete contrast or assistive-technology audit.
