"use client";

import { Button, ButtonLabel, Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldItem, FieldLabel, Radio, RadioGroup } from "@anaphor/system";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Check } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";

const frequencies = [
  { value: "every", label: "Every update", description: "Receive each update as it arrives." },
  { value: "daily", label: "Daily digest", description: "A summary once a day." },
  { value: "weekly", label: "Weekly digest", description: "A summary once a week." },
] as const;
type Frequency = typeof frequencies[number]["value"];
const defaults: { value: Frequency; disabled: boolean; readOnly: boolean; invalid: boolean } = { value: "daily", disabled: false, readOnly: false, invalid: false };

export function RadioGroupPlayground() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState<string | null>(null);
  return <>
    <PlaygroundControls sectionId="radio-group" title="Radio group" onReset={() => { setSettings(defaults); setSaved(null); }}>
      <FieldGroup>
        {(["disabled", "readOnly", "invalid"] as const).map(key => <Check key={key} label={key === "readOnly" ? "Read only" : key === "disabled" ? "Disabled" : "Invalid"} checked={settings[key]} onChange={value => setSettings(current => ({ ...current, [key]: value }))} />)}
      </FieldGroup>
    </PlaygroundControls>
    <div className="mt-4 rounded-md border border-border bg-background p-6"><div className="max-w-96">
      <form aria-label="Notification preferences" onSubmit={event => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("frequency");
        setSaved(frequencies.find(frequency => frequency.value === value)?.label ?? null);
      }}>
        <Field orientation="vertical" name="frequency" disabled={settings.disabled} invalid={settings.invalid}>
          <FieldLabel>Notification frequency</FieldLabel>
          <FieldDescription>Choose how often to receive updates about the design system.</FieldDescription>
          <RadioGroup<Frequency> value={settings.value} readOnly={settings.readOnly} onValueChange={value => { setSettings(current => ({ ...current, value })); setSaved(null); }} className="mt-4">
            {frequencies.map(frequency => <FieldItem key={frequency.value} orientation="horizontal">
              <Radio value={frequency.value} />
              <FieldContent><FieldLabel>{frequency.label}</FieldLabel><FieldDescription>{frequency.description}</FieldDescription></FieldContent>
            </FieldItem>)}
          </RadioGroup>
          <FieldError match={settings.invalid}>Choose a notification frequency.</FieldError>
        </Field>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button nativeButton type="submit" variant="solid" tone="accent" size="md" shape="square" iconOnly={false} loading={false} disabled={settings.disabled || settings.invalid}><ButtonLabel>Save preference</ButtonLabel></Button>
          <output className="text-ui" aria-live="polite">{saved ? `Saved: ${saved}.` : "Changes stay in this example."}</output>
        </div>
      </form>
    </div></div>
  </>;
}

export function RadioRequiredExample() {
  const firstChoiceRef = useRef<HTMLSpanElement>(null);
  const errorId = useId();
  const [value, setValue] = useState<Frequency | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  return <form aria-label="Required notification preference" noValidate className="mt-4" onSubmit={event => {
    event.preventDefault();
    const missing = new FormData(event.currentTarget).get("requiredFrequency") === null;
    flushSync(() => { setInvalid(missing); setSaved(!missing); });
    if (missing) firstChoiceRef.current?.focus();
  }}>
    <Field orientation="vertical" name="requiredFrequency" invalid={invalid}>
      <FieldLabel>Choose a frequency</FieldLabel>
      <FieldDescription>A choice is required when saving this example.</FieldDescription>
      <RadioGroup<Frequency | null> value={value} required className="mt-2" onValueChange={next => { setValue(next); setInvalid(false); setSaved(false); }}>
        {frequencies.map((frequency, index) => <FieldItem key={frequency.value} orientation="horizontal"><Radio value={frequency.value} ref={index === 0 ? firstChoiceRef : undefined} aria-describedby={invalid ? errorId : undefined} /><FieldLabel>{frequency.label}</FieldLabel></FieldItem>)}
      </RadioGroup>
      <FieldError id={errorId} match={invalid}>Choose a notification frequency.</FieldError>
    </Field>
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <Button nativeButton type="submit" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false}><ButtonLabel>Save required preference</ButtonLabel></Button>
      <output className="text-ui" aria-live="polite">{saved ? "Preference saved." : ""}</output>
    </div>
  </form>;
}
