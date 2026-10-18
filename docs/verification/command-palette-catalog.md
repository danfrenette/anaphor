# Command palette catalog

Run lint, typecheck, the CommandPalette component tests, and
`pnpm exec playwright test e2e/command-palette.spec.ts --workers=2`.
The browser suite covers manual search, focus return, keyword filtering, empty
results, stable dialog geometry, disabled commands, independent examples, pointer
highlight motion, reduced motion, accessibility, and narrow viewports.

Inspect Commands & groups, Search & empty results, and Playground at
`/#command-palette`. Verify selection feedback and scoped G-R/G-C/G-F shortcuts.
Use Controls to toggle hints and motion, then reset. Open the bottom-bar
manual search to confirm the shared refinements there too. Check dark mode and
short screens: the list scrolls while search and keyboard guidance remain visible.

Registry command-palette now depends on kbd for footer keycaps; run the registry
consumer check when dependencies are available.

Validation for this cleanup: lint, typecheck, four component tests, and eight
browser tests passed (two desktop-only cases skipped on mobile). Production build
passed through the browser suite. Registry verification reached the complete-UI
consumer but failed on the existing hotkey sequence type mismatch in
`src/components/lib/shortcut.ts:99`; the full repository test suite was not run.

The follow-up verifies text-only options, the noninteractive Escape keycap, and
combobox keyboard behavior: arrow keys update aria-activedescendant while focus
stays in search, Tab reaches the close button, and Escape restores trigger focus.
