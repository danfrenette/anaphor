import { Prose, Section, Text } from "@anaphor/system";

export function BottomBarDemo() {
  return (
    <Section id="bottom-bar" className="border-t border-border py-12">
      <header>
        <Text as="p" variant="label" className="text-muted-foreground">02.08 / Shell</Text>
        <Text as="h2" variant="title" className="mt-8">Bottom bar</Text>
        <Text as="p" variant="description" className="mt-3">
          A quiet place for persistent utilities and short status messages.
        </Text>
      </header>
      <Prose as="div" className="mt-8">
        <p>The bar at the bottom of this manual is the live example. Help and source context sit at the start; search and theme controls sit at the end. The article and sidebar stop above it, so neither loses content behind the fixed surface.</p>
        <p>Keep navigation in the sidebar and task actions near their content. Use the bottom bar for tools that stay useful across pages, with a visible label when space allows and an accessible name at every width.</p>
      </Prose>
    </Section>
  );
}
