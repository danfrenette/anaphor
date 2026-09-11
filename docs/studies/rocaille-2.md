# Rocaille 2

Demo-local adaptation of the shader supplied by the user, by Xor (@XorDev).
Source: https://x.com/XorDev/status/2015813875833225715

Run `pnpm dev`, then open `/studies`; the larger framed view is at
`/studies/rocaille-2`. This replaces the previous Field experiment.

The supplied algorithm retains ten layers, nine sine iterations per layer,
0.3 coordinate divisor at default zoom, and the original cosine color palette.
Loop variables and accumulation are initialized explicitly. Length is clamped at
0.0001 at singularities. The final tanh is evaluated using a negative exponential
to avoid overflow. Output is opaque. Zoom is the added visual parameter.

Animation starts when visible and targets 30 fps, pausing offscreen and in hidden
tabs. Pause stops drawing. Zoom while paused draws once; Reset returns to time zero,
default zoom, and pause. Reduced motion disables playback but retains zoom.
A static rendering of the same algorithm is the poster and WebGL fallback.

Rendering uses one triangle and fragment pass, capped at 400,000 pixels and 1.5x
density. This shader does 90 vector sine iterations per pixel, making it more
expensive than the old field. Browser tests do not establish physical-device
frame-time or power performance.

The layout retains time, zoom, and playback across a 420ms View Transition.
Both views use the existing showcase card. Anaphor owns the surrounding interface;
the artwork retains Xor's palette in either theme. No shared primitive or durable
system rule is added, and this study has not yet been transferred to the blog.

Opening the study animates the composition from zoom multiplier 1 to 1.35 and
fold strength 1 to 0.85 over 560ms with cubic ease-out. Closing reverses those
values from their current position. The user zoom remains independent. The
native transition shows the live destination canvas, with no old-image crossfade.
Its onShare callback synchronizes the morph start; unsupported transitions use
the renderer start. Paused playback still permits this finite navigation motion,
then returns to idle. Reduced motion applies the destination immediately.
Direct entry starts at the destination composition without an entrance morph.
