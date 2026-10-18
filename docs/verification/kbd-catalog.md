# Kbd catalog

Visit `/#kbd`. Keys compares letters, named keys, and modifier symbols.
Combinations explains simultaneous chords and ordered sequences. Playground uses
shared Controls to choose Single key, Chord, or Sequence and Mac/Windows notation.
The platform setting only changes chords. Reset restores the Mac chord.

Run `pnpm exec playwright test e2e/kbd.spec.ts --workers=2` and
`pnpm exec vitest run packages/design-system/test/kbd.test.tsx --maxWorkers=2`.

Check keyboard code disclosure, preset/platform changes, matching inline markup,
reset, stable preview height, and narrow layout in both themes. Keycaps retain
20px height and the existing typography, color, radius, and shadow treatment.
Symbol-only keys and groups have readable labels. No example registers shortcuts.
