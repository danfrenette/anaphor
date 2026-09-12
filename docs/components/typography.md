# Typography

`Text` chooses typography by purpose. `as` chooses HTML independently:

```tsx
import { Text, Prose } from "@anaphor/system";

<Text variant="display" as="h1">The article title</Text>
<Text variant="heading" as="h2">A section</Text>
<Text>Body copy includes its reading width and 90% color.</Text>
<Text variant="description">Short introductory copy wraps naturally.</Text>
<Text variant="label">Category</Text>
<Text variant="caption">Updated yesterday</Text>
<Text variant="code">account_id</Text>

<Prose as="article">
  <h2>A section</h2>
  <p>Native HTML or rendered Markdown, with <strong>bold</strong> and <em>italic</em>.</p>
  <ul><li>List content</li></ul>
</Prose>
```

| Variant | Default HTML | Font | Size |
| --- | --- | --- | --- |
| display | h1 | Bell Gothic Black / 900 | fluid 40–56px |
| title | h2 | Bell Gothic Black / 900 | 36px |
| heading | h3 | Bell Gothic Black / 900 | 24px |
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

`as` selects native HTML, including its ref and event types. Omitting `as` uses
that variant's documented element. For example, `variant="ui"` defaults to a
span and accepts a span ref; `as="h2"` accepts a heading ref while retaining the
UI variant's regular weight and normal wrapping.

Use `<CardTitle variant="label">States</CardTitle>` for categorical card labels.
It owns Inter, medium weight, uppercase presentation, tracking, and muted color.
The default card heading stays Bell Gothic Black. Both preserve heading semantics.

Prose title-sized headings use the shared title line-height. Its embedded-content
opt-out also preserves the first and last child's own margins.

Deferred: nested bold/italic markup inside mono content can still request
unavailable faces. Leave that behavior unchanged until additional font licenses
and assets are acquired.

## Shared token ownership

Text's utilities and Prose's stylesheet consume the package theme. Reading
line-height uses `--leading-reading`; heading and label tracking use
`--tracking-heading` and `--tracking-label`. Prose shares the reading color
utility and uses the standard `--text-xl` size for article h3 headings.
`--spacing-prose` (1em) and `--text-prose-code` (0.875em) retain article-relative
spacing and code sizing. These tokens can be adjusted without editing component
styles. Prose code-block radii continue to use `--radius-sm`.
