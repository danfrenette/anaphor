"use client";

import { useId } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { Slider } from "dialkit";
import { MotionConfig } from "motion/react";
import { Button, ButtonLabel, Checkbox, Field, FieldLabel, Menu, MenuTrigger, MenuPopup, MenuRadioGroup, MenuRadioItem, useTheme } from "@anaphor/system";

export function Select<const Value extends string>({ label, value, options, onChange }: { label: string; value: NoInfer<Value>; options: readonly Value[]; onChange: (value: NoInfer<Value>) => void }) {
  const valueId = useId();
  return <div className="grid gap-1.5 text-ui">
    <span>{label}</span>
    <Menu>
      <MenuTrigger aria-label={label} aria-describedby={valueId}
        render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} className="min-h-11 w-full justify-between" />}>
        <ButtonLabel id={valueId}>{value}</ButtonLabel><CaretDown aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup side="bottom" sideOffset={6} align="start" className="min-w-[var(--anchor-width)]" aria-label={label}>
        <MenuRadioGroup value={value} onValueChange={next => {
          const selected = options.find(option => option === next);
          if (selected !== undefined) onChange(selected);
        }}>
          {options.map(option => <MenuRadioItem key={option} value={option}>{option}</MenuRadioItem>)}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  </div>;
}

export function Range({ label, value, min, max, step, unit, onChange, snap = "standard", releaseThreshold = 0.6 }: { snap?: "standard" | "magnetic"; releaseThreshold?: number; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  const { resolvedTheme } = useTheme();
  return <MotionConfig reducedMotion="user">
    <div className="dialkit-root anaphor-dials col-span-2" data-theme={resolvedTheme === "dark" ? "dark" : "light"}>
      <Slider label={label} value={value} min={min} max={max} step={step} unit={unit} onChange={onChange} snap={snap} releaseThreshold={releaseThreshold} />
    </div>
  </MotionConfig>;
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <Field orientation="horizontal">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <FieldLabel>{label}</FieldLabel>
    </Field>
  );
}
