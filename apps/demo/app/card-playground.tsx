"use client";

import { Button, ButtonLabel, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@design-language/system";
import { useState } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

const cardDefaults = { mono: false, description: true, action: true, footer: true };

export function CardPlayground() {
  const [card, setCard] = useState(cardDefaults);
  return (
    <>
      <PlaygroundControls sectionId="card" title="Card" onReset={() => setCard(cardDefaults)}>
        <div className="grid gap-3">
          <Select label="Title font" value={card.mono ? "mono" : "sans"} options={["sans", "mono"]} onChange={(value) => setCard((current) => ({ ...current, mono: value === "mono" }))} />
          {(["description", "action", "footer"] as const).map((key) => (
            <Check key={key} label={key === "action" ? "Header action" : key.charAt(0).toUpperCase() + key.slice(1)} checked={card[key]} onChange={(value) => setCard((current) => ({ ...current, [key]: value }))} />
          ))}
        </div>
      </PlaygroundControls>
      <Card aria-labelledby="card-project-title">
        <CardHeader>
          <CardTitle id="card-project-title" className={card.mono ? "font-mono" : undefined}>Personal workspace</CardTitle>
          {card.description && <CardDescription>A place for your next idea.</CardDescription>}
          {card.action && <CardAction><Button size="xs" tone="neutral" variant="ghost"><ButtonLabel>Edit</ButtonLabel></Button></CardAction>}
        </CardHeader>
        <CardContent><p>Keep your notes, experiments, and works in progress together.</p></CardContent>
        {card.footer && <CardFooter><Button tone="neutral"><ButtonLabel>Open workspace</ButtonLabel></Button></CardFooter>}
      </Card>
    </>
  );
}
