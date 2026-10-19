"use client";

import { ChartBarIcon, ClockCounterClockwiseIcon, FolderIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Section, Tabs, TabsList, TabsPanel, TabsTab, Text } from "@anaphor/system";

const collections = {
  library: {
    title: "Library",
    description: "Twelve saved references, arranged by the work they support.",
  },
  recents: {
    title: "Recents",
    description: "The four references opened during this session.",
  },
  reports: {
    title: "Reports",
    description: "A compact view of reading activity and saved notes.",
  },
} as const;

export function TabsDemo() {
  return (
    <Section id="tabs" className="border-t border-border py-12">
      <header>
        <Text as="p" variant="label" className="text-muted-foreground">02.06 / Control</Text>
        <Text as="h2" variant="title" className="mt-8">Tabs</Text>
        <Text as="p" variant="description" className="mt-3">
          Switches among related views while keeping their shared context in place.
        </Text>
      </header>

      <Card variant="default" className="mt-8">
        <CardHeader>
          <CardTitle as="h3" variant="heading">Collections</CardTitle>
          <CardDescription>
            Pointer selection carries the active surface across the labels. Keyboard selection stays immediate.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="library">
            <TabsList aria-label="Collections">
              <TabsTab value="library"><FolderIcon aria-hidden="true" />Library</TabsTab>
              <TabsTab value="recents"><ClockCounterClockwiseIcon aria-hidden="true" />Recents</TabsTab>
              <TabsTab value="reports"><ChartBarIcon aria-hidden="true" />Reports</TabsTab>
            </TabsList>
            {Object.entries(collections).map(([value, collection]) => (
              <TabsPanel key={value} value={value} className="pt-6">
                <div className="border-y border-border py-5">
                  <Text as="h4" variant="ui" className="font-medium">{collection.title}</Text>
                  <Text as="p" variant="caption" className="mt-1">{collection.description}</Text>
                </div>
              </TabsPanel>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </Section>
  );
}
