"use client";

import { Button, ButtonLabel, type ButtonProps } from "@anaphor/system";
import { ArrowRight, Trash } from "@phosphor-icons/react";
import { useState, type Dispatch, type SetStateAction, type CSSProperties } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check, Range, Select } from "./playground-fields";

type ButtonControls = {
  variant: ButtonProps["variant"];
  size: ButtonProps["size"];
  tone: ButtonProps["tone"];
  shape: ButtonProps["shape"];
  radius: number;
  iconOnly: boolean;
  loading: boolean;
  disabled: boolean;
  pressScale: number;
  duration: number;
};

const buttonDefaults: ButtonControls = {
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

const variants = ["solid", "outline", "ghost", "soft"] as const;

export function ButtonPlayground() {
  const [controls, setButton] = useState(buttonDefaults);
  const destructive = controls.tone === "danger";
  const demoStyle: CSSProperties & Record<`--${string}`, string | number> = {
    "--anaphor-button-radius": `${controls.radius}px`,
    "--anaphor-button-press-scale": controls.pressScale,
    "--anaphor-button-duration": `${controls.duration}ms`,
  };

  return (
    <>
      <PlaygroundControls sectionId="button" title="Button" onReset={() => setButton(buttonDefaults)}>
        <ButtonControlFields controls={controls} setButton={setButton} />
      </PlaygroundControls>
      <div role="group" aria-label="Primary button example" className="mt-4 flex min-h-32 items-center justify-center rounded-md border border-border bg-background p-6">
          <Button nativeButton={true} type="button"
            data-testid="primary-button"
            variant={controls.variant}
            tone={controls.tone}
            size={controls.size}
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
      </div>
    </>
  );
}

function ButtonControlFields({ controls, setButton }: { controls: ButtonControls; setButton: Dispatch<SetStateAction<ButtonControls>> }) {
  function update<Key extends keyof ButtonControls>(key: Key, value: ButtonControls[Key]) {
    setButton((current) => ({ ...current, [key]: value }));
  }
  return <div className="grid grid-cols-2 gap-4">
          <Select label="Variant" value={controls.variant} options={variants} onChange={(value) => update("variant", value)} />
          <Select label="Size" value={controls.size} options={["xs", "sm", "md", "lg"]} onChange={(value) => update("size", value)} />
          <Select label="Tone" value={controls.tone} options={["accent", "neutral", "danger"]} onChange={(value) => update("tone", value)} />
          <Select label="Shape" value={controls.shape} options={["square", "round"]} onChange={(value) => update("shape", value)} />
          <Range label="Radius" value={controls.radius} min={0} max={24} step={2} unit="px" onChange={(value) => update("radius", value)} />
          <Range unit="" label="Press scale" value={controls.pressScale} min={0.94} max={1} step={0.01} onChange={(value) => update("pressScale", value)} />
          <Range label="Duration" value={controls.duration} min={0} max={250} step={25} unit="ms" onChange={(value) => update("duration", value)} />
          <div className="col-span-2 flex flex-wrap items-center gap-x-6">
            <Check label="Icon only" checked={controls.iconOnly} onChange={(value) => update("iconOnly", value)} />
            <Check label="Loading" checked={controls.loading} onChange={(value) => update("loading", value)} />
            <Check label="Disabled" checked={controls.disabled} onChange={(value) => update("disabled", value)} />
          </div>
  </div>;
}
