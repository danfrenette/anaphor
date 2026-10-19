"use client";
import { Tabs, TabsList, TabsPanel, TabsTab, Text } from "@anaphor/system";
import { Rail } from "./rail";
import { Deck } from "./deck";

export function CarouselTabs({ initialTab }: { initialTab: "rail" | "deck" }) {
  return <main id="content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pt-10 pb-28 sm:px-8">
    <Text as="p" variant="label">Anaphor / Carousels</Text>
    <Text as="h1" variant="heading" className="mt-3">Related reading</Text>
    <Text as="p" variant="body" className="mb-8 mt-3 max-w-xl text-muted-foreground">Two ways to follow a thought. Drag the rail, or bring a note to the front of the deck.</Text>
    <Tabs defaultValue={initialTab} onValueChange={value => {
      if (value !== "rail" && value !== "deck") return;
      const url = new URL(location.href); url.searchParams.set("tab", value); history.replaceState(null, "", url);
    }}>
      <TabsList aria-label="Carousel style"><TabsTab value="rail">Rail</TabsTab><TabsTab value="deck">Deck</TabsTab></TabsList>
      <TabsPanel value="rail" className="pt-8"><Rail /></TabsPanel>
      <TabsPanel value="deck" className="pt-8"><Deck /></TabsPanel>
    </Tabs>
  </main>;
}
