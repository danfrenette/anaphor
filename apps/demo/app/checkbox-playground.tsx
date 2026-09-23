"use client";

import { Card, CardContent, CardHeader, CardTitle, Checkbox, CheckboxGroup, Field, FieldContent, FieldGroup, FieldDescription, FieldLabel } from "@anaphor/system";
import { useState } from "react";
import { Check } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";

const defaults = { checked: false, indeterminate: false, disabled: false, readOnly: false, invalid: false };

export function CheckboxPlayground() {
  const [settings, setSettings] = useState(defaults);
  return (
    <>
      <PlaygroundControls sectionId="checkbox" title="Checkbox" onReset={() => setSettings(defaults)}>
        <FieldGroup>
          {(["checked", "indeterminate", "disabled", "readOnly", "invalid"] as const).map((key) => (
            <Check key={key} label={key === "readOnly" ? "Read only" : key.charAt(0).toUpperCase() + key.slice(1)} checked={settings[key]} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
          ))}
        </FieldGroup>
      </PlaygroundControls>
      <Card variant="default" role="group" aria-label="Primary checkbox example">
        <CardHeader className="p-4 pb-1"><CardTitle as="h3" variant="label">Primary demo</CardTitle></CardHeader>
        <CardContent className="flex min-h-32 items-center justify-center p-6">
          <Field orientation="horizontal" invalid={settings.invalid} disabled={settings.disabled}>
            <Checkbox checked={settings.checked} indeterminate={settings.indeterminate} disabled={settings.disabled} readOnly={settings.readOnly} aria-invalid={settings.invalid || undefined} onCheckedChange={(checked) => setSettings((current) => ({ ...current, checked, indeterminate: false }))} />
            <FieldContent><FieldLabel>Keep me updated</FieldLabel><FieldDescription>Occasional updates about the design system.</FieldDescription></FieldContent>
          </Field>
        </CardContent>
      </Card>
    </>
  );
}

export function CheckboxRequiredExample() {
  return (
    <Field orientation="horizontal">
      <Checkbox name="agreement" required />
      <FieldContent><FieldLabel>I agree to the example terms</FieldLabel><FieldDescription>Required when submitting a form.</FieldDescription></FieldContent>
    </Field>
  );
}

const channels = ["Product updates", "Design notes", "Community events"];

export function CheckboxSelectionExample() {
  const [selected, setSelected] = useState(channels.slice(0, 1));
  const allSelected = selected.length === channels.length;
  return (
    <fieldset className="grid">
      <legend className="mb-1 text-ui text-muted-foreground">Email preferences</legend>
      <Field orientation="horizontal">
        <Checkbox checked={allSelected} indeterminate={selected.length > 0 && !allSelected} onCheckedChange={(checked) => setSelected(checked ? channels : [])} />
        <FieldLabel>Select all</FieldLabel>
      </Field>
      <CheckboxGroup className="mt-2 pl-8">
        <FieldGroup>
          {channels.map((channel) => (
            <Field orientation="horizontal" key={channel}>
              <Checkbox name="preferences" value={channel} checked={selected.includes(channel)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, channel] : current.filter((value) => value !== channel))} />
              <FieldLabel>{channel}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </CheckboxGroup>
    </fieldset>
  );
}
