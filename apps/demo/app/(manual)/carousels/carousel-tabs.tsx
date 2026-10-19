"use client";

import { useState } from "react";
import { Button, ButtonLabel, Kbd, Tabs, TabsList, TabsPanel, TabsTab, Text } from "@anaphor/system";
import { CatalogExample } from "../../catalog-example";
import { Rail } from "./rail";
import { Deck } from "./deck";

const examples = {
  rail: {
    title: "Rail",
    description: "Browse adjacent cards by dragging, scrolling horizontally, or using the pager.",
    code: `// Demo-owned composition: rail.tsx uses Embla with the shared Card and Button.
import { Rail } from "./rail";

<Rail />`,
  },
  deck: {
    title: "Deck",
    description: "Focus on one note. Select an exposed card, swipe, or use the pager to bring it forward.",
    code: `// Demo-owned composition: deck.tsx uses the shared Card and Button.
import { Deck } from "./deck";

<Deck />`,
  },
};

export function CarouselTabs({ initialTab }: { initialTab: "rail" | "deck" }) {
  const [revisions, setRevisions] = useState({ rail: 0, deck: 0 });
  return <main id="content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pt-10 pb-28 sm:px-8">
    <Text as="h1" variant="title">Carousels</Text>
    <Text as="p" variant="description" className="mt-3">Browse neighboring cards in a rail, or bring one card forward in a deck.</Text>
    <h2 className="mt-10 mb-4 font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h2>
    <Tabs defaultValue={initialTab} onValueChange={value => {
      if (value !== "rail" && value !== "deck") return;
      const url = new URL(location.href); url.searchParams.set("tab", value); history.replaceState(null, "", url);
    }}>
      <TabsList aria-label="Carousel style"><TabsTab value="rail">Rail</TabsTab><TabsTab value="deck">Deck</TabsTab></TabsList>
      {(["rail", "deck"] as const).map(style => <TabsPanel key={style} value={style} className="pt-6">
        <CatalogExample title={examples[style].title} description={examples[style].description} code={examples[style].code} framed={false}>
          {style === "rail" ? <Rail key={revisions.rail} /> : <Deck key={revisions.deck} />}
          <div className="mt-4">
            <Button nativeButton type="button" variant="ghost" tone="neutral" size="sm" shape="square" iconOnly={false} loading={false} onClick={() => setRevisions(current => ({ ...current, [style]: current[style] + 1 }))}><ButtonLabel>Reset example</ButtonLabel></Button>
          </div>
        </CatalogExample>
      </TabsPanel>)}
    </Tabs>
    <p className="mt-6 flex flex-wrap items-center gap-1.5 text-small text-muted-foreground">Focus the carousel, then use <Kbd>←</Kbd><Kbd>→</Kbd> to browse, or <Kbd>Home</Kbd><Kbd>End</Kbd> to reach either end. Keyboard and reduced-motion navigation settle immediately.</p>
    <p className="mt-3 text-small text-muted-foreground">These are demo-owned compositions using shared cards and controls. Both stop at the ends of the collection.</p>
  </main>;
}
