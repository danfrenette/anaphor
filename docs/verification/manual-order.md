# Manual navigation order

Keep Overview first, followed by Foundations, Controls, Content, and Navigation.
Alphabetize labels within each group. In-page sections follow the same sequence;
dedicated reference routes retain their links in the corresponding sorted group.
Manual search consumes the navigation data, so its group order stays aligned.

Run `pnpm exec playwright test e2e/manual-index-review.spec.ts e2e/sections.spec.ts --workers=2`.
Check desktop and mobile index navigation, direct links, breadcrumbs, drawer
dismissal, alphabetized lists, matching document order, and j/k/gg/Shift-G
navigation. Typography's in-page summary remains in the Foundations sequence;
its index destination continues to open the dedicated typography page.
