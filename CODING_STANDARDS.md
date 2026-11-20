# Coding standards

Read this before changing or reviewing package components, demo consumers, or
verification code. The linked documents own the detailed rules; this file maps
those rules to review decisions.

For interface changes, read DESIGN.md and follow its affected-area routing table
before editing. Load the matching references, not the entire design directory.

## Sources of truth

| Change | Required reference | Review question |
| --- | --- | --- |
| Package API, dependencies, state ownership, client boundaries | [Architecture](ARCHITECTURE.md) | Does the change preserve the package/consumer boundary and assign behavior to its owner? |
| Tokens, component appearance, motion, interaction states | [Design](DESIGN.md) | Does the consumer use the shared system, including disabled, focus, theme, and motion states? |
| Public component props and composition | [Prop contracts](docs/component-prop-contracts.md) | Can consumers compose and control the component through its documented contract? |
| Tests, browser evidence, delivery | [Testing](TESTING.md) | Do assertions demonstrate observable behavior at the correct boundary and revision? |
| Domain names | [Vocabulary](CONTEXT.md) | Do names retain their established meaning? |

Configuration owns mechanically enforced rules: consult `eslint.config.mjs` and
the relevant TypeScript configuration. Fix violations rather than adding a local
suppression to accommodate new code. A necessary exception should explain the
specific constraint and its scope in the change description.

## Review decisions

Trace a component change through its public consumer, including the package
export and source-registry consumer when distribution changes. A wrapper's
contract includes forwarded props, refs and cleanup, cancellation, and controlled
state; choose regression coverage for the behavior actually at risk.

Keep application state with its application owner. For example, outline selection
belongs above panels that unmount, while each disclosure can own expansion.
Use the architecture's client-boundary guidance when deciding where those owners
live.

When a visual change affects a shared component, inspect the token's scope and
inheritance. A custom property assigned on an application shell can change every
nested specimen; it is not automatically a shell-only presentation change.
Follow the styling-ownership rule in Architecture for the correction.

Reviewers distinguish documented violations from design preferences. Each finding
identifies the changed path, the applicable rule or consumer contract, a reachable
consequence, and a proportionate correction. Tool-enforced issues belong in the
check output; avoid duplicating them as subjective review findings.

## Delivery

Follow [the PR review gate](TESTING.md#pull-request-review) against the actual
target branch. Review all changes the PR presents, including inherited commits.
Feature-specific verification recipes are indexed in
[docs/verification/README.md](docs/verification/README.md).
