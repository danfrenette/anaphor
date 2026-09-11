# Typography

`Text` chooses typography by purpose. `as` chooses HTML independently:

```tsx
import { Text, Prose } from "@anaphor/system";

<Text variant="display" as="h1">The article title</Text>
<Text variant="heading" as="h2">A section</Text>
<Text>Body copy uses the 90% reading color.</Text>
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
| body | p | Inter | 16px |
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
