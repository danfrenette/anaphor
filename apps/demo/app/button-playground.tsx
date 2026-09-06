"use client";

import { Button, ButtonLabel, Card, CardContent, CardHeader, CardTitle, type ButtonProps } from "@design-language/system";
import { ArrowRight, Trash } from "@phosphor-icons/react";
import { type CSSProperties, type ReactNode } from "react";
import { useDemoControls } from "./demo-state";

export type ButtonControls = {
  variant: NonNullable<ButtonProps["variant"]>;
  size: NonNullable<ButtonProps["size"]>;
  tone: NonNullable<ButtonProps["tone"]>;
  shape: NonNullable<ButtonProps["shape"]>;
  radius: number;
  iconOnly: boolean;
  loading: boolean;
  disabled: boolean;
  pressScale: number;
  duration: number;
};

export const buttonDefaults: ButtonControls = {
  variant: "solid",
  size: "md",
  tone: "accent",
  shape: "square",
  radius: 10,
  iconOnly: false,
  loading: false,
  disabled: false,
  pressScale: 0.97,
  duration: 125,
};

const variants = ["solid", "destructive", "outline", "ghost"] as const;

export function ButtonPlayground({ children }: { children: ReactNode }) {
  const { button: controls } = useDemoControls();
  const destructive = controls.variant === "destructive";
  const demoStyle = {
    "--dl-button-radius": `${controls.radius}px`,
    "--dl-button-press-scale": controls.pressScale,
    "--dl-button-duration": `${controls.duration}ms`,
  } as CSSProperties;

  return (
    <>
      <Card role="group" aria-label="Primary button example" className="mt-10">
        <CardHeader>
          <CardTitle className="font-mono text-label tracking-[0.08em] uppercase">Primary demo</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-56 items-center justify-center">
          <Button
            data-testid="primary-button"
            variant={controls.variant}
            size={controls.size}
            tone={controls.tone}
            shape={controls.shape}
            iconOnly={controls.iconOnly}
            aria-label={controls.iconOnly ? (destructive ? "Delete item" : "Execute") : undefined}
            loading={controls.loading}
            disabled={controls.disabled}
            style={demoStyle}
          >
            {!controls.iconOnly ? <ButtonLabel>{destructive ? "Delete item" : "Execute"}</ButtonLabel> : null}
            {destructive ? <Trash aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </Button>
        </CardContent>
      </Card>

      {children}
    </>
  );
}

export function ButtonControlFields() {
  const { button: controls, setButton } = useDemoControls();
  function update<Key extends keyof ButtonControls>(key: Key, value: ButtonControls[Key]) {
    setButton((current) => ({ ...current, [key]: value }));
  }
  return <div className="grid grid-cols-2 gap-4">
          <Select label="Variant" value={controls.variant} options={variants} onChange={(value) => update("variant", value as ButtonControls["variant"])} />
          <Select label="Size" value={controls.size} options={["xs", "sm", "md", "lg"]} onChange={(value) => update("size", value as ButtonControls["size"])} />
          <Select label="Tone" value={controls.tone} options={["accent", "neutral"]} onChange={(value) => update("tone", value as ButtonControls["tone"])} />
          <Select label="Shape" value={controls.shape} options={["square", "round"]} onChange={(value) => update("shape", value as ButtonControls["shape"])} />
          <Range label="Radius" value={controls.radius} min={0} max={24} step={2} unit="px" onChange={(value) => update("radius", value)} />
          <Range label="Press scale" value={controls.pressScale} min={0.94} max={1} step={0.01} onChange={(value) => update("pressScale", value)} />
          <Range label="Duration" value={controls.duration} min={0} max={250} step={25} unit="ms" onChange={(value) => update("duration", value)} />
          <div className="col-span-2 flex flex-wrap items-center gap-x-6">
            <Check label="Icon only" checked={controls.iconOnly} onChange={(value) => update("iconOnly", value)} />
            <Check label="Loading" checked={controls.loading} onChange={(value) => update("loading", value)} />
            <Check label="Disabled" checked={controls.disabled} onChange={(value) => update("disabled", value)} />
          </div>
  </div>;
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-ui">
      <span>{label}</span>
      <select className="min-h-10 rounded-md border border-border bg-background px-3" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Range({ label, value, min, max, step, unit = "", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) {
  return (
    <label className="col-span-2 grid gap-1.5 text-ui">
      <span className="flex justify-between gap-4"><span>{label}</span><output className="font-mono text-label tabular-nums text-muted-foreground">{value}{unit}</output></span>
      <input className="accent-primary" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.valueAsNumber)} />
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center gap-2 text-ui">
      <input className="accent-primary" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
