import { Section, Text, Badge } from "@anaphor/system";
import { Tag } from "@phosphor-icons/react/dist/ssr";
import { CatalogExample } from "./catalog-example";
import { BadgePlayground } from "./badge-playground";

export function BadgeDemo() {
  return <Section id="badge" className="border-t border-border py-12">
    <Text as="h2" variant="title">Badge</Text>
    <Text as="p" variant="description" className="mt-3">A small label for a category, count, or status. Badges describe; buttons act.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Variants" code={`<Badge variant="soft" size="md" shape="square">Published</Badge>
<Badge variant="solid" size="md" shape="square">Published</Badge>
<Badge variant="outline" size="md" shape="square">Published</Badge>`}>
        <div className="flex flex-wrap items-start gap-6">
          {(["soft", "solid", "outline"] as const).map(variant => <div key={variant} className="grid justify-items-start gap-3">
            <Badge variant={variant} size="md" shape="square">Published</Badge>
            <span className="text-small text-muted-foreground">{variant === "soft" ? "Soft" : variant === "solid" ? "Solid" : "Outline"}</span>
          </div>)}
        </div>
      </CatalogExample>
      <CatalogExample title="Sizes" code={`<Badge variant="soft" size="sm" shape="square">Published</Badge>
<Badge variant="soft" size="md" shape="square">Published</Badge>
<Badge variant="soft" size="lg" shape="square">Published</Badge>`}>
        <div className="flex flex-wrap items-end gap-6">
          {(["sm", "md", "lg"] as const).map(size => <div key={size} className="grid justify-items-start gap-3">
            <Badge variant="soft" size={size} shape="square">Published</Badge>
            <span className="text-small text-muted-foreground">{size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}</span>
          </div>)}
        </div>
      </CatalogExample>
      <CatalogExample title="Icons & Shapes" code={`<Badge variant="outline" size="md" shape="square">Reference</Badge>
<Badge variant="outline" size="md" shape="round">Reference</Badge>
<Badge variant="outline" size="md" shape="round">
  <Tag aria-hidden="true" />Reference
</Badge>`}>
        <div className="flex flex-wrap items-start gap-6">
          <div className="grid justify-items-start gap-3"><Badge variant="outline" size="md" shape="square">Reference</Badge><span className="text-small text-muted-foreground">Square</span></div>
          <div className="grid justify-items-start gap-3"><Badge variant="outline" size="md" shape="round">Reference</Badge><span className="text-small text-muted-foreground">Round</span></div>
          <div className="grid justify-items-start gap-3"><Badge variant="outline" size="md" shape="round"><Tag aria-hidden="true" />Reference</Badge><span className="text-small text-muted-foreground">With an icon</span></div>
        </div>
      </CatalogExample>
      <div>
        <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
        <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore variants, sizes, shapes, and icons.</p>
        <BadgePlayground />
      </div>
    </div>
  </Section>;
}
