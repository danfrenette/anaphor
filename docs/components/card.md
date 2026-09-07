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

