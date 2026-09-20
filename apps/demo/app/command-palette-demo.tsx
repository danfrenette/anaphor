import { Section, Text, Prose } from "@anaphor/system";
import { CommandPalettePlayground } from "./command-palette-playground";

export function CommandPaletteDemo() {
  return (
    <Section id="command-palette" className="border-t border-border py-12">
      <header>
        <Text as="p" variant="label" className="text-muted-foreground">02.07 / Control</Text>
        <Text as="h2" variant="title" className="mt-8">Command palette</Text>
        <Text as="p" variant="description" className="mt-3">Find an action, run it, and get back to work.</Text>
      </header>
      <div className="mt-8"><CommandPalettePlayground /></div>
      <Text as="h3" variant="heading" className="mt-8">Speed is the default</Text>
      <Prose as="div" className="mt-3">
        <p>A command palette is a frequent shortcut. Its highlight should keep up with your intent, so selection changes immediately by default. Search stays in place as results change, and the keyboard never waits for motion.</p>
        <p>Fluid highlights are an optional pointer cue. Enable them when movement between nearby commands helps explain where the next action will land. Group headings interrupt the travel; keyboard navigation and reduced-motion preferences always keep it instant.</p>
        <p>Trailing hints teach shortcuts without registering them. This example separately wires each sequence through the application shortcut system, so G then R, C, or F runs its matching command while the palette is closed.</p>
        <p>Use the controls to compare highlight motion, icons, and shortcut hints. Arrow keys move through results, Enter runs a command, and Escape returns focus to the trigger.</p>
      </Prose>
    </Section>
  );
}
