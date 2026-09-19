"use client";

import { Checkbox, Field, FieldLabel } from "@anaphor/system";

export function Select<const Value extends string>({ label, value, options, onChange }: { label: string; value: NoInfer<Value>; options: readonly Value[]; onChange: (value: NoInfer<Value>) => void }) {
  return (
    <label className="grid gap-1.5 text-ui">
      <span>{label}</span>
      <select className="min-h-11 rounded-control border border-border bg-background px-3 text-base" value={value} onChange={(event) => {
        const selected = options.find((option) => option === event.target.value);
        if (selected !== undefined) onChange(selected);
      }}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function Range({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  return (
    <label className="col-span-2 grid gap-1.5 text-ui">
      <span className="flex justify-between gap-4"><span>{label}</span><output className="font-mono text-label tabular-nums text-muted-foreground">{value}{unit}</output></span>
      <input className="accent-primary" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.valueAsNumber)} />
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <Field orientation="horizontal">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <FieldLabel>{label}</FieldLabel>
    </Field>
  );
}
