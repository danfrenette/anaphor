"use client";

import { Card, CardContent, CardHeader, CardTitle, Checkbox, Field, FieldDescription, FieldLabel } from "@design-language/system";
import { useState } from "react";
import { Check } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";

const defaults = { checked: false, indeterminate: false, disabled: false, readOnly: false, invalid: false };

export function CheckboxPlayground() {
  const [settings, setSettings] = useState(defaults);
  return (
    <>
      <PlaygroundControls sectionId="checkbox" title="Checkbox" onReset={() => setSettings(defaults)}>
        <div className="grid gap-2">
          {(["checked", "indeterminate", "disabled", "readOnly", "invalid"] as const).map((key) => (
            <Check key={key} label={key === "readOnly" ? "Read only" : key.charAt(0).toUpperCase() + key.slice(1)} checked={settings[key]} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
          ))}
        </div>
      </PlaygroundControls>
      <Card role="group" aria-label="Primary checkbox example">
        <CardHeader className="p-4 pb-1"><CardTitle className="text-label text-muted-foreground uppercase font-normal">Primary demo</CardTitle></CardHeader>
        <CardContent className="flex min-h-32 items-center justify-center p-6">
          <Field className="gap-0" invalid={settings.invalid} disabled={settings.disabled}>
            <FieldLabel className="flex min-h-8 items-center gap-3 pointer-coarse:min-h-11">
              <Checkbox checked={settings.checked} indeterminate={settings.indeterminate} disabled={settings.disabled} readOnly={settings.readOnly} aria-invalid={settings.invalid || undefined} onCheckedChange={(checked) => setSettings((current) => ({ ...current, checked, indeterminate: false }))} />
              Keep me updated
            </FieldLabel>
            <FieldDescription className="pl-8 text-pretty">Occasional updates about the design system.</FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </>
  );
}

export function CheckboxRequiredExample() {
  return (
    <Field className="gap-0">
      <FieldLabel className="flex min-h-8 items-center gap-3 pointer-coarse:min-h-11">
        <Checkbox name="agreement" required />
        I agree to the example terms
      </FieldLabel>
      <FieldDescription className="pl-8 text-pretty">Required when submitting a form.</FieldDescription>
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
      <Field>
        <FieldLabel className="flex min-h-8 items-center gap-3 pointer-coarse:min-h-11">
          <Checkbox checked={allSelected} indeterminate={selected.length > 0 && !allSelected} onCheckedChange={(checked) => setSelected(checked ? channels : [])} />
          Select all
        </FieldLabel>
      </Field>
      <div className="mt-2 grid pl-8">
        {channels.map((channel) => (
          <Field key={channel}>
            <FieldLabel className="flex min-h-8 items-center gap-3 pointer-coarse:min-h-11">
              <Checkbox name="preferences" value={channel} checked={selected.includes(channel)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, channel] : current.filter((value) => value !== channel))} />
              {channel}
            </FieldLabel>
          </Field>
        ))}
      </div>
    </fieldset>
  );
}
