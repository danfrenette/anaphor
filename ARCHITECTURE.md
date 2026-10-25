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

## Private tours

The same Next.js application hosts the public manual in `(manual)` and private
tour routes under `/tour`. The root layout shares only global styles and theme;
the manual retains its own shell and playground host. Tour modules and their
tests live in `apps/demo/features/tours`. Environment-neutral Zod validation is
shared with the CLI; auth, Postgres and publication modules are server-only.

Better Auth owns provider and device protocols. Every private read/write checks
the current stable provider-ID allowlist, canonical environment origin, and fixed
24-hour session expiry. Browser-issued sessions alone may approve device grants;
device credentials cannot grant themselves a new lifetime. Confirmed revocation
uses the supported revoke-session API and verifies session absence before
reporting success. Provider tokens and refresh-token flows are not retained.

Initial authorized reading uses direct server persistence access. Axios owns
application HTTP transport, with no transport retries. TanStack Query owns private
browser server state and limited transient retries; it does not persist private
data, renew authentication, poll tour revisions, or affect the public manual.
Readers explicitly refresh. Expiry or denied authorization unmounts private
content and clears its query cache. The private-access module owns that terminal
state and cleanup across tour navigation. Its access hook composes a session
query, which opts into TanStack Query visibility revalidation, with a deadline
hook, which owns the timer and foreground expiry check. The deadline
hook captures the clock on mount so already-expired access never mounts private
content. A separate
logout hook owns revocation outcome and recovery. The device-review hook owns
reviewed code and the decision lifecycle. Named views compose these hooks through
direct imports; browser transport retains one Axios instance and retry policy.

Neon Postgres persists complete validated documents and publication keys outside
product source control. Creation is one atomic insert/upsert: identical retries
return their original UUID; a reused key with different content conflicts.

CLI credential storage owns platform selection and protected persistence;
credential validation and server revocation stay in the CLI workflow. An explicit
helper overrides platform defaults. macOS loads the pinned native Keychain adapter
only when selected; Linux retains Secret Service through `secret-tool`.

Version 2 tours add explicit source/spec links, immutable verification records,
logical asset references, and derived evidence applicability. Local imports copy
assets into a persistent workspace outside product repositories. Complete
revision directories and an atomic current pointer keep interrupted updates
from replacing readable content. The unauthenticated local entry point is
explicitly enabled only in a loopback development instance.

The shared reader receives document data and revision-bound asset URLs. Local
loading stays independent of auth and database modules. Runtime workspace
paths carry Turbopack tracing exclusions so user data and CLI ancestry scans
are never copied into a deployment. Hosted publication stages
private Vercel Blob assets, then commits a document revision and retry result
atomically in Postgres. Hosted asset reads authorize the owner and resolve only
assets registered in that tour revision. Tour interpretation, authentication and
persistence never enter the design-system package.

## Package Boundary

`@anaphor/system` is private while its contract develops. Its root
export is the only component API. Styles are exposed separately as
`@anaphor/system/styles.css` (bundled fonts) and
`@anaphor/system/styles-base.css` (application-owned fonts). Each consumer imports
one entry through its own stylesheet, loaded once at the application root.
The base entry owns all shared styling; the default entry adds the embedded font
stylesheet. Registry installs expose the same choice as `anaphor.css` and
`styles-base.css`, retaining existing default imports and font notices.

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

## Review presentation

Optional version 2 section reviews carry captured code, bounded line annotations,
requirements, ordered steps, and hash-bound media annotations. Import validation
checks source ranges and annotation identity before persistence. Existing text-only
version 1 and version 2 documents remain readable.

The design system supplies Diff and MediaViewer. Tour adapters map captured source
and annotations into their public APIs; recordings keep native inline playback.
Applications own source capture, pinned links, asset resolution, and evidence
interpretation. The shared reader receives an asset-check callback: local checks
use Axios directly; hosted checks run through the private query owner so denied
access clears private content. Shared queries own cancellation across reader
refreshes. Captures retain their original bytes; annotations live in the document.
