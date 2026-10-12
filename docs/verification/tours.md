# Private tours

**Outcome:** An agent publishes a minimal private tour and Dan reads it in the
browser. Signed-out visitors and other signed-in accounts cannot read or
publish tour content. The public reference manual stays available without tour
authentication. Invalid documents are rejected with field diagnostics and do
not become readable tours.

**Entry points:** `POST /api/tours` with `Authorization: Bearer <agent token>`,
`GET /api/tours/<uuid>`, and `/tour/<uuid>`. GitHub sign-in starts at
`GET /api/auth/github`. The reference manual remains `/`.

**Prerequisites:** The Playwright server in `playwright.config.ts` starts an
isolated Postgres database and sets the test identity adapter. Dan's browser
session in that run is the test account named by `TOUR_OWNER_LOGIN`. See
[Development](../../README.md#development). Do not set `TOUR_IDENTITY_ADAPTER=test`
on a Vercel deployment. Production publication needs `DATABASE_URL`,
`TOUR_AGENT_TOKEN`, `TOUR_SESSION_SECRET`, and, for browser sign-in,
`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. Set `TOUR_PUBLIC_ORIGIN` to the
public site origin, such as `https://anaphor.dev`, so published URLs and the
GitHub redirect do not follow a request header. On Vercel, an unset origin
falls back to the platform deployment host.

**Drive:** Run `pnpm exec playwright test e2e/tour.spec.ts`. The suite publishes
through the agent interface, signs in as Dan and as another account, and reads
the result in Chromium and 320px WebKit.

**Assertions:** A valid document returns a stable `/tour/<uuid>` URL. Dan sees
the title, overview, pull-request provenance, and reader section, including
after reload. Signed-out responses are unauthenticated and omit the tour text.
Another account receives a forbidden response and the same omission. Invalid
documents and documents containing server credentials return diagnostics and no
URL. Literal `<script>` text stays text. Section links move keyboard focus.
Light and dark theme both leave the title readable. The manual index remains
on `/` and does not wrap the tour. GitHub sign-in without client credentials
reports that sign-in is unavailable. A callback that does not establish a
session returns to the tour with `sign-in=failed` and does not set a session
cookie. This recipe does not prove a deployed provider accepts real credentials.

**Evidence:** Retain the command, tested revision, and pass/fail counts.
Playwright traces and screenshots stay under `test-results/` until triage.

**Cleanup:** Stop the Playwright server after capturing the result. The test
database is memory-only and disappears with that process.
