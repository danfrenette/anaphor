# Private text tours (ANAPHOR-246)

The application owns authentication, publication and persistence. The design-system
package supplies presentation through its public exports. Later slices extend the
same document contract; this first slice supports text sections and pinned PR
provenance only.

## Environment setup

Inspect the existing Vercel project `danrfrenettes-projects/anaphor`, its Git
connection, `apps/demo` root, and `anaphor.dev` domain assignment before creating
resources. Do not create a second application project. Set up an isolated preview
with a separate Neon database/branch, auth secret and OAuth applications. Register
these exact callback URLs for its selected origin:

- Google: `<origin>/api/auth/callback/google`
- GitHub: `<origin>/api/auth/callback/github`

Configure these server-only environment variables through the provider/environment
secret management UI; never commit their values:

- `DATABASE_URL`: Neon Postgres connection URL, including its required TLS mode.
- `BETTER_AUTH_URL`: the exact origin for this environment.
- `BETTER_AUTH_SECRET`: distinct random secret, at least 32 characters.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- `ANAPHOR_GOOGLE_OWNER_ID`: Google's stable provider subject, not an email.
- `ANAPHOR_GITHUB_OWNER_ID`: GitHub's stable numeric account ID, not a login/email.

Both stable IDs map to the one application owner. Implicit email-based account
linking is disabled. If both identities use the same email, sign in with one and
explicitly link the other with Better Auth's authenticated `/api/auth/link-social`
endpoint; its account-creation hook still requires the allowlisted provider ID.
Never enable implicit linking to resolve an email collision.

Run `pnpm --filter @anaphor/demo tour:migrate` in the configured environment.
This uses the pinned Better Auth 1.7.7 supported migration API and creates the tour
table. The workspace pins a narrow Better Auth 1.7.7 patch in
`patches/better-auth@1.7.7.patch`: device approval and denial use the existing
atomic adapter operation with pending-status and owner predicates. Concurrent
decisions must produce one success and one rejection. Remove the patch only when
an upstream version passes the same public HTTP concurrency regression.
Inspect migration plans and back up an existing database before applying
schema changes there. The first migration is additive; publication does not run
migrations inside requests.

Private Vercel Blob provisioning and protected media are added by the media slice.
Never place captured media in a public store. No public-manual route requires a
tour identity or database connection.

## CLI

From this checkout, run `pnpm --filter @anaphor/demo tour login --origin <origin>`.
The same URL-and-code flow works locally or remotely, without a loopback callback.
Open the displayed URL, sign in, review the code/client/permissions, and explicitly
approve or deny. Device grants expire in ten minutes; polling honors Better Auth's
interval and slow-down responses. Credentials and browser sessions expire after
a fixed maximum of 24 hours, without renewal. Run login again after expiry.

macOS uses its login Keychain through the pinned native `@napi-rs/keyring`
adapter installed with workspace dependencies. No custom helper or local Swift
compiler is required. Keep optional native dependencies enabled during installation.
If macOS requests Keychain access, allow the CLI's Node process after reviewing
the prompt; denied access fails with recovery guidance and no plaintext fallback.
Entries use service `dev.anaphor.private-tours` and the exact selected origin.

Linux continues to use an unlocked OS Secret Service through `secret-tool`.
Other systems and remote environments configure `ANAPHOR_SECURE_STORE` as an
absolute executable path for their OS keyring or secure secret store. An explicit
helper overrides the built-in adapter on every platform. The helper receives arguments
`check|read|write|delete <origin>`; `write` reads JSON from stdin, and `read` emits
the stored JSON only to the CLI. All actions must return zero on success. The
entry contains `origin`, `token`, `issuedAt`, and `expiresAt` (milliseconds).
The helper must implement protected storage and authenticate to it as appropriate;
a file containing plaintext credentials is not an acceptable implementation.
No automatic plaintext fallback exists. Secrets are never passed as process
arguments or printed. A failed write revokes the newly issued credential when
possible and reports a failed revocation separately.

Keep complete prepared documents outside product repositories in owner-only files.
Use `tour validate --file <json>` for diagnostics, then
`tour publish --origin <origin> --file <json> --key <operation-key>`.
Creation requires a complete version 1 document and an 8–200 character operation
key. An unchanged retry with the same key returns the original UUID and result;
reuse with different content returns 409. Preserve content and key after an
uncertain response. `tour logout --origin <origin>` revokes the server session
and deletes the secure-store entry, reporting failures accurately.

## Deterministic acceptance

