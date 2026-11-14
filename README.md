# Anaphor

A source-owned interface system with an executable reference manual. Built with
React, Base UI, and Tailwind CSS; components install into your project through
shadcn.

**[Explore the live manual](https://anaphor.vercel.app)**

## Install components

Start with a Tailwind v4 application initialized for shadcn and the standard
`@/components` alias. Install one component or the complete system:

```sh
pnpm dlx shadcn@latest add danfrenette/anaphor/button
pnpm dlx shadcn@latest add danfrenette/anaphor/ui
```

Installation copies source, tokens, and fonts into your project, installs npm
dependencies, and adds the stylesheet import. See the [installation guide](docs/installation.md)
for font configuration and registry verification. The internal `@anaphor/system`
workspace package is not published to npm.

### Application-owned fonts

Use the font-free stylesheet when your application supplies its own fonts.
See [Application-owned fonts](docs/installation.md#application-owned-fonts).

## Documentation

- [Component usage](docs/component-usage.md) — composition and integration notes.
- [Component contracts](docs/components/) — detailed APIs and behavior.
- [Foundations](docs/foundations.md) and [layout recipes](docs/layout-recipes.md).
- [Agent setup](docs/using-anaphor-with-agents.md) — use the reusable design-system skill.
- [Product](PRODUCT.md), [design](DESIGN.md), and [architecture](ARCHITECTURE.md) — intent and boundaries.

## Development

```text
apps/demo/              Next.js reference manual
packages/design-system/ tokens, styles, and components
```

Use Node 24 and the pnpm version pinned in `package.json` (10.33.0).
Read [Coding standards](CODING_STANDARDS.md) before changing or reviewing code.

```sh
pnpm install
pnpm dev
```

Install browsers on a new machine:

```sh
pnpm exec playwright install chromium webkit
```

Before merging, run:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm test:registry
pnpm build
```

Browser tests build and serve the demo on port 3105, separate from the dev server.
Linux browser dependencies and runtime versions follow [CI](.github/workflows/ci.yml).
See [Testing](TESTING.md) for the review gate and
[feature verification](docs/verification/README.md) for behavior-specific checks.

[Optional development tools](docs/development-tools.md) covers Impeccable and
Cursor Cloud. Change-tour development has separate guides for
[local tours](docs/verification/local-tours.md) and
[private hosted tours](docs/verification/private-tours.md).
