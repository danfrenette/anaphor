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

`@anaphor/system` is private while its contract develops. Its root
export is the only component API. Styles are exposed separately as
`@anaphor/system/styles.css`. Each consumer imports it through its own
stylesheet, loaded once at the application root.

Do not add compatibility layers, generated entry points, or publishing
automation before a real consumer requires them. Reference material under
`examples/` is excluded from packages and builds.

## Registry Distribution

The workspace package and source registry share the design-system implementation.
The reference manual remains a workspace package consumer. Registry verification
uses the real shadcn installer against disposable item files built from the
current checkout, followed by an independent consumer build and browser checks.
Only same-registry dependency addresses change to local paths for the check;
installation transforms and dependency installation remain shadcn’s responsibility.
The verification script and consumer fixture stay outside the design system and
are not distributed registry items.

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

Keep short, single-purpose Tailwind class lists inline. For longer lists, use the
shared `cn` helper and split arguments by cohesive concerns such as layout,
orientation or responsive behavior, state, variant, accessibility, motion, and
icon treatment. Label non-obvious groups with short concern comments. Keep
reusable component-local style constants when they improve scanning; extract
shared styling only after another component needs it.

Use native HTML when it already supplies the required semantics and behavior.
Do not wrap a native element solely to create an abstraction.

## React Boundaries

Components are Server Component-compatible by default. Add `"use client"` only
to the smallest module that needs state, effects, browser APIs, or event
handlers. Keep tokens, metadata, static demos, and package exports free of
client-only code.

Each playground owns its typed settings and reset behavior in a small client
component. PlaygroundHost shares only active-section metadata and a portal target. Static examples
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
trigger-anchored reveal, and focus return. The demo owns viewport section detection
and the shared panel. Each playground registers its section ID and title through
PlaygroundControls, which portals locally owned controls and Reset into that panel.
Playgrounds stay mounted, so settings live for the page session; Reset applies
only to the current component. The host has no component-specific types, imports,
or rendering branches. Shared Select, Check, and Range fields live in
`playground-fields.tsx`. Focus or an active pointer interaction pins the component until interaction ends. Passive Card remains
independent of the floating surface.

MorphSurface observes DOM focus, pointer, and Escape events so inline and portaled
content share one interaction contract. Its optional `onInteractionChange` reports
focus within open content or a held pointer on the surface; the host uses that
signal to pin viewport selection without querying the surface's internal markup.
Escape already handled by child content is respected. Focus returns to the trigger
on close, and closed content is inert immediately, including during its fade.
Static examples remain server-composed children.

The reveal preserves the reference's bottom-right origin and shared marker using
Motion. A clip-path transition changes the visible surface while content keeps
its natural dimensions. Reveal and opacity share an ease-out: 250ms opening,
150ms closing, following the longer-entrance/shorter-exit principle in
[4 principles of transition](https://interfaces.dev/magazine/issues/4-principles-of-transition).
Closing reverses the reveal without delayed dismissal. Keyboard activation and Escape settle
instantly; reduced motion keeps only the fade. No width/height animation or
ResizeObserver is needed. Content remains mounted while the surface is closed.

## Keyboard navigation

`useShortcut` shares a single document listener while registrations exist and uses
TanStack Hotkeys' standalone sequence matcher for both chords and sequences.
The design system owns eligibility and focus precedence because those rules must
apply before a partial sequence consumes an event. This also allows per-sequence
reset on focus changes and excludes browser repeat events from double presses.
No application component installs its own shortcut listener. Widget-owned Escape
and arrow behavior remains local to those components.

`ContentSections` owns registered section elements and viewport selection; `Section`
provides stable anchors and a programmatic focus destination. The manual's sidebar
reads the same active state through `useContentSections`, while PlaygroundHost retains
its independent interaction pinning. Static manual examples remain server-composed
children. Keyboard scrolling uses the existing ease-in-out token and a 100 ms
section duration, an intentional exception to the general instant-shortcut rule.

`useAnimatedScroll` encapsulates Motion animation controls, scroll observation,
input interruption, and live reduced-motion changes. Each request owns its
callbacks so interrupted work cannot overwrite a later destination. `ContentSections`
keeps focus and ordering policy and observes the actual section elements for
layout changes. The hook ships with the sections registry item.
