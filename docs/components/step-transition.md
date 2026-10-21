# Step transition

`StepTransition` animates ordered content without owning navigation, validation,
completion, or tab semantics. A wizard composes it with Back/Continue controls;
a tab interface supplies its own tab list and active panel.

```tsx
<StepTransition dir="ltr" value={stepId} direction="forward" animate>
  {content}
</StepTransition>
```

Required props are `value` (stable string identity), `direction` (`forward` or
`backward`), `animate` (explicit motion choice), `dir` (`ltr` or `rtl`), and `children`.
Optional `className` styles the containing surface. Supply the application’s
writing direction explicitly; the component does not override it by default.
Forward enters from the inline end and exits toward the inline start; backward
reverses both. The consumer supplies direction, including skipped steps and loops.
A changed value replaces content; a resize under the same value changes height
without another horizontal entrance.

Entry and exit travel 110% of the panel width and fade, using a 300ms spring
with no bounce. This bounded height transition is an explicit exception to the
usual transform/opacity rule: the requested behavior moves surrounding content.
ResizeObserver measures only the active panel. The first render does not enter.
Reduced motion or `animate={false}` makes changes immediate. Outgoing content is
inert and hidden from assistive technology. Controls should remain outside the
moving surface; form state that must survive step changes belongs to the consumer.
Content is clipped during travel; give interactive content internal padding so
focus outlines do not sit against the clipping edge.

The manual's Content → Step transition example demonstrates standalone navigation
and same-step expansion. Media viewer demonstrates directional supporting tabs.
The outer dialog and tab list stay stationary.
