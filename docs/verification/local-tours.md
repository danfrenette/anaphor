# Local PR change tours

## Outcome and entry points

An author imports or updates a tour outside the product repository, opens it in
Anaphor without hosted authentication, and reviews each slice with its evidence.
The reader retains its selected revision until explicit refresh. Old results
keep their tested source revisions and show stale or unknown applicability.

The CLI entry is `pnpm --filter @anaphor/demo tour local help`. The local reader
is `/local-tour/<UUID>`. Hosted authentication and media remain separate under
[the private-tour recipe](private-tours.md).

## Launch and doctor

Use the supported Node and pinned pnpm from the root development guide. Configure
`ANAPHOR_TOUR_WORKSPACE` to a persistent application-data directory outside Git
repositories, or use the CLI's documented platform default. Use the same directory
for CLI commands and the reader process.

Run `pnpm --filter @anaphor/demo tour:dev`. This explicitly enables local access
and binds the app to `127.0.0.1:3017`. Check that `/` responds before opening a
tour. Local routes are disabled without `ANAPHOR_LOCAL_PREVIEW=1`, in production,
and in Vercel deployments. No database, OAuth, Keychain, or Blob credential is
needed. Leave any unrelated running app process untouched.

Before a run, record the source state, workspace, target URL, and process owner.
Inspect the selected tour's PR heads and evidence revisions. Confirm media URLs
name the displayed tour revision rather than whichever revision happens to be
latest. Browser success establishes local behavior, not hosted deployment.

## Prepare and update

Prepare a JSON bundle with `document` and `files`. The shared schema in
`apps/demo/features/tours/document.ts` owns exact fields. `files` maps logical
asset IDs to relative paths within the bundle directory. The app supports PNG,
JPEG, WebP, WebM, MP4, and UTF-8 plain text, checking declared media type, SHA-256,
and byte length. Local assets are limited to 100 MiB each and 500 MiB per bundle;
keep JSON below 1 MiB. Give each capture a caption, description, and provenance.

Run these from the checkout, with the prepared bundle outside product source:

```sh
pnpm --filter @anaphor/demo tour local validate --file /path/to/bundle.json
pnpm --filter @anaphor/demo tour local import --file /path/to/bundle.json
pnpm --filter @anaphor/demo tour local preview --id <UUID>
pnpm --filter @anaphor/demo tour local update --id <UUID> --expected-revision <N> --file /path/to/bundle.json
```

The import result returns a stable ID, revision, and local URL. A participating
PR already associated with a tour requires its current expected revision. Keep
prior evidence and assets unchanged in updates; add a new record for a rerun,
using `supersedes` where appropriate. Append applicability assessments only after
inspecting the source delta. Required unrun checks need explicit records. A
record's result and applicability are different facts.

The workspace retains revisions and imports asset bytes. After a successful
import, remove only the owned scratch bundle and confirm that the reader can
still reopen the managed assets. Interrupted writes retain the last readable
revision. If a writer lock survives a terminated process, inspect its ownership
before removing that workspace's `.write-lock` directory and retrying.

## Drive and assertions

Run `pnpm test:local-tours` for the real CLI, reader, media playback, range
requests, explicit refresh, stale checks, scratch cleanup, theme, and narrow
Chromium/WebKit behavior. Run the CLI integration tests with:

```sh
pnpm exec vitest run apps/demo/features/tours/local-cli.test.ts
```

For a general UI inspection use the project's agent-browser 0.39.0 in an isolated
session. Open the returned URL, snapshot, navigate by a section link, inspect the
source/spec links and verification record, play a recording, switch theme, and
check keyboard focus and narrow reflow. Capture screenshots for useful states
and record interactions where temporal behavior matters.

Update a PR head in the prepared document, preserving the old evidence, then
update the tour. The open page must retain its revision. Activate **Refresh
tour** and confirm the incremented revision and stale check appear together.
An invalid/conflicting update must leave the previous revision readable. A
missing asset must show an unavailable-evidence message, and missing or stale
required checks must remain merge concerns. Check that a foreign Origin cannot
read local APIs and that deployed-mode local routes return 404.

## Evidence and cleanup

Retain actions, results, tested source/build, context, captures, and limitations
in the delivery tour and linked receipts. Copy required artifacts into the
persistent workspace before cleanup. Inspect the actual final preview and
return its URL, identifying it as local to the current machine.

Stop only owned browser sessions and test servers. Keep the review server
running when handing the owner a local preview, and report its port and worktree.
The automated local suite creates temporary managed workspaces; remove only the
one belonging to the completed run after retaining needed evidence.
