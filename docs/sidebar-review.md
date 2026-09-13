# Sidebar review

Reviewed against the animation baseline committed in `0eb7900`.

## Findings addressed

| Finding | Change |
| --- | --- |
| Style casts hid the custom-property typing problem; the scrim duplicated object/function style handling. | Motion state uses Tailwind data variants. Caller styles pass through without merging or assertions. |
| Keyboard motion scheduled two frames to restore state and required a cleanup effect. | Each interaction sets its motion preference directly. The next pointer interaction enables motion again. |
| The rail advertised resizing but the width expression resolved on `:root`, outside the local drag override. | Resolve width on each provider. Resizing requires `resizable` and a composed `SidebarRail`; it defaults to off. |
| The rail had no keyboard resize behavior. | Left/Right resize; Enter/Space collapse. Pointer cancellation does not collapse. |
| Changing the shared hover token also slowed unrelated menus. | Sidebar travel has a dedicated moderate token (160ms); shared menu travel remains fast (80ms). Sidebar fade stays fast. |
| Selection geometry only updated when the menu's children prop changed. | Observe layout and descendant active-state changes, with cleanup. |
| Trigger callbacks ran after the internal toggle. | Consumers can prevent the default toggle. |
| Tests and a demo setting also used type casts. | Use runtime narrowing or checked annotations, with a repo-wide lint ban on type casts. |

## Principles applied

React recommends event handlers for interaction-specific work and Effects for
synchronization with external systems. The remaining sidebar Effects own the
keyboard subscription, DOM geometry observers, and pending hover-frame cleanup.
There is no Effect that copies open state from props. See
[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

Kent C. Dodds recommends deriving values instead of maintaining synchronized
copies. Desktop visibility is derived from the controlled prop or internal
state; motion preference is recorded at the interaction boundary. Geometry is
measured browser state, not something available from React props alone. See
[Don't Sync State. Derive It!](https://kentcdodds.com/blog/dont-sync-state-derive-it).

Matt Pocock distinguishes checked annotations and `satisfies` from assertions
that override what the compiler knows. DOM tests now narrow with `instanceof`,
and settings/mocks use annotations checked against their actual APIs. The
no-cast policy is this project's requirement, not a claim that Pocock bans all
assertions. `as const` remains allowed: it preserves literal/readonly inference.
See [Annotations and Assertions](https://www.totaltypescript.com/books/total-typescript-essentials/annotations-and-assertions).

## Verification

- Type checks for root, design system, and demo passed.
- Repo lint passed with the cast ban.
- Existing unit suite: 64 passed; revised sidebar suite: 7 passed.
- Desktop Chromium and mobile WebKit: 7 passed, 7 breakpoint-specific skips.
- Production webpack build passed. Turbopack verification was blocked by its
  worker port restriction in this environment; the temporary webpack test
  configuration was removed after verification.

The rail's width propagation is browser-tested; its opt-in and keyboard
behavior are unit-tested. A complete pointer-drag accessibility review remains
useful before enabling resizing in an application. These changes remain
uncommitted for review.
