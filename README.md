# Design Language

A small Next.js foundation for developing a shared design language.

## Development

```sh
pnpm install
pnpm dev
```

Before merging, run:

```sh
pnpm lint
pnpm typecheck
pnpm build
```

## Working principles

- Prefer Server Components. Add `"use client"` only at an interaction boundary.
- Keep code close to the route or component that owns it; extract after reuse appears.
- Model valid states with TypeScript and validate data at runtime boundaries.
- Use semantic HTML and native browser behavior before custom abstractions.
- Start independent async work together and keep client bundles small.