Use isolated Postgres, never a production database. Configure
`TOUR_TEST_DATABASE_URL` for a disposable database, then migrate it with the
fictional auth environment in `playwright.tours.config.ts`. Run `pnpm test:tours`.
The suite builds the real application and exercises its HTTP API and reader in
desktop Chromium and 320px WebKit. Its fictional identity fixtures replace only
the external identity/session establishment boundary; the server uses real Better
Auth sessions, its supported device protocol, current provider allowlists, and
Postgres persistence. Production has no test-login endpoint.

Check publication → authenticated reading → reload/navigation → sign-out, denied
reads/writes, invalid-document diagnostics, safe creation retries, device approval
and denial, fixed expiry, revocation, environment binding, and both provider IDs.
Inspect light/dark reading, keyboard focus, narrow reflow, and expiry hiding private
content. Return to a hidden tab before expiry to check session revalidation;
return after expiry while offline to check immediate local hiding. A session check
must not refresh the displayed tour revision. Already-expired access must not mount
private content. The section-navigation regression publishes authored IDs that previously
collided with generated headings and the reader shell. The decision-overlap test
holds a disposable database row lock so both real HTTP requests reach their write
boundary; it asserts outcomes through HTTP, not stored implementation details.
Run the public manual browser suite and existing release gates too.

## Real-provider launch acceptance

In the isolated deployed preview, obtain and confirm both stable IDs from the
actual providers and configure the explicit allowlist. Exercise browser sign-in
and local/remote CLI approval with both identities. Check denial for another
account, expiry/re-login, secure-store failure and logout/revocation. Publish a
fictional complete tour through the CLI and read the returned UUID URL after a
reload. Verify that signed-out/unauthorized requests cannot obtain its content or
metadata, that private responses use no-store, and that the reference manual stays
public. Check the existing domain's actual routing and provider callback origins.

Record the preview URL, deployed revision, actual actions, observations and limits
outside product repositories. Deterministic fixture success does not establish
real-provider or production-domain acceptance. The local-development review scope
is separate from the Terraform environment (ANAPHOR-255), remote publication
acceptance (ANAPHOR-256), and explicitly authorized production launch (ANAPHOR-257).
Local success does not certify those later gates.

## Credential storage verification

Run `pnpm exec vitest run apps/demo/features/tours/secure-store.test.ts` for the
storage interface's origin isolation, replacement, missing-entry, helper-override,
and sanitized-denial behavior. Native calls are substituted in that deterministic
check; it does not establish real OS access.

On a Mac with its login Keychain available, explicitly opt in to the real adapter
check:

```sh
ANAPHOR_TEST_KEYCHAIN=1 pnpm exec vitest run apps/demo/features/tours/macos-keychain.native.test.ts
```

This creates only fictional credentials under unique `.keychain-test.invalid`
origins and removes both entries in cleanup. It checks write/read/replacement,
origin isolation and idempotent deletion. It may display an OS access prompt.
The test is skipped by default and on non-macOS systems; a Linux CI pass does not
prove native Keychain behavior. Also exercise actual CLI login → publish → logout
without `ANAPHOR_SECURE_STORE`, using an isolated configured application, and
verify that logout leaves no credential for that origin. Real-provider acceptance
still uses the separate deployed-preview recipe above.

## Version 2 media and updates

Local authoring and the shared document contract are described in
[local tours](local-tours.md). Hosted publication accepts the same prepared
bundle. Configure `BLOB_READ_WRITE_TOKEN` for a **private** Vercel Blob store in
the selected isolated environment. Run the supported migration before using
revision history, publication operations, or asset registration. Existing version
1 text tours remain readable.

`tour publish --file <bundle.json> --key <operation-key> --origin <origin>` stages
private assets and then creates the complete hosted revision. Supply `--id <UUID>`
and `--expected-revision <N>` to update the same hosted tour. Retain the same
content, key, ID, and expected revision after an uncertain response. Hosted
revision numbers are independent of local revision numbers. Files remain
owner-only and outside product repositories under the existing CLI rules.

Assets up to 4 MiB use the server upload path. Larger assets, up to the same
100 MiB local limit, upload directly to private Blob storage using a short-lived
token scoped to that owner, hash, media type, and byte limit. Authenticated
completion verifies the stored content before it can enter a published revision.
The CLI retries completion first after an uncertain upload response. Check
unauthorized document and asset reads, revision-bound media, range/HEAD
requests, conflicting writers, unchanged retries, and failed uploads preserving
the prior readable revision.

The focused hosted HTTP/CLI integration suite uses real disposable Postgres and
Better Auth, substituting the external Blob boundary. Run it with the configured
`TOUR_TEST_DATABASE_URL`:

```sh
pnpm exec vitest run apps/demo/features/tours/hosted-publication.test.ts
```

That test does not establish actual Blob storage, OAuth-provider, or deployed
publication acceptance. Exercise those boundaries separately in the configured
isolated preview before claiming hosted launch readiness.
