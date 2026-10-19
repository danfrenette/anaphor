import { Card, CardContent, CardDescription, CardHeader, CardTitle, Kbd, KbdGroup, Prose, Section, Text } from "@anaphor/system";
import type { ReactNode } from "react";

export function KbdDemo() {
  return (
    <Section id="kbd" className="border-t border-border py-12">
      <header>
        <Text as="p" variant="label" className="text-muted-foreground">02.05 / Control</Text>
        <Text as="h2" variant="title" className="mt-8">Kbd</Text>
        <Text as="p" variant="description" className="mt-3">
          Shows the keys behind an action without owning the shortcut.
        </Text>
      </header>

      <Card variant="default" className="mt-8">
        <CardHeader>
          <CardTitle as="h3" variant="heading">Keyboard notation</CardTitle>
          <CardDescription>Compact keycaps for individual keys, chords, and ordered sequences.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border border-y border-border">
            <Example label="Single key">
              <Kbd>Esc</Kbd>
            </Example>
            <Example label="Platform shortcut">
              <span className="flex flex-wrap items-center justify-end gap-2">
                <KbdGroup aria-label="Command K"><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
                <Text as="span" variant="caption" aria-hidden="true">or</Text>
                <KbdGroup aria-label="Control K"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>
              </span>
            </Example>
            <Example label="Sequence">
              <KbdGroup aria-label="G then A"><Kbd>G</Kbd><Kbd>A</Kbd></KbdGroup>
            </Example>
          </div>
        </CardContent>
      </Card>

      <Prose as="div" className="mt-8">
        <p>Keys grouped without punctuation form one chord when pressed together. Ordered shortcuts use the same compact rhythm and should be described as a sequence in nearby copy or an accessible label.</p>
        <p>Kbd only presents notation. Shortcut registration and platform-aware formatting remain application concerns.</p>
      </Prose>
    </Section>
  );
}

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
      <Text as="span" variant="ui">{label}</Text>
      {children}
    </div>
  );
}
