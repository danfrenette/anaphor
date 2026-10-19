import { Prose, Section, Text } from "@anaphor/system";
import { PopoverPlayground } from "./popover-playground";

export function PopoverDemo() {
  return <Section id="popover" className="border-t border-border py-12">
    <header>
      <Text as="p" variant="label" className="text-muted-foreground">02.08 / Control</Text>
      <Text as="h2" variant="title" className="mt-8">Popover</Text>
      <Text as="p" variant="description" className="mt-3">A small workspace for settings, filters, and details, anchored to the control that opens it.</Text>
    </header>
    <div className="mt-8"><PopoverPlayground /></div>
    <Text as="h3" variant="heading" className="mt-8">Keep the task in place</Text>
    <Prose as="div" className="mt-3">
      <p>Use a popover when a task needs a few controls without leaving the page. Changes in this example apply immediately. Tab moves through the controls; Escape or Done closes the panel and returns focus. Pressing elsewhere dismisses it.</p>
      <p>The panel follows its trigger and adjusts when it reaches an edge. Try the side, alignment, and spacing controls. On small screens, content fits the available space and scrolls when needed.</p>
      <p>Opening uses a brief fade and scale from the trigger; closing is faster. Pointer, touch, and keyboard activation share the same motion. Typing and tabbing stay immediate, and reduced-motion preferences remove the animation.</p>
    </Prose>
  </Section>;
}
