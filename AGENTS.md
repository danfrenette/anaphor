# Agent instructions

## Before editing

Read [CODING_STANDARDS.md](CODING_STANDARDS.md) and the references it identifies
for the affected area. For interface work, also read [PRODUCT.md](PRODUCT.md).
Follow directory-specific instructions, including [apps/demo/AGENTS.md](apps/demo/AGENTS.md).

## Setup

Use [README.md#development](README.md#development) for setup and check commands.
[CI](.github/workflows/ci.yml) owns cloud runtime and browser versions.
[Optional tools](docs/development-tools.md) covers Cursor Cloud and Impeccable.

## Verification

After changing behavior, run the relevant [verification recipes](docs/verification/README.md).
Before reporting a PR ready, follow [the PR review gate](TESTING.md#pull-request-review).
Report executed checks, results, and any blocked or unrun checks.
