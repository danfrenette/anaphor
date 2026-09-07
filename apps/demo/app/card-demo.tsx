import { CardPlayground } from "./card-playground";
import { Button, ButtonLabel, Card, CardAction, CardCopyButton, CardContent, CardDescription, CardHeader, CardTitle } from "@design-language/system";

export function CardDemo() {
  return (
    <section id="card" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>03.01 / Component</p>
          <p>Status / Draft</p>
        </div>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Card</h2>
        <p className="mt-3 prose-reading text-pretty">
          Groups related information on a quiet surface. Actions belong to the controls inside it.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 sm:grid-cols-2">
        <CardPlayground />

        <Card aria-labelledby="card-preview-title">
          <div className="flex min-h-40 items-center justify-center rounded-t-card bg-background" role="group" aria-label="Button preview">
            <Button variant="outline"><ButtonLabel>Execute</ButtonLabel></Button>
          </div>
          <CardHeader>
            <CardTitle id="card-preview-title">Room to explore</CardTitle>
            <CardDescription>Previews can extend to the edges, with supporting details below.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Spacing tokens</CardTitle>
          <CardAction><CardCopyButton value={"--space-1: 4px;\n--space-2: 8px;\n--space-3: 12px;"} aria-label="Copy spacing tokens" /></CardAction>
        </CardHeader>
        <CardContent><pre className="overflow-x-auto font-mono text-ui"><code>{"--space-1: 4px;\n--space-2: 8px;\n--space-3: 12px;"}</code></pre></CardContent>
      </Card>

      <div className="dark mt-8 bg-background p-6 text-foreground">
        <p className="mb-6 text-label tracking-[0.08em] uppercase">Theme study / Dark</p>
        <Card aria-labelledby="card-dark-title">
          <CardHeader>
            <CardTitle id="card-dark-title">A quieter surface</CardTitle>
            <CardDescription>The same shape, using the dark theme’s neutral colors.</CardDescription>
          </CardHeader>
          <CardContent><p>Content sets the height. Optional sections keep simple cards simple.</p></CardContent>
        </Card>
      </div>
    </section>
  );
}
