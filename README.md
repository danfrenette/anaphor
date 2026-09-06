# Design Language

An executable reference manual and a source-owned component system.

```text
apps/demo/              Next.js reference manual
packages/design-system/ tokens, styles, and components
```

## Development

```sh
pnpm install
pnpm dev
```

Before merging, run:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm build
```

## Button composition

Group all button text inside `ButtonLabel`, including interpolated or formatted
text. Icons sit alongside it; icon-only buttons use an accessible name.

```tsx
import { Button, ButtonLabel } from "@design-language/system";

<Button>
  <ButtonLabel>Save {count} items</ButtonLabel>
</Button>
```

`ButtonLabel` renders a span and owns the optical text offset. Raw text is not
automatically wrapped or adjusted.

## Working principles

- Consume components only through `@design-language/system`.
- Prefer Server Components. Add `"use client"` only at an interaction boundary.
- Keep code close to the route or component that owns it; extract after reuse appears.
- Model valid states with TypeScript and validate data at runtime boundaries.
- Use semantic HTML and native browser behavior before custom abstractions.
- Start independent async work together and keep client bundles small.
- Treat shadcn components as owned source that may deliberately diverge.
