# Typography

`Text` chooses typography by purpose. `as` chooses HTML independently:

```tsx
import { Text, Prose } from "@anaphor/system";

<Text variant="display" as="h1">The article title</Text>
<Text variant="heading" as="h2">A section</Text>
<Text variant="section" as="h2">A section in uppercase</Text>
<Text as="p" variant="body">Body copy includes its reading width and 90% color.</Text>
<Text as="p" variant="description">Short introductory copy wraps naturally.</Text>
<Text as="span" variant="label">Category</Text>
<Text as="p" variant="caption">Updated yesterday</Text>
<Text as="code" variant="code">account_id</Text>

<Prose as="article">
  <h2>A section</h2>
  <p>Native HTML or rendered Markdown, with <strong>bold</strong> and <em>italic</em>.</p>
  <ul><li>List content</li></ul>
</Prose>
```

| Variant | Suggested HTML | Font | Size |
| --- | --- | --- | --- |
| display | h1 | Bell Gothic Black / 900 | fluid 40–56px |
| title | h2 | Bell Gothic Black / 900 | 36px |
| heading | h3 | Bell Gothic Black / 900 | 24px |
| section | h2 or h3 | Bell Gothic Black / 900, uppercase | 24px |
| subheading | h4 | Bell Gothic Black / 900 | 16px |
| body | p | Inter, normal wrapping, 65ch measure | 16px |
| description | p | Inter, pretty wrapping, 65ch measure | 16px |
| ui | span | Inter | 14px |
| label | span | Inter / medium, uppercase | 12px |
| caption | p | Inter, muted | 12px |
| code | code | Magda Clean Mono / 400 | 14px |

Text forwards native attributes and refs; className overrides remain available.
CardTitle composes Text. Native headings also inherit the heading font through
the base stylesheet. Purpose variants choose presentation, never the document outline.

Prose owns a 65ch reading measure, 1.6 body line height, descending heading sizes,
paragraph rhythm, lists, blockquotes, links, code, captions, and tables. It accepts
native markup or already-rendered Markdown; it does not parse Markdown strings.
The inherited text color uses 90% alpha in both themes, including article headings
and inline emphasis. No container opacity means nested markup does not compound
alpha and images remain opaque. Text variants inside prose retain explicit color
roles (for example caption stays muted). Wrap embedded UI in
`<div data-prose-exclude className="text-foreground">` to opt out of article rules.

Bell Gothic Black is bundled as WOFF2 from the supplied local webfont. Its CSS
uses the same embedded-font distribution as Inter and Magda so registry installs
remain self-contained. The source font is retained under src/fonts.

## Component-owned defaults

Consumers choose a purpose; no `text-pretty`, `text-balance`, `prose-reading`,
or reading-width class is required. Headings balance their lines, descriptions
use pretty wrapping, and body paragraphs and Prose use normal wrapping.
Balance and pretty are alternatives for the same CSS property, not additive effects.

`--container-reading` owns the shared 65ch measure. Body and description variants
use it automatically; UI text stays unconstrained. CardDescription uses the
shared description variant with its compact card sizing and muted color.
FieldDescription and visible field hints own pretty wrapping internally.

Use `className` for placement (such as `mt-3`), with overrides available for
exceptional cases. Import the system stylesheet once; components own the rules.
The old `prose-reading` utility remains only for compatibility with older consumers.

## Semantics and card labels

`Text` requires both `as` and `variant`. `as` selects native HTML, including
its ref and event types. For example, `as="span" variant="ui"` accepts a span
ref; `as="h2" variant="ui"` accepts a heading ref while retaining the UI
variant's regular weight and normal wrapping. `Prose` also requires `as`.

Use `<CardTitle as="h3" variant="label">States</CardTitle>` for categorical card labels.
It owns Inter, medium weight, uppercase presentation, tracking, and muted color.
`variant="heading"` stays Bell Gothic Black. Both preserve heading semantics.

Prose title-sized headings use the shared title line-height. Its embedded-content
opt-out also preserves the first and last child's own margins.

Do not disable synthesis across arbitrary article content without verifying the
required emphasis and fallback faces. Inter supplies real normal and italic
faces at weights 100–900. Mono values and keycaps use the available regular face;
additional mono weights or italics remain deferred until licensed assets exist.

## Section titles, lists, and quotations

`variant="section"` is the opt-in uppercase section title. It retains the 24px
heading step and Bell Gothic Black 900, uses normal tracking rather than the
sentence-case heading's negative tracking, and balances wrapping. Content stays
in natural case; CSS owns capitalization. `as` still chooses the correct heading
level. Existing heading variants keep their original casing. Do not use the
24px section role for a child of a smaller heading.

Prose lists keep native bullets and numbers. Top-level sibling items have 0.75em
separation, nested siblings 0.375em, and nested lists use open-circle bullets and
a 0.5em entry gap. Paragraph margins inside list items do not compound at the
edges. Lists have 1.5em outer spacing.

Blockquotes stay body-sized with inherited reading leading and color, real Inter
italic, a quiet 1px rule, and 1.5em inset. Their 2em outer spacing distinguishes a
quotation from the preceding list. First/last paragraph margins are trimmed so
rendered Markdown and plain text quotes share the same rhythm. No decorative
quotation marks, fills, or extra heading-size type are added.

## Shared token ownership

Text's utilities and Prose's stylesheet consume the package theme. Reading
line-height uses `--leading-reading`; heading and label tracking use
`--tracking-heading` and `--tracking-label`. Prose shares the reading color
utility and uses the standard `--text-xl` size for article h3 headings.
`--spacing-prose` (1em) and `--text-prose-code` (0.875em) retain article-relative
spacing and code sizing. These tokens can be adjusted without editing component
styles. Prose code-block radii continue to use `--radius-sm`.

## END-205: inline content and consumer proof

The typography specimen lives at `/typography`. It uses the page's current theme;
it does not own a theme toggle or depend on MorphSurface. The existing manual
remains unchanged while the theme-display work is in progress.

The ticket's five responsibilities map to the existing kit:

- Text: purpose-based `Text`.
- Heading: `Text as="h1"` through `as="h6"`, not a second heading abstraction.
- Link: native `a` inside `Prose`, retaining href, keyboard activation, and native
  browser behavior. Framework routing remains consumer-owned.
- Code: `Text as="code" variant="code"` for UI values; native `code` and
  `pre > code` in Prose for article content. Long blocks use a labeled, focusable
  scroll region rather than changing source whitespace.
- Keyboard notation: `Kbd` and `KbdGroup`, without shortcut registration.

The sample covers emphasis, nested lists, long tokens, code, links, and an
expandable truncated identifier. Reading experiments vary body size, weight,
measure, leading, tracking, semantic color, and link decoration. They start at
approved defaults, affect only the sample, and reset in one action. They do not
add tokens or change fonts. Color roles retain the existing OKLCH mappings;
the rationale remains in `docs/research/maxime-design-tokens.md`.

This is the typography proof, not the complete article composition in END-206.
Integrate the theme/MorphSurface work first, then verify this specimen under its
theme provider before merging END-205. No registry or package-export additions
are needed because this pass exercises existing primitives.

The document minimum width is capped by the viewport so enlarged root text does
not force a 640px page on a 320px screen. Typography browser checks cover both
themes, 200% root text sizing, keyboard links and disclosure, local experiments,
reset, and accessibility. macOS Chromium/WebKit baselines are included. Linux
baselines must be generated and reviewed in the CI-matching Playwright container
before merge; they are not interchangeable with macOS font rendering.
