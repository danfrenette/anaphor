import { Text, Badge, Button, ButtonLabel, Card, CardAction, CardCopyButton, CardPreview, CardContent, CardDescription, CardHeader, CardTitle } from "@anaphor/system";
import { CardMediaExamples } from "./card-media-examples";
import { CardPlayground } from "./card-playground";

export function CardDemo() {
  return (
    <section id="card" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>03.01 / Component</p>
          <p>Status / Draft</p>
        </div>
        <Text as="h2" variant="title" className="mt-8">Card</Text>
        <Text className="mt-3 max-w-[65ch] text-pretty">
          Groups related information on a quiet surface. Actions belong to the controls inside it.
        </Text>
      </header>

      <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2">
        <CardPlayground />

        <Card className="flex flex-col" aria-labelledby="card-preview-title">
          <div className="flex min-h-40 flex-1 items-center justify-center rounded-t-card bg-background" role="group" aria-label="Button preview">
            <Button variant="outline"><ButtonLabel>Execute</ButtonLabel></Button>
          </div>
          <CardHeader>
            <CardTitle id="card-preview-title">Room to explore</CardTitle>
            <CardDescription>Previews can extend to the edges, with supporting details below.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-8" role="group" aria-labelledby="spacing-tokens-title">
        <CardHeader>
          <CardTitle id="spacing-tokens-title">Spacing tokens</CardTitle>
          <CardAction><CardCopyButton value={"--space-1: 4px;\n--space-2: 8px;\n--space-3: 12px;"} aria-label="Copy spacing tokens" /></CardAction>
        </CardHeader>
        <CardContent><pre className="overflow-x-auto font-mono text-ui"><code>{"--space-1: 4px;\n--space-2: 8px;\n--space-3: 12px;"}</code></pre></CardContent>
      </Card>

      <div className="mt-12">
        <Text as="h3" variant="heading">Showcase</Text>
        <Text className="mt-3 max-w-[65ch]">A framed stage for the work, with its title and supporting details outside.</Text>
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
            <CardHeader><CardTitle>Form follows feeling</CardTitle><CardDescription>Geometry, surface, and a little warmth.</CardDescription></CardHeader>
          </Card>
          <Card variant="showcase">
            <CardPreview>
              <div className="grid grid-cols-2 grid-rows-2 bg-muted">
                {(["solid", "outline", "ghost", "destructive"] as const).map((variant) => <div key={variant} className="grid place-items-center border-border p-3 odd:border-r [&:nth-child(-n+2)]:border-b"><Button variant={variant} tone="neutral" size="sm"><ButtonLabel>{variant.charAt(0).toUpperCase() + variant.slice(1)}</ButtonLabel></Button></div>)}
              </div>
            </CardPreview>
            <CardHeader><CardTitle>A study in contrast</CardTitle><CardDescription>Four ways to give an action its place.</CardDescription></CardHeader>
          </Card>
        </div>
      </div>

      <CardMediaExamples />

      <Card className="dark mt-8" aria-labelledby="card-dark-title">
        <CardHeader>
          <CardTitle className="text-label text-muted-foreground uppercase font-normal">Theme study / Dark</CardTitle>
        </CardHeader>
        <CardContent>
          <CardTitle id="card-dark-title">A quieter surface</CardTitle>
          <CardDescription className="mt-2">The same shape, using the dark theme’s neutral colors.</CardDescription>
          <p className="mt-4">Content sets the height. Optional sections keep simple cards simple.</p>
        </CardContent>
      </Card>
    </section>
  );
}
