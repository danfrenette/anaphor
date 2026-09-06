import { Button, ButtonLabel, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@design-language/system";

export function CardDemo() {
  return (
    <section id="card" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>03.01 / Component</p>
          <p>Status / Draft</p>
        </div>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Card</h2>
        <p className="mt-3 max-w-[70ch] text-body text-muted-foreground">
          Groups related information on a quiet surface. Actions belong to the controls inside it.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 sm:grid-cols-2">
        <Card aria-labelledby="card-project-title">
          <CardHeader>
            <CardTitle id="card-project-title">Personal workspace</CardTitle>
            <CardDescription>A place for your next idea.</CardDescription>
            <CardAction>
              <Button size="xs" tone="neutral" variant="ghost"><ButtonLabel>Edit</ButtonLabel></Button>
            </CardAction>
          </CardHeader>
          <CardContent><p>Keep your notes, experiments, and works in progress together.</p></CardContent>
          <CardFooter><Button tone="neutral"><ButtonLabel>Open workspace</ButtonLabel></Button></CardFooter>
        </Card>

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

      <div className="dark mt-8 bg-background p-6 text-foreground">
        <p className="mb-6 font-mono text-label tracking-[0.08em] uppercase">Theme study / Dark</p>
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
