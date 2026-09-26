# Tooltip

Base UI Tooltip with Anaphor's surface tokens, following shadcn and Coss composition.
Exported parts: TooltipProvider, TooltipGroup, Tooltip, TooltipTrigger, TooltipPopup.
TooltipGroup is a deliberately named Base UI provider for a local group of hints.

Wrap nearby tooltips in TooltipGroup. The table and Instant group demo use a 400ms initial hover delay,
80ms close delay, and a 400ms window for immediately opening adjacent hints.
The Single tooltip demo uses its own provider with timeout={0}; delay sharing is
scoped to each group, never applied to the whole manual.
Keyboard focus opens without a hover delay. Escape dismisses without moving focus;
touch does not require hover. Triggers retain accessible names independently of
hints. Use `render` to compose with existing buttons, including popover triggers.

TooltipPopup requires side, align, and sideOffset. It supports portal and positioner
props, collision handling, and controlled state through the upstream root API.
No caret. Opening fades/scales for 150ms; closing takes 100ms. Shared-delay instant
switches and reduced-motion preferences remove transitions.

Use brief, noninteractive content. Full project details remain available by
activating the project name; tooltips are supplementary, never essential content.
Do not add native title attributes alongside tooltips.

References: https://ui.shadcn.com/docs/components/base/tooltip and
https://coss.com/ui/docs/components/tooltip.

The dedicated Components section has Single tooltip and Instant group tabs, with
placement, alignment, offset, initial delay, and instant-window controls. The
formatting example follows Coss's grouped-tooltip composition; subsequent hints
skip animation as described in https://emilkowal.ski/ui/7-practical-animation-tips.
Placement and delay exploration also reference
https://www.fluidfunctionalism.com/docs/tooltip.
