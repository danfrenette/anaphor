"use client";

import { useState } from "react";
import { Button, ButtonLabel, Card, CardContent, Section, SkeletonBox, SkeletonRegion, SkeletonText, Tabs, TabsList, TabsPanel, TabsTab, Text } from "@anaphor/system";

const variants = ["pulse", "sheen", "static"] as const;

const effects = {
  pulse: { label: "Pulse", description: "A familiar, gentle rhythm across the placeholders." },
  sheen: { label: "Sheen", description: "A soft directional highlight that slowly brightens and settles." },
  static: { label: "Static", description: "The same silhouette, with no movement." },
} as const;

export function SkeletonDemo() {
  const [isLoading, setLoading] = useState(true);
  return <Section id="skeleton" className="border-t border-border py-12">
    <header>
      <Text as="p" variant="label" className="text-muted-foreground">03.04 / Component</Text>
      <Text as="h2" variant="title" className="mt-8">Skeleton</Text>
      <Text as="p" variant="description" className="mt-3">A preview of what’s coming. The same content sets the size in both states, so text wraps and media stays in place.</Text>
    </header>
    <Tabs defaultValue="pulse" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList aria-label="Skeleton effect" className="max-w-full">
          {Object.entries(effects).map(([value, effect]) => <TabsTab key={value} value={value} className="min-h-11">{effect.label}</TabsTab>)}
        </TabsList>
        <Button nativeButton type="button" variant="outline" tone="neutral" size="sm" shape="square" iconOnly={false} loading={false} className="min-h-11 min-w-36" onClick={() => setLoading(!isLoading)}>
          <ButtonLabel>{isLoading ? "Show content" : "Show loading"}</ButtonLabel>
        </Button>
      </div>
      {variants.map(variant => <TabsPanel key={variant} value={variant} className="pt-6">
        <Text as="p" variant="caption" className="mb-4 min-h-12">{effects[variant].description} Reduced motion always shows a still placeholder.</Text>
        <SkeletonRegion isLoading={isLoading} variant={variant} label="Loading field note">
          <Card variant="default">
            <CardContent className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <SkeletonBox className="self-start overflow-hidden rounded-[4px]">
                <div className="flex aspect-[4/3] items-end bg-muted p-4" aria-label="Field note cover">
                  <Text as="span" variant="label">Field notes<br />No. 024</Text>
                </div>
              </SkeletonBox>
              <div className="min-w-0">
                <Text as="p" variant="label"><SkeletonText>Design journal</SkeletonText></Text>
                <Text as="h3" variant="heading" className="mt-3"><SkeletonText>Room for the work</SkeletonText></Text>
                <Text as="p" variant="body" className="mt-3"><SkeletonText>A useful interface leaves room for the task. Clear structure and a steady rhythm let the details take their place.</SkeletonText></Text>
                <Text as="p" variant="caption" className="mt-6"><SkeletonText>October 03 · 6 min read</SkeletonText></Text>
              </div>
            </CardContent>
          </Card>
        </SkeletonRegion>
      </TabsPanel>)}
    </Tabs>
    <div className="mt-6 grid gap-3">
      <Text as="p" variant="caption">Resize the window to see the text placeholders follow the real line breaks. Content appears immediately; loading never adds an artificial delay.</Text>
      <Text as="p" variant="caption">Foundation: <a className="underline underline-offset-4" href="https://ui.shadcn.com/docs/components/base/skeleton">shadcn/ui</a>. Content-shaped loading inspired by <a className="underline underline-offset-4" href="https://x.com/devongovett/status/1838980741197447529">Devon Govett / React Spectrum</a> and <a className="underline underline-offset-4" href="https://x.com/0xGoodfuture/status/2039818750568878245">goodfuture / Boneyard</a>.</Text>
    </div>
  </Section>;
}
