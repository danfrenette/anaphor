# Badge

A passive label for categories, counts, or status. Renders a server-compatible
span with native span attributes. It adds no role, tab stop, hover effect, or
press animation. Use a Button or link for actions.

```tsx
<Badge>Draft</Badge>
<Badge variant="outline" shape="round" size="lg">Study 01</Badge>
<Badge variant="solid"><Tag aria-hidden="true" />Published</Badge>
```

Import Badge and BadgeProps from `@design-language/system`. Icons are Phosphor,
composed as children and marked decorative when the text supplies their meaning.

- `variant`: `soft` (default), `solid`, `outline`; all use theme neutrals.
- `size`: `sm`, `md` (default), `lg`; minimum heights 20/24/28px, horizontal
  padding 6/8/10px, text 12/12/14px, icons 12/12/14px.
- `shape`: `square` (default, 8px corners) or `round`.

Long labels can wrap; height is a minimum, not a clipping boundary. Keep badge
copy short. Native span props remain available, but interaction belongs in a
semantic control, not a span with a click handler.

## Reference decisions

[coss Badge](https://coss.com/ui/docs/components/badge) supplies the model:
a small span component with explicit variants, sizes, and composed icons.
We retain the structure without its link-rendering hook or additional color
roles, since the current use is a passive neutral label.

[Devouring Details Button](https://devouringdetails.com/system/button) separates
appearance, size, and shape. Its public Primary examples measured 36px high,
15px type, and 12px horizontal padding when inspected. Our smaller badge scale
adapts that horizontal breathing room to our typography and 4px height rhythm;
these are local badge dimensions, not dimensions claimed by Devouring Details.
Force press, hover, loading, and touch-target expansion belong to controls and
are deliberately absent from this passive component.
