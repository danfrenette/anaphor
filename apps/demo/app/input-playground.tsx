"use client";

import { FieldGroup, Button, ButtonLabel, Card, CardContent, CardHeader, CardTitle, Field, FieldLabel, FieldFeedback, Input } from "@anaphor/system";
import { useRef, useState } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

type InputControls = { size: "sm" | "md" | "lg"; type: "text" | "email" | "password" | "search"; disabled: boolean; readOnly: boolean; invalid: boolean };
const inputDefaults: InputControls = { size: "md", type: "text", disabled: false, readOnly: false, invalid: false };

export function InputPlayground() {
  const [input, setInput] = useState(inputDefaults);
  return (
    <>
      <PlaygroundControls sectionId="input" title="Input" onReset={() => setInput(inputDefaults)}>
        <FieldGroup>
          <Select label="Size" value={input.size} options={["sm", "md", "lg"]} onChange={(size) => setInput((current) => ({ ...current, size }))} />
          <Select label="Type" value={input.type} options={["text", "email", "password", "search"]} onChange={(type) => setInput((current) => ({ ...current, type }))} />
          {(["disabled", "readOnly", "invalid"] as const).map((key) => (
            <Check key={key} label={key === "readOnly" ? "Read only" : key.charAt(0).toUpperCase() + key.slice(1)} checked={input[key]} onChange={(value) => setInput((current) => ({ ...current, [key]: value }))} />
          ))}
        </FieldGroup>
      </PlaygroundControls>
      <Card variant="default" className="mt-10" role="group" aria-label="Primary input example">
        <CardHeader><CardTitle as="h3" variant="label">Primary demo</CardTitle></CardHeader>
        <CardContent>
          <Field orientation="vertical" invalid={input.invalid} disabled={input.disabled}>
            <FieldLabel>Try an input</FieldLabel>
            <Input size={input.size} type={input.type} readOnly={input.readOnly} aria-invalid={input.invalid || undefined} placeholder="Type something…" />
            <FieldFeedback hint="Explore sizes and states using the control panel." error="This value needs your attention." invalid={input.invalid} />
          </Field>
        </CardContent>
      </Card>
    </>
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
      <Field orientation="vertical" invalid={invalid}>
        <FieldLabel>Email address</FieldLabel>
        <Input size="md"
          ref={emailRef} name="email" type="email" autoComplete="email" required
          placeholder="you@example.com"
          onBlur={(event) => setInvalid(!event.currentTarget.validity.valid)}
          onChange={() => { setInvalid(false); setSubmitted(false); }}
        />
        <FieldFeedback hint="Used only for this example. Nothing is sent." error="Enter a complete email address, such as you@example.com." invalid={invalid} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button iconOnly={false} loading={false} nativeButton={true} shape="square" size="md" tone="accent" variant="solid" type="submit"><ButtonLabel>Submit example</ButtonLabel></Button>
        <p role="status" className="text-ui">{submitted ? "Example complete. Nothing was sent." : ""}</p>
      </div>
    </form>
  );
}

export function InputSearchExample() {
  const [query, setQuery] = useState("");
  return (
    <form role="search" className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const value = new FormData(event.currentTarget).get("query");
      setQuery(typeof value === "string" ? value.trim() : "");
    }}>
      <Field orientation="vertical" name="query">
        <FieldLabel>Search the manual</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <Input size="md" type="search" placeholder="Try “Input”" className="flex-1 basis-40" onChange={() => setQuery("")} />
          <Button iconOnly={false} loading={false} nativeButton={true} shape="square" size="md" variant="solid" type="submit" tone="neutral"><ButtonLabel>Search</ButtonLabel></Button>
        </div>
      </Field>
      <p role="status" className="min-h-5 text-ui text-muted-foreground">{query ? `Example search: “${query}”. Nothing was sent.` : ""}</p>
    </form>
  );
}
