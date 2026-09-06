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

## Consuming the package

`@design-language/system` exports source for React 19.2 projects. Consumers need
TypeScript/TSX transpilation and Tailwind CSS v4 processing. Next.js consumers
add the package to `transpilePackages`; other bundlers must also process the
exported TSX. The package remains private and is not published to a registry.

Import the package stylesheet from your application's CSS entry, then register
your own source paths relative to that file:

```css
@import "@design-language/system/styles.css";

@source "./**/*.{ts,tsx}";
```

The package registers its own sources and includes Tailwind; no demo paths or
second Tailwind import are needed. Install `react`, `react-dom`, `tailwindcss`,
and the Tailwind integration for your bundler (the demo uses
`@tailwindcss/postcss`). Load this application stylesheet once at the root.

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
