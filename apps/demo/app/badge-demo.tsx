import { Section, Text, Badge, Card, CardHeader, CardTitle, CardContent } from "@anaphor/system";
import { Tag } from "@phosphor-icons/react/dist/ssr";
import { BadgePlayground } from "./badge-playground";

export function BadgeDemo() {
  return <Section id="badge" className="border-t border-border py-12">
    <header>
      <div className="flex justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase"><p>03.02 / Component</p><p>Status / Draft</p></div>
      <Text as="h2" variant="title" className="mt-8">Badge</Text>
      <Text as="p" variant="body" className="mt-3">A small label for a category, count, or status. Badges describe; buttons act.</Text>
    </header>
    <div className="mt-8"><BadgePlayground /></div>
    <div className="mt-6 grid gap-6 md:grid-cols-2">
    {[false, true].map(dark => <Card variant="default" key={String(dark)} className={dark ? "dark" : undefined}>
      <CardHeader><CardTitle as="h3" variant="label">{dark ? "Dark" : "Light"} / Sizes and surfaces</CardTitle></CardHeader>
      <CardContent className="grid gap-5">
        {(["sm", "md", "lg"] as const).map(size => <div key={size} className="flex flex-wrap items-center gap-3 rounded-md bg-background p-3">
          <Badge shape="square" size={size} variant="solid">Published</Badge>
          <Badge variant="soft" shape="square" size={size}>Draft</Badge>
          <Badge size={size} variant="outline" shape="round"><Tag aria-hidden="true" />Study 01</Badge>
        </div>)}
      </CardContent>
    </Card>)}
    </div>
  </Section>;
}
