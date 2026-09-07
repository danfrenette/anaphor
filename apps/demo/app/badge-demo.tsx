import { Badge, Card, CardHeader, CardTitle, CardContent } from "@anaphor/system";
import { Tag } from "@phosphor-icons/react/dist/ssr";
import { BadgePlayground } from "./badge-playground";

export function BadgeDemo() {
  return <section id="badge" className="scroll-mt-8 border-t border-border py-12">
    <header>
      <div className="flex justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase"><p>03.02 / Component</p><p>Status / Draft</p></div>
      <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Badge</h2>
      <p className="mt-3 prose-reading">A small label for a category, count, or status. Badges describe; buttons act.</p>
    </header>
    <div className="mt-8"><BadgePlayground /></div>
    <div className="mt-6 grid gap-6 md:grid-cols-2">
    {[false, true].map(dark => <Card key={String(dark)} className={dark ? "dark" : undefined}>
      <CardHeader><CardTitle className="text-label text-muted-foreground uppercase font-normal">{dark ? "Dark" : "Light"} / Sizes and surfaces</CardTitle></CardHeader>
      <CardContent className="grid gap-5">
        {(["sm", "md", "lg"] as const).map(size => <div key={size} className="flex flex-wrap items-center gap-3 rounded-md bg-background p-3">
          <Badge size={size} variant="solid">Published</Badge>
          <Badge size={size}>Draft</Badge>
          <Badge size={size} variant="outline" shape="round"><Tag aria-hidden="true" />Study 01</Badge>
        </div>)}
      </CardContent>
    </Card>)}
    </div>
  </section>;
}
