"use client";

import { Button, ButtonLabel, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@design-language/system";
import { useDemoControls } from "./demo-state";

export function CardPlayground() {
  const { card } = useDemoControls();
  return (
    <Card aria-labelledby="card-project-title">
      <CardHeader>
        <CardTitle id="card-project-title" className={card.mono ? "font-mono" : undefined}>Personal workspace</CardTitle>
        {card.description && <CardDescription>A place for your next idea.</CardDescription>}
        {card.action && <CardAction><Button size="xs" tone="neutral" variant="ghost"><ButtonLabel>Edit</ButtonLabel></Button></CardAction>}
      </CardHeader>
      <CardContent><p>Keep your notes, experiments, and works in progress together.</p></CardContent>
      {card.footer && <CardFooter><Button tone="neutral"><ButtonLabel>Open workspace</ButtonLabel></Button></CardFooter>}
    </Card>
  );
}
