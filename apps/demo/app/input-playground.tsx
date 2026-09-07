"use client";

import { Button, ButtonLabel, Card, CardContent, CardHeader, CardTitle, FieldFeedback, Input } from "@design-language/system";
import { useRef, useState } from "react";
import { useDemoControls } from "./demo-state";

export function InputPlayground() {
  const { input } = useDemoControls();
  return (
    <Card className="mt-10" role="group" aria-label="Primary input example">
      <CardHeader><CardTitle className="font-mono text-label uppercase">Primary demo</CardTitle></CardHeader>
      <CardContent className="grid gap-2">
        <label htmlFor="input-preview" className="text-ui">Try an input</label>
        <Input id="input-preview" size={input.size} type={input.type} disabled={input.disabled} readOnly={input.readOnly} aria-invalid={input.invalid || undefined} aria-describedby="input-preview-feedback" placeholder="Type something…" />
        <FieldFeedback id="input-preview-feedback" hint="Explore sizes and states using the control panel." error="This value needs your attention." invalid={input.invalid} />
      </CardContent>
    </Card>
  );
}

export function InputValidationExample() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return (
    <form className="grid gap-4" noValidate onSubmit={(event) => {
      event.preventDefault();
      const email = emailRef.current;
      if (!email) return;
      const valid = email.validity.valid;
      setInvalid(!valid);
      setSubmitted(valid);
      if (!valid) email.focus();
    }}>
      <div className="grid gap-2">
        <label htmlFor="validation-email" className="text-ui">Email address</label>
        <Input
          ref={emailRef} id="validation-email" name="email" type="email" autoComplete="email" required
          placeholder="you@example.com" aria-invalid={invalid || undefined} aria-describedby="validation-feedback"
          onBlur={(event) => setInvalid(!event.currentTarget.validity.valid)}
          onChange={() => { setInvalid(false); setSubmitted(false); }}
        />
        <FieldFeedback id="validation-feedback" hint="Used only for this example. Nothing is sent." error="Enter a complete email address, such as you@example.com." invalid={invalid} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit"><ButtonLabel>Submit example</ButtonLabel></Button>
        <p role="status" className="text-ui">{submitted ? "Example complete. Nothing was sent." : ""}</p>
      </div>
    </form>
  );
}
