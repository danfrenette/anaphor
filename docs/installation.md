# Installing Anaphor

Start with a Tailwind v4 application initialized for shadcn, using the standard
`@/components` alias. Install one component or the
complete system:

```sh
pnpm dlx shadcn@latest add danfrenette/anaphor/button
pnpm dlx shadcn@latest add danfrenette/anaphor/ui
```

The commands copy source, tokens, and fonts into the consuming project, install
its npm dependencies, and add the Anaphor stylesheet import to the CSS entry
configured in `components.json`. No manual CSS edits are needed. Tailwind's
existing application scanning and the installed stylesheet's component sources
cover utility generation. Reinstalling does not duplicate the import.

### Application-owned fonts

The default `anaphor.css` registry import (or `@anaphor/system/styles.css`
package import) includes the bundled fonts. Keep it for self-contained installs.
Applications that already load their own fonts can instead use the font-free
entry point:

```css
/* Registry consumer: replace the existing anaphor.css import. */
@import "../components/styles-base.css";
```

Workspace package consumers use `@import "@anaphor/system/styles-base.css";`.
Import only one entry point. Both provide the same tokens, themes, Tailwind
configuration, and component styles; `styles-base.css` has no `@font-face`
declarations or embedded font data. Supply font faces in application CSS or
through the application's font loader. Preserve the family names `Inter Variable`
(normal and italic, weights 100–900), `Bell Gothic Black` (900), and
`Magda Clean Mono` (400) to retain Anaphor's typography, or intentionally configure
the font tokens for a different design.

The registry still installs the font stylesheet and license/notices. An unimported
font stylesheet does not enter the emitted application CSS. Do not edit installed
library files. On refresh, shadcn may reinsert the default `anaphor.css` import;
remove it from the **application CSS entry** and keep one `styles-base.css` import
alongside the application's font declarations. Relative paths may be used when
the application's CSS resolver does not support `@/`.

`pnpm test:registry` verifies the default and application-owned paths through real
installation and refresh of Card, Text, and Button. It compares emitted CSS,
cold-browser font requests, loaded typography geometry, and Light/Carbon screenshots.
The receipt and screenshots are saved under `test-results/registry-fonts/`.

The internal `@anaphor/system` workspace package powers the reference manual;
it is private and is not published to npm.

## Verifying registry installs

Run `pnpm test:registry` to verify the current checkout with the pinned shadcn
installer. On a new machine, install the browser first with
`pnpm exec playwright install chromium`.

The check builds temporary registry item files and installs Button, Diff, and Media viewer alone plus the
full UI into four fresh React/Vite consumers outside the workspace. It compiles
all installed source and checks automatic stylesheet setup, preservation of
application CSS, repeat installation, browser interaction, generated styles,
light/dark tokens, and bundled fonts. The consumers have no `@anaphor/system`
dependency, and the check does not add CSS imports or source rules after installing.

Only local registry dependency addresses are redirected to the built temporary
files; source, targets, and npm dependency declarations go through the real
installer unchanged. GitHub authentication and the published branch are not
exercised. No registry server or publishing step is involved.

The check requires package-registry access. Fixture tooling and the installer are
pinned; registry-declared dependencies resolve as they would for a fresh user.
Installer, install, and build output goes to `commands.log` in the temporary
workspace. Successful runs remove their temporary files. Failed runs print the
failing command's last 40 lines, the log path, and the retained consumer
directory for inspection.
