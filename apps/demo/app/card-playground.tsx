"use client";

import { FieldGroup, Button, ButtonLabel, Card, CardPreview, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@anaphor/system";
import { useState, type ComponentProps } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

type CardSettings = {
  description: boolean;
  action: boolean;
  footer: boolean;
  variant: NonNullable<ComponentProps<typeof Card>["variant"]>;
};
const cardDefaults: CardSettings = { description: true, action: true, footer: true, variant: "default" };

export function CardPlayground() {
  const [card, setCard] = useState(cardDefaults);
  return (
    <>
      <PlaygroundControls sectionId="card" title="Card" onReset={() => setCard(cardDefaults)}>
        <FieldGroup>
          <Select label="Variant" value={card.variant} options={["default", "showcase"] as const} onChange={(variant) => setCard((current) => ({ ...current, variant }))} />
          {(["description", "action", "footer"] as const).map((key) => (
            <Check key={key} label={key === "action" ? "Header action" : key.charAt(0).toUpperCase() + key.slice(1)} checked={card[key]} onChange={(value) => setCard((current) => ({ ...current, [key]: value }))} />
          ))}
        </FieldGroup>
      </PlaygroundControls>
      <Card className="flex flex-col" variant={card.variant} aria-labelledby="card-project-title">
        {card.variant === "showcase" && <CardPreview><div className="grid place-items-center p-6 text-heading font-medium">Space for your next idea.</div></CardPreview>}
        <CardHeader>
          <CardTitle id="card-project-title">Personal workspace</CardTitle>
          {card.description && <CardDescription>A place for your next idea.</CardDescription>}
          {card.action && <CardAction><Button size="xs" tone="neutral" variant="ghost"><ButtonLabel>Edit</ButtonLabel></Button></CardAction>}
        </CardHeader>
        <CardContent className="flex-1"><p>Keep your notes, experiments, and works in progress together.</p></CardContent>
        {card.footer && <CardFooter><Button tone="neutral"><ButtonLabel>Open workspace</ButtonLabel></Button></CardFooter>}
      </Card>
    </>
  );
}
