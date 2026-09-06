"use client";

import { Button, ButtonLabel, type ButtonProps } from "@design-language/system";
import { ArrowRight } from "@phosphor-icons/react";
import { useState, type CSSProperties } from "react";

type Controls = {
  variant: NonNullable<ButtonProps["variant"]>;
  size: NonNullable<ButtonProps["size"]>;
  tone: NonNullable<ButtonProps["tone"]>;
  shape: NonNullable<ButtonProps["shape"]>;
  radius: number;
  loading: boolean;
  disabled: boolean;
  pressScale: number;
  duration: number;
};

const defaults: Controls = {
  variant: "solid",
  size: "md",
  tone: "accent",
  shape: "square",
  radius: 10,
  loading: false,
  disabled: false,
  pressScale: 0.97,
  duration: 125,
};

const variants = ["solid", "soft", "outline", "ghost"] as const;

export function ButtonDemo() {
  const [controls, setControls] = useState(defaults);
  const [panelOpen, setPanelOpen] = useState(true);
  const demoStyle = {
    "--dl-button-radius": `${controls.radius}px`,
    "--dl-button-press-scale": controls.pressScale,
    "--dl-button-duration": `${controls.duration}ms`,
  } as CSSProperties;

  function update<Key extends keyof Controls>(key: Key, value: Controls[Key]) {
    setControls((current) => ({ ...current, [key]: value }));
  }

  return (
    <section id="button" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>02.01 / Control</p>
          <p>Status / Stable</p>
        </div>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Button</h2>
        <p className="mt-3 max-w-[70ch] text-body text-muted-foreground">
          Triggers an immediate action. Use one primary action per surface.
        </p>
      </header>

      <div className="mt-10">
        <div className="flex items-center justify-between font-mono text-label tracking-[0.08em] uppercase">
          <p>Primary demo</p>
          <p className="text-muted-foreground">Interactive</p>
        </div>
        <div className="mt-4 flex min-h-56 items-center justify-center border border-border bg-muted p-6">
          <Button
            data-testid="primary-button"
            variant={controls.variant}
            size={controls.size}
            tone={controls.tone}
            shape={controls.shape}
            loading={controls.loading}
            disabled={controls.disabled}
            style={demoStyle}
          >
            <ButtonLabel>Execute</ButtonLabel>
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between font-mono text-label tracking-[0.08em] uppercase">
          <p>State matrix</p>
          <p className="text-muted-foreground">04 states</p>
        </div>
        <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <State label="Default">
            <Button><ButtonLabel>Execute</ButtonLabel></Button>
          </State>
          <State label="Focus">
            <Button className="outline-2 outline-offset-2 outline-ring"><ButtonLabel>Execute</ButtonLabel></Button>
          </State>
          <State label="Loading">
            <Button loading><ButtonLabel>Execute</ButtonLabel></Button>
          </State>
          <State label="Disabled">
            <Button disabled><ButtonLabel>Execute</ButtonLabel></Button>
          </State>
        </div>
      </div>

      <div className="mt-10">
        <p className="font-mono text-label tracking-[0.08em] uppercase">Behavior</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-border p-6">
          <Button variant="soft">
            <ArrowRight aria-hidden="true" />
            <ButtonLabel>Composed</ButtonLabel>
          </Button>
          <Button shape="round" data-icon-only aria-label="Continue">
            <ArrowRight aria-hidden="true" />
          </Button>
          <Button render={<button data-composed="true" />} tone="neutral" variant="outline">
            <ButtonLabel>Render prop</ButtonLabel>
          </Button>
        </div>
      </div>

      <div className="dark mt-10 bg-background p-6 text-foreground">
        <div className="flex items-center justify-between font-mono text-label tracking-[0.08em] uppercase">
          <p>Theme study / Dark</p>
          <p className="text-muted-foreground">Contrast / AA</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border border-border bg-muted p-6">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              <ButtonLabel>{variant.charAt(0).toUpperCase() + variant.slice(1)}</ButtonLabel>
            </Button>
          ))}
        </div>
      </div>

      <aside className="mt-8 border border-border bg-background shadow-lg lg:fixed lg:right-6 lg:bottom-6 lg:z-30 lg:mt-0 lg:w-80">
        <div className="flex min-h-12 items-center justify-between border-b border-border px-4">
          <button
            type="button"
            className="flex min-h-8 items-center gap-2 font-mono text-label tracking-[0.08em] uppercase"
            aria-controls="button-controls"
            aria-expanded={panelOpen}
            aria-label={panelOpen ? "Hide controls" : "Show controls"}
            onClick={() => setPanelOpen((open) => !open)}
          >
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Button / Control
          </button>
          {panelOpen ? (
            <button
              type="button"
              className="min-h-8 font-mono text-label text-muted-foreground uppercase hover:text-foreground"
              onClick={() => setControls(defaults)}
              aria-label="Reset controls"
            >
              Reset
            </button>
          ) : null}
        </div>
        {panelOpen ? <div id="button-controls" className="grid grid-cols-2 gap-4 p-4">
          <Select label="Variant" value={controls.variant} options={variants} onChange={(value) => update("variant", value as Controls["variant"])} />
          <Select label="Size" value={controls.size} options={["xs", "sm", "md", "lg"]} onChange={(value) => update("size", value as Controls["size"])} />
          <Select label="Tone" value={controls.tone} options={["accent", "neutral"]} onChange={(value) => update("tone", value as Controls["tone"])} />
          <Select label="Shape" value={controls.shape} options={["square", "round"]} onChange={(value) => update("shape", value as Controls["shape"])} />
          <Range label="Radius" value={controls.radius} min={0} max={24} step={2} unit="px" onChange={(value) => update("radius", value)} />
          <Range label="Press scale" value={controls.pressScale} min={0.94} max={1} step={0.01} onChange={(value) => update("pressScale", value)} />
          <Range label="Duration" value={controls.duration} min={0} max={250} step={25} unit="ms" onChange={(value) => update("duration", value)} />
          <div className="col-span-2 flex items-center gap-6">
            <Check label="Loading" checked={controls.loading} onChange={(value) => update("loading", value)} />
            <Check label="Disabled" checked={controls.disabled} onChange={(value) => update("disabled", value)} />
          </div>
        </div> : null}
      </aside>
    </section>
  );
}

function State({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-5 bg-muted p-4">
      {children}
      <p className="font-mono text-label text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.valueAsNumber)} />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center gap-2 text-ui">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
