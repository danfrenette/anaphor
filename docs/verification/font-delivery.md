# Font delivery

**Outcome:** Existing consumers retain embedded fonts. Consumers with their own
font loader can import the base stylesheet without downloading the embedded
copies or editing installed Anaphor files.

**Entry points:** `@anaphor/system/styles.css` and
`@anaphor/system/styles-base.css`; registry-installed `anaphor.css` and
`styles-base.css`. Follow [Application-owned fonts](../../README.md#application-owned-fonts).

**Drive:** Run `pnpm test:registry`. The font-delivery fixture installs Card,
Text, and Button through shadcn, builds with the default import, then switches
only its app stylesheet to the base import with external WOFF2 declarations.
It refreshes the installed components with `--overwrite`, removes any reinserted
default import from the app entry, and builds again.

**Assertions:** Default CSS contains embedded font data. App-owned CSS contains
none and declares exactly four faces. Notices remain unchanged after refresh.
A fresh Chromium context loads each variant: the default makes no external font
requests; the app-owned variant requests each of its four WOFF2 files once.
Inter normal/italic, Bell Gothic, and Magda all load with matching descriptors
and final specimen geometry. Button interaction, responsive layout tokens, and
Light/Carbon theme tokens remain functional in both variants.

**Evidence:** `test-results/registry-fonts/receipt.json` records emitted CSS bytes,
gzip bytes, loaded faces, final geometry, font request paths, and initial-load
layout-shift observations before the interaction checks. Inspect the four
Light/Carbon screenshots beside it. Retain the tested revision, dirty patch if
applicable, and the command log with a per-run receipt. These local observations
are not production latency, cost, or real-device performance measurements.

**Blog adoption:** After this source is available to its registry refresh, the
blog can follow `components/README.md`, retain its app-owned local font faces,
and replace `../components/anaphor.css` with `../components/styles-base.css`
in `app/globals.css`. It must remove a default import reinserted by refresh.
Do not hand-edit installed Anaphor files. This upstream fixture does not certify
the blog: its own fresh build, cold font-request inspection, index/theme/
destination recipes, and screenshots are still required when it adopts the change.

**Cleanup:** The harness closes its browser and server. Successful disposable
consumers are removed; failed consumers remain at the printed temporary path.
