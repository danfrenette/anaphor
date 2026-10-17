import { Section, Text, Button, ButtonLabel, Card, CardAction, CardCopyButton, CardPreview, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@anaphor/system";
import { AnaphorMark } from "../components/anaphor-mark";
import { CatalogExample } from "./catalog-example";
import { CardPlayground } from "./card-playground";

export function CardDemo() {
  return (
    <Section id="card" className="border-t border-border py-12">
      <header>
        <Text as="h2" variant="title">Card</Text>
        <Text as="p" variant="description" className="mt-3">
          Groups related information on a quiet surface. Actions belong to the controls inside it.
        </Text>
      </header>

      <div className="mt-10 space-y-10">
        <CatalogExample title="Anatomy" description="A header introduces the content; a footer holds its next action." code={`<Card variant="default">
  <CardHeader>
    <CardTitle as="h4" variant="heading">Personal workspace</CardTitle>
    <CardDescription>A place for your next idea.</CardDescription>
  </CardHeader>
  <CardContent>Keep your notes and works in progress together.</CardContent>
  <CardFooter>Workspace actions</CardFooter>
</Card>`}>
          <Card variant="default" className="max-w-96">
            <CardHeader><CardTitle as="h4" variant="heading">Personal workspace</CardTitle><CardDescription>A place for your next idea.</CardDescription></CardHeader>
            <CardContent>Keep your notes, experiments, and works in progress together.</CardContent>
            <CardFooter><Button nativeButton type="button" size="md" shape="square" tone="neutral" variant="solid" loading={false} iconOnly={false}><ButtonLabel>Open workspace</ButtonLabel></Button></CardFooter>
          </Card>
        </CatalogExample>
        <CatalogExample title="Actions & footers" code={`<CardHeader>
  <CardTitle as="h4" variant="heading">Local development</CardTitle>
  <CardAction>
    <CardCopyButton value="pnpm dev" aria-label="Copy development command" />
  </CardAction>
</CardHeader>
<CardFooter>
  <a href="/foundations#layout-reference">Read the reference</a>
</CardFooter>`}>
          <div className="grid items-start gap-6 sm:grid-cols-2">
        <Card variant="default" role="group" aria-labelledby="card-command-title">
          <CardHeader>
            <CardTitle as="h4" variant="heading" id="card-command-title">Local development</CardTitle>
            <CardDescription>Start the Anaphor demo from the repository root after installing dependencies.</CardDescription>
            <CardAction><CardCopyButton value="pnpm dev" aria-label="Copy development command" /></CardAction>
          </CardHeader>
          <CardContent><pre className="overflow-x-auto font-mono text-ui"><code>pnpm dev</code></pre></CardContent>
        </Card>
        <Card variant="default" role="group" aria-labelledby="card-article-title">
          <CardHeader>
            <CardTitle as="h4" variant="heading" id="card-article-title">Layout reference</CardTitle>
            <CardDescription>Shared width bounds, reading measures, and responsive page insets.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-between">
            <Text as="span" variant="caption">Foundations · Layout</Text>
            <a href="/foundations#layout-reference" className="inline-flex min-h-11 items-center text-ui underline underline-offset-4">Read the reference</a>
          </CardFooter>
        </Card>
          </div>
        </CatalogExample>
        <CatalogExample title="Edge-to-edge content" description="Place a preview before the padded sections to let it reach the card edges." code={`<Card variant="default">
  <div className="min-h-40 rounded-t-card bg-background">Preview content</div>
  <CardHeader>
    <CardTitle as="h4" variant="heading">Room to explore</CardTitle>
    <CardDescription>Supporting details sit below the preview.</CardDescription>
  </CardHeader>
</Card>`}>
          <div className="max-w-96">
        <Card variant="default" className="flex flex-col" aria-labelledby="card-preview-title">
          <div className="flex min-h-40 flex-1 items-center justify-center rounded-t-card bg-background" role="group" aria-label="Button preview">
            <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="outline"><ButtonLabel>Execute</ButtonLabel></Button>
          </div>
          <CardHeader>
            <CardTitle as="h4" variant="heading" id="card-preview-title">Room to explore</CardTitle>
            <CardDescription>Previews can extend to the edges, with supporting details below.</CardDescription>
          </CardHeader>
        </Card>
          </div>
        </CatalogExample>
        <CatalogExample title="Showcase" description="A framed stage for the work, with its title and supporting details outside." code={`<Card variant="showcase">
  <CardPreview>{artwork}</CardPreview>
  <CardHeader>
    <CardTitle as="h4" variant="heading">Anaphor</CardTitle>
    <CardDescription>The Anaphor mark in a framed preview.</CardDescription>
  </CardHeader>
</Card>`}>
          <div className="grid gap-6 sm:grid-cols-2">
          <Card variant="showcase">
            <CardPreview>
              <div className="grid place-items-center p-8">
                <AnaphorMark className="size-48 max-w-full text-foreground" />
              </div>
            </CardPreview>
            <CardHeader><CardTitle as="h4" variant="heading">Anaphor</CardTitle><CardDescription>The Anaphor mark in a framed preview.</CardDescription></CardHeader>
          </Card>
          <Card variant="showcase">
            <CardPreview>
              <div className="grid grid-cols-2 grid-rows-2 bg-muted">
                {([
                  { label: "Solid", variant: "solid", tone: "neutral" },
                  { label: "Outline", variant: "outline", tone: "neutral" },
                  { label: "Ghost", variant: "ghost", tone: "neutral" },
                  { label: "Destructive", variant: "solid", tone: "danger" },
                ] as const).map(({ label, variant, tone }) => <div key={label} className="grid place-items-center border-border p-3 odd:border-r [&:nth-child(-n+2)]:border-b"><Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" variant={variant} tone={tone} size="sm"><ButtonLabel>{label}</ButtonLabel></Button></div>)}
              </div>
            </CardPreview>
            <CardHeader><CardTitle as="h4" variant="heading">A study in contrast</CardTitle><CardDescription>Four ways to give an action its place.</CardDescription></CardHeader>
          </Card>
          </div>
        </CatalogExample>
        <div>
          <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
          <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore variants, descriptions, header actions, and footers.</p>
          <div className="mt-4 rounded-md border border-border bg-background p-4 sm:p-6">
            <div className="max-w-96"><CardPlayground /></div>
          </div>
        </div>
      </div>
    </Section>
  );
}
