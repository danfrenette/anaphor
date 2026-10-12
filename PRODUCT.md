# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the owner maintaining personal software, technical writing,
and editorial interfaces over time. Collaborators and public readers should be
able to understand the system without private context.

## Product Purpose

Provide a reusable design language primarily for building personal applications
and hobby projects, with a second context for a personal blog.

Provide an executable reference manual for the principles, foundations,
components, and interaction patterns used across personal work. The demo
application proves the package in realistic compositions; it is not a marketing
site or a comprehensive component catalog.

The existing application also provides private PR tours for the owner: a concise
explanation of participating pinned changes, with explicit navigation and refresh.
The reference manual remains public. Tours are application content consumed
through the existing design system, rather than a new component catalogue.

## Positioning

An executable reference manual paired with a source-owned component system.
Design decisions are demonstrated in running software and shared through the
design-system package and source registry.

## Operating Context

The owner maintains the system alongside personal software and technical writing.
The reference manual consumes the shared package; registry consumers install and
own copies of its source. Runtime CSS owns exact values, while DESIGN.md records
design intent and constraints.

The owner's application references are [Vercel](https://vercel.com/geist/introduction)
and [Resend](https://resend.com), including compact density. Editorial references
are [Emil Kowalski](https://emilkowal.ski), [interfaces.dev](https://interfaces.dev),
and [Jakub](https://jakub.kr). These references guide future compositions within
Anaphor's identity.

Paper will receive a new Anaphor file with separate light and dark artboards.
The codebase remains the source of truth for the port.

## Evidence on Hand

- `packages/design-system/src/`: implemented tokens, fonts, and components.
- `apps/demo/`: working reference-manual compositions and bounded experiments.
- `docs/components/`: component contracts and reference rationale.
- `docs/component-prop-contracts.md`: explicit component configuration policy.
- `packages/design-system/test/` and `e2e/`: behavior tests and visual baselines.

## Brand Personality

Calm, technically curious, and direct. The reference manual's voice is terse,
impersonal, and instructional; this does not prescribe the personal blog's
authorial voice. Personality appears through interaction mechanics, diagrams,
geometry, and precise signaling rather than conversational copy.

## Anti-references

- Generic SaaS marketing pages, dashboard-card mosaics, and decorative demos.
- Cinematic spectacle, gratuitous motion, and autobiographical documentation.
- Rounded containers around every section or custom controls without a task.
- Copying the identity, prose, assets, or source code of reference systems.

## Product Principles

1. Prove every rule in running software.
2. Admit components only when a real composition needs them.
3. Expose meaningful design decisions through bounded experiments.
4. Prefer familiar behavior and semantic platform primitives.
5. Borrow principles, not identity.

## Accessibility & Inclusion

Meet WCAG 2.2 AA. Preserve complete keyboard operation, visible focus,
screen-reader semantics, zoom and narrow-viewport reflow, intentional reduced
motion, and touch targets appropriate to their context. Never rely on orange or
any other color as the only signal.
