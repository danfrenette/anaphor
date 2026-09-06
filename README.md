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

## Card composition

Card is a passive container with a 12px radius and a theme-neutral surface.
Compose optional `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
`CardContent`, and `CardFooter` from `@design-language/system`. They live in
one module and work in Server Components without a client boundary.

Sections own 24px padding, with shared spacing between adjacent sections.
Place edge-to-edge media directly inside Card and use `rounded-t-card` when
it touches the top corners. Card does not clip content or focus rings.
Use `CardTitle as="h2"` (or another heading level) when the default `h3`
does not fit the page hierarchy. Put navigation and actions in controls
inside the card; Card itself has no interactive behavior.
Use `CardTitle className="font-mono"` for monospaced headings; combine it with
`text-label tracking-[0.08em] uppercase` for the manual’s technical labels.

## Button variants

Use `solid`, `outline`, or `ghost` with accent or neutral tone. Use
`variant="destructive"` for destructive actions; its danger colors take
precedence over tone. The former `soft` variant has been removed.

## Button composition

Group all button text inside `ButtonLabel`, including interpolated or formatted
text. Icons sit alongside it; icon-only buttons use an accessible name.

```tsx
import { Button, ButtonLabel } from "@design-language/system";

<Button>
  <ButtonLabel>Save {count} items</ButtonLabel>
</Button>
```

Use `iconOnly` for an icon without text and supply `aria-label`. The same
`size` values apply; `shape="round"` makes the square target circular. While
loading, the spinner crossfades with the icon without changing the dimensions.
Text buttons smoothly make room for the spinner while keeping their label.
`loading` blocks activation and preserves focus and color; `disabled` applies
the gray treatment. Combine both for a gray loading button. Reduced motion
disables the transition and spinner rotation.

`ButtonLabel` renders a span and owns the optical text offset. Raw text is not
automatically wrapped or adjusted.

For a button rendered as an anchor, pass `nativeButton={false}` and
`render={<a href="#card" />}`. Base UI retains button semantics (including
Space activation) and blocks ordinary pointer/keyboard navigation while loading
or disabled. Use a plain anchor for ordinary link semantics.


## Working principles

- Consume components only through `@design-language/system`.
- Prefer Server Components. Add `"use client"` only at an interaction boundary.
- Keep code close to the route or component that owns it; extract after reuse appears.
- Model valid states with TypeScript and validate data at runtime boundaries.
- Use semantic HTML and native browser behavior before custom abstractions.
- Start independent async work together and keep client bundles small.
- Treat shadcn components as owned source that may deliberately diverge.

## Morph Surface

`MorphSurface` accepts `open`, `onOpenChange`, `title`, `icon`, and `children`. Position
its wrapper at the desired bottom-right anchor. It supplies the trigger, close
control, resizing/fade animation, viewport bounds, and keyboard focus return.

Its animation is adapted from the user-supplied **Devouring Details Morph Surface**
prototype ([reference](https://devouringdetails.com/resources/component-library)).
The reference's fonts and global stylesheet are not included; our existing tokens
provide the surface, text, and accent colors.
