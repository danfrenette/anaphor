"use client";

import { useState } from "react";
import { Button, ButtonLabel, Card, CardContent, Section, Skeleton, SkeletonBox, SkeletonRegion, SkeletonText, Tabs, TabsList, TabsPanel, TabsTab, Text } from "@anaphor/system";

import { CatalogExample } from "./catalog-example";

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
      <Text as="h2" variant="title">Skeleton</Text>
      <Text as="p" variant="description" className="mt-3">A preview of what’s coming. The same content sets the size in both states, so text wraps and media stays in place.</Text>
    </header>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Shapes" description="Use explicit shapes when the placeholder dimensions are known." code={`<Skeleton variant="static" className="size-10 rounded-full" />
<Skeleton variant="static" className="h-4 w-40 max-w-full" />
<Skeleton variant="static" className="h-20 w-64 max-w-full" />`}>
        <div className="grid max-w-96 grid-cols-1 gap-4">
          <Skeleton variant="static" className="size-10 rounded-full" />
          <Skeleton variant="static" className="h-4 w-40 max-w-full" />
          <Skeleton variant="static" className="h-20 w-64 max-w-full" />
        </div>
      </CatalogExample>
      <CatalogExample title="Effects" description="Compare the same silhouette. Reduced motion shows a still placeholder for every effect." code={`<Skeleton variant="pulse" className="h-16 w-full" />
<Skeleton variant="sheen" className="h-16 w-full" />
<Skeleton variant="static" className="h-16 w-full" />`}>
        <div className="grid gap-6 sm:grid-cols-3">
          {variants.map(variant => <div key={variant} className="grid min-w-0 gap-3">
            <Skeleton variant={variant} className="h-16 w-full" />
            <span className="text-small text-muted-foreground">{effects[variant].label}</span>
          </div>)}
        </div>
      </CatalogExample>
      <CatalogExample title="Playground" description="Switch effects and reveal the content to compare its layout with the placeholders." code={`<SkeletonRegion isLoading={isLoading} variant="pulse" label="Loading field note">
  <Card variant="default">
    <CardContent>
      <SkeletonBox>{cover}</SkeletonBox>
      <Text as="h4" variant="heading">
        <SkeletonText>Room for the work</SkeletonText>
      </Text>
      <Text as="p" variant="body">
        <SkeletonText>{summary}</SkeletonText>
      </Text>
    </CardContent>
  </Card>
</SkeletonRegion>`}>
    <Tabs defaultValue="pulse">
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
                <Text as="h4" variant="heading" className="mt-3"><SkeletonText>Room for the work</SkeletonText></Text>
                <Text as="p" variant="body" className="mt-3"><SkeletonText>A useful interface leaves room for the task. Clear structure and a steady rhythm let the details take their place.</SkeletonText></Text>
                <Text as="p" variant="caption" className="mt-6"><SkeletonText>October 03 · 6 min read</SkeletonText></Text>
              </div>
            </CardContent>
          </Card>
        </SkeletonRegion>
      </TabsPanel>)}
    </Tabs>
      </CatalogExample>
    </div>
    <div className="mt-6 grid gap-3">
      <Text as="p" variant="caption">Resize the window to see the text placeholders follow the real line breaks. Content appears immediately; loading never adds an artificial delay.</Text>
      <Text as="p" variant="caption">Foundation: <a className="underline underline-offset-4" href="https://ui.shadcn.com/docs/components/base/skeleton">shadcn/ui</a>. Content-shaped loading inspired by <a className="underline underline-offset-4" href="https://x.com/devongovett/status/1838980741197447529">Devon Govett / React Spectrum</a> and <a className="underline underline-offset-4" href="https://x.com/0xGoodfuture/status/2039818750568878245">goodfuture / Boneyard</a>.</Text>
    </div>
  </Section>;
}
