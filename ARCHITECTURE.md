# Architecture

## Workspace

Use a pnpm workspace without a task runner:

```text
apps/demo/              Next.js reference manual and package consumer
packages/design-system/ owned tokens, styles, primitives, and public API
```

The demo behaves as an external consumer. It imports design-system code and
styles through package exports, never through relative paths into the package.
Root scripts run package and application checks explicitly; add orchestration
only when parallel task dependencies become costly to maintain.

## Package Boundary

`@design-language/system` is private while its contract develops. Its root
export is the only component API. Styles are exposed separately as
`@design-language/system/styles.css`. Each consumer imports it through its own
stylesheet, loaded once at the application root.

Do not add compatibility layers, generated entry points, or publishing
automation before a real consumer requires them. Reference material under
`examples/` is excluded from packages and builds.

## Styling Ownership

The design-system package owns Tailwind CSS v4, its CSS-first `@theme` block,
semantic custom properties, base element styles, and component classes. Runtime
CSS values are authoritative; `DESIGN.md` records intent and constraints.

The demo may own layout styles specific to documentation composition, but
must consume shared tokens rather than redefine them. Avoid TypeScript token
mirrors until runtime metadata has a demonstrated use.

The package registers only its own source files for Tailwind class discovery.
Each consumer registers its own source paths in its stylesheet. Package source
must not reference the demo or depend on its repository location. The current
source distribution requires React 19.2, TypeScript/TSX transpilation, and a
Tailwind v4 CSS pipeline; it does not require Next.js.

Button text uses the exported `ButtonLabel` module, with icons as siblings.
The label owns text grouping and optical alignment. Button does not infer
content roles by inspecting React children. One local size definition supplies
button dimensions, spacing, and icon dimensions; `iconOnly` changes the target
geometry without introducing a second size scale.

## Component Source

Components follow Base UI-oriented shadcn conventions: accessible primitive
behavior where necessary, Tailwind classes, local utilities, and source owned by
this repository. shadcn is a source generator, not a runtime design-system
dependency. Generated source may diverge deliberately once tests protect its
observable contract.

Use native HTML when it already supplies the required semantics and behavior.
Do not wrap a native element solely to create an abstraction.

## React Boundaries

Components are Server Component-compatible by default. Add `"use client"` only
to the smallest module that needs state, effects, browser APIs, or event
handlers. Keep tokens, metadata, static demos, and package exports free of
client-only code.

The demo controls provider owns shared playground state. Button and Card
playgrounds consume that state in small client components. Static examples
are composed by the reference manual and passed through children slots,
keeping the mobile reading order without moving static examples into client code.

Start independent asynchronous work together and await it near the rendering
boundary. Minimize values serialized from Server Components into client code.

## Exports

The package root explicitly exports supported primitives from a single index.
Internal helpers remain private. The initial smoke primitive exists only to
prove package consumption and is not a promise of a broad component API.

## Change Rule

A design experiment becomes part of the system only through an intentional
token or component change with corresponding documentation and verification.
END-202 owns the first complete Button vertical slice; END-201 does not preempt
that API.

## Contextual demo controls

The package exports a controlled `MorphSurface` for the expanding surface,
reference animation, and focus return. The demo owns viewport section detection,
Button/Card settings, and the controls shown inside it. State lives for the page
session; Reset applies only to the current component. Focus or an active pointer
interaction pins the component until interaction ends. Passive Card remains
independent of the floating surface.
