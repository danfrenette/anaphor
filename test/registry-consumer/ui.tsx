import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "./components/ui/badge";
import { Button, ButtonLabel } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { CardCopyButton } from "./components/ui/card-copy-button";
import { Checkbox } from "./components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "./components/ui/field";
import { FieldFeedback } from "./components/ui/field-feedback";
import { Input } from "./components/ui/input";
import { MorphSurface } from "./components/ui/morph-surface";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "./components/ui/menu";
import { ContentSections, Section } from "./components/ui/sections";
import { Separator } from "./components/ui/separator";
import { Text } from "./components/ui/text";
import { Prose } from "./components/ui/prose";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  return <main className="p-6 font-sans">
    <ContentSections defaultScope>
    <Section id="installed-intro" aria-label="Introduction">
    <Text as="h1" variant="title">Registry consumer</Text>
    <Prose as="div"><p>Installed prose with <strong>emphasis</strong>.</p></Prose>
    </Section>
    <Section id="installed-controls" aria-label="Controls">
    <Card variant="default">
      <CardHeader><CardTitle as="h3" variant="heading">Installed UI</CardTitle></CardHeader>
      <CardContent>
        <Badge size="md" variant="soft" shape="square">Ready</Badge>
        <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid" onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
        <Field orientation="vertical"><FieldLabel>Email</FieldLabel><Input size="md" type="email" /><FieldFeedback hint="Your email address" error="Enter an email" invalid={false} /></Field>
        <FieldGroup><Field orientation="horizontal"><Checkbox /><FieldContent><FieldLabel>Accept updates</FieldLabel><FieldDescription>Occasional product news.</FieldDescription></FieldContent></Field></FieldGroup>
        <Separator orientation="horizontal" />
        <CardCopyButton value="Registry consumer" aria-label="Copy to clipboard" />
        <Menu>
          <MenuTrigger render={<Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="neutral" variant="outline" />}><ButtonLabel>Registry menu</ButtonLabel></MenuTrigger>
          <MenuPopup align="center" side="bottom" sideOffset={6}><MenuItem variant="default">Installed action</MenuItem></MenuPopup>
        </Menu>
        <p className="font-mono">Installed source</p>
      </CardContent>
    </Card>
    </Section>
    </ContentSections>
    <div className="fixed bottom-4 right-4">
      <MorphSurface open={open} onOpenChange={setOpen} title="Registry controls" icon={<span>+</span>}>
        <p>Installed surface</p>
      </MorphSurface>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Consumer />);
