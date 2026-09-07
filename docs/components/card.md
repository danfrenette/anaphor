# Card

Use the default card for grouped content. Add a copy control through composition:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Spacing tokens</CardTitle>
    <CardAction>
      <CardCopyButton value="--space-1: 4px;" aria-label="Copy spacing tokens" />
    </CardAction>
  </CardHeader>
  <CardContent><code>--space-1: 4px;</code></CardContent>
</Card>
```

The copy button uses the browser clipboard, requires a secure context, and
announces failures so a user can retry or select the text manually. It accepts
native button attributes other than children and onClick; `value` is the exact
text to copy. The component owns its click behavior and never submits forms.

For a page centerpiece, compose a framed preview and an external caption:

```tsx
<Card variant="showcase">
  <CardPreview>{/* artwork, image, code, or an interactive example */}</CardPreview>
  <CardHeader>
    <CardTitle>Introduction</CardTitle>
    <CardDescription>May 2026</CardDescription>
  </CardHeader>
</Card>
```

`CardPreview` defaults to a 4:5 aspect ratio. Override `--card-preview-ratio`
with a CSS class for another ratio. Its inner surface is positioned and clipped;
children can place a badge with absolute positioning. Titles wrap naturally.
Cards remain passive containers; use explicit links or buttons for actions.
All components and prop types are exported from `@design-language/system`.
