# A palette, unfolded

An Anaphor demo exploring an interactive essay inspired by https://oklch.fyi/.
The user corrected an accidental evolving-diagram choice and approved an interactive
essay. The SVG and shader are playful header content, with no obligation to teach.

Collection: seven SVG swatches over Rocaille 2 in the existing showcase Card.
Article: the frame disappears; a smaller unframed header keeps the swatches over
a softly masked shader. Three short passages accompany hue circles, shade strips,
and a selectable short/long OKLCH hue gradient. No sticky diagram, scroll locking,
or required sequence. Existing Anaphor typography, surfaces and controls remain.

Both header layers share a native ViewTransition. The SVG unfolds over 520ms;
the shader retains its finite zoom/fold morph. Returning folds into the collection.
Reduced motion resolves immediately; direct entry is settled. The shader is lazily
initialized and pauses offscreen/hidden, capped at400k pixels/30fps target. Existing
static fallback remains. Pause background is available in both views.

Selection and L/C/H persist across routes. The gradient route is local to the
article; reset restores all article controls. The seed is Anaphor brand orange,
oklch(0.6217 0.185 39.44); six derived shades remain experiments, not tokens.
Color values are displayed as CSS OKLCH; the footer notes browser gamut mapping.

Rocaille attribution links to Xor's supplied source. Header SVG is original geometry.
No design-system or PRODUCT/ DESIGN authority change; no blog transfer yet.
Routes: /studies and /studies/palette.
