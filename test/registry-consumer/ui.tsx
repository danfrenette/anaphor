import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "./components/ui/badge";
import { Button, ButtonLabel } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { CardCopyButton } from "./components/ui/card-copy-button";
import { Checkbox } from "./components/ui/checkbox";
import { Field, FieldLabel } from "./components/ui/field";
import { FieldFeedback } from "./components/ui/field-feedback";
import { Input } from "./components/ui/input";
import { MorphSurface } from "./components/ui/morph-surface";
import { Separator } from "./components/ui/separator";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  return <main className="p-6 font-sans">
    <h1>Registry consumer</h1>
    <Card>
      <CardHeader><CardTitle>Installed UI</CardTitle></CardHeader>
      <CardContent>
        <Badge>Ready</Badge>
        <Button onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
        <Field><FieldLabel>Email</FieldLabel><Input type="email" /><FieldFeedback hint="Your email address" error="Enter an email" invalid={false} /></Field>
        <Checkbox aria-label="Accept updates" />
        <Separator />
        <CardCopyButton value="Registry consumer" />
        <p className="font-mono">Installed source</p>
      </CardContent>
    </Card>
    <div className="fixed bottom-4 right-4">
      <MorphSurface open={open} onOpenChange={setOpen} title="Registry controls" icon={<span>+</span>}>
        <p>Installed surface</p>
      </MorphSurface>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Consumer />);
