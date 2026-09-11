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
All components and prop types are exported from `@anaphor/system`.

`Card` and `CardPreview` share the same restrained three-layer shadow: a 1px
keyline, a compact near shadow, and a soft 2–4px falloff. Those styles live in
the React components as Tailwind utilities. The package stylesheet only owns
theme tokens, base rules, and utilities that cannot be expressed by composition.

## Artwork as child content

The demo’s `#card-media` section includes a live **Rocaille 2** shader proof of
concept, credited to [Xor / @XorDev](https://x.com/XorDev/status/2015813875833225715),
and an explicitly labeled **SVG placeholder** for a future vector example.

Both use the existing `CardPreview` at 16:9. The Card interface is unchanged.
The shader is demo-local child content, not a renderer exported by the system.
Its own module handles visibility, reduced motion, resolution, GPU cleanup, and
static fallback; the caption provides a separate playback button outside clipping.
The demo reuses the Rocaille study renderer with isolated playback state.

```tsx
<Card variant="showcase" className="[--card-preview-ratio:16/9]">
  <CardPreview>{artwork}</CardPreview>
  <CardHeader>
    <CardTitle>Artwork title</CardTitle>
    <CardDescription>{credit}</CardDescription>
    <CardAction>{playbackControl}</CardAction>
  </CardHeader>
</Card>
```

Keep rendering and page transitions in the child/page composition so the same
artwork can also appear outside a card. Fill the preview’s drawing area, keep
controls outside its clipped surface, and provide appropriate accessible text.
The SVG slot is a placeholder only; it adds no interaction or new module yet.
