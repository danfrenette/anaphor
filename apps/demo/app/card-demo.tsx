import { Section, Text, Badge, Button, ButtonLabel, Card, CardAction, CardCopyButton, CardPreview, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@anaphor/system";
import { CardPlayground } from "./card-playground";

export function CardDemo() {
  return (
    <Section id="card" className="border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>03.01 / Component</p>
          <p>Status / Draft</p>
        </div>
        <Text as="h2" variant="title" className="mt-8">Card</Text>
        <Text as="p" variant="description" className="mt-3">
          Groups related information on a quiet surface. Actions belong to the controls inside it.
        </Text>
      </header>

      <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2">
        <CardPlayground />

        <Card variant="default" className="flex flex-col" aria-labelledby="card-preview-title">
          <div className="flex min-h-40 flex-1 items-center justify-center rounded-t-card bg-background" role="group" aria-label="Button preview">
            <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="outline"><ButtonLabel>Execute</ButtonLabel></Button>
          </div>
          <CardHeader>
            <CardTitle as="h3" variant="heading" id="card-preview-title">Room to explore</CardTitle>
            <CardDescription>Previews can extend to the edges, with supporting details below.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 grid items-start gap-6 sm:grid-cols-2">
        <Card variant="default" role="group" aria-labelledby="card-command-title">
          <CardHeader>
            <CardTitle as="h3" variant="heading" id="card-command-title">Local development</CardTitle>
            <CardDescription>Start the Anaphor demo from the repository root after installing dependencies.</CardDescription>
            <CardAction><CardCopyButton value="pnpm dev" aria-label="Copy development command" /></CardAction>
          </CardHeader>
          <CardContent><pre className="overflow-x-auto font-mono text-ui"><code>pnpm dev</code></pre></CardContent>
        </Card>
        <Card variant="default" role="group" aria-labelledby="card-article-title">
          <CardHeader>
            <CardTitle as="h3" variant="heading" id="card-article-title">Not everything needs to move</CardTitle>
            <CardDescription>A note on attention, interfaces, and the value of leaving things alone.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-between">
            <Text as="span" variant="caption">Field Notes · 5 min read</Text>
            <a href="/studies/field-notes" className="inline-flex min-h-11 items-center text-ui underline underline-offset-4">Read the essay</a>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12">
        <Text as="h3" variant="heading">Showcase</Text>
        <Text as="p" variant="body" className="mt-3">A framed stage for the work, with its title and supporting details outside.</Text>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Card variant="showcase">
            <CardPreview>
              <div className="grid place-items-center p-8" aria-hidden="true">
                <svg className="size-48 max-w-full translate-y-0.5 text-primary" viewBox="18 -22.5 1200 1200" fill="currentColor" focusable="false">
                  <path className="fill-muted" d="M549 165 141 862.5 213 990 549 405 742.5 720 879 720Z" />
                  <path className="fill-border" d="M549 165H684L1095 855H417L490.5 720H879Z" />
                  <path className="fill-[var(--anaphor-input-disabled)]" d="M213 990H1030.5L1095 855H417L609 501 549 405Z" />
                  <path d="m1039.5 1005h-835.5l-78-142.5 3-7.5 411-705h153l417 702zm-817.5-30h799.5l57-121.5-402-673.5h-118.5l-399 682.5z" />
                  <path d="m225 1002-25.5-15 349.5-612 205.5 331.5-25.5 15-178.5-288z" />
                  <path d="m904.5 735h-409.5v-30h357l-315-531 25.5-15z" />
                  <path d="m1095 870h-703.5l205.5-379.5 25.5 15-180 334.5h652.5z" />
                </svg>
              </div>
              <Badge variant="outline" shape="round" size="lg" className="absolute top-3 right-3">Study 01</Badge>
            </CardPreview>
            <CardHeader><CardTitle as="h3" variant="heading">Form follows feeling</CardTitle><CardDescription>Geometry, surface, and a little warmth.</CardDescription></CardHeader>
          </Card>
          <Card variant="showcase">
            <CardPreview>
              <div className="grid grid-cols-2 grid-rows-2 bg-muted">
                {(["solid", "outline", "ghost", "destructive"] as const).map((variant) => <div key={variant} className="grid place-items-center border-border p-3 odd:border-r [&:nth-child(-n+2)]:border-b"><Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" {...(variant === "destructive" ? { variant } : { variant, tone: "neutral" })} size="sm"><ButtonLabel>{variant.charAt(0).toUpperCase() + variant.slice(1)}</ButtonLabel></Button></div>)}
              </div>
            </CardPreview>
            <CardHeader><CardTitle as="h3" variant="heading">A study in contrast</CardTitle><CardDescription>Four ways to give an action its place.</CardDescription></CardHeader>
          </Card>
        </div>
      </div>
    </Section>
  );
}
