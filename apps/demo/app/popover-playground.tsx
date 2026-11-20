"use client";

import { useState } from "react";
import { Button, ButtonLabel, Checkbox, Field, FieldGroup, FieldLabel, Input, Popover, PopoverBody, PopoverClose, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger, Text } from "@anaphor/system";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { Range, Select } from "./playground-fields";
import { PlaygroundControls } from "./playground-host";
import { CatalogExample } from "./catalog-example";

const defaults = { side: "bottom" as const, align: "center" as const, sideOffset: 8, origin: "Trigger" as const };
type Settings = { side: "top" | "bottom" | "left" | "right"; align: "start" | "center" | "end"; sideOffset: number; origin: "Trigger" | "Center" };

export function PopoverPreferences({ label = "Workspace settings", settings = defaults }: { label?: string; settings?: Settings }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("My workspace");
  const [density, setDensity] = useState<"Comfortable" | "Compact">("Comfortable");
  const [showDetails, setShowDetails] = useState(true);

  return <div role="group" aria-label={`${label} preview`} className="grid min-h-64 place-items-center">
          <div className="grid justify-items-center gap-5">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}>
                <SlidersHorizontal aria-hidden="true" /><ButtonLabel>{label}</ButtonLabel>
              </PopoverTrigger>
              <PopoverPopup side={settings.side} align={settings.align} sideOffset={settings.sideOffset} positionerProps={{ collisionPadding: 16 }} className={settings.origin === "Center" ? "origin-center" : undefined}>
                <PopoverBody>
                  <PopoverTitle>{label}</PopoverTitle>
                  <PopoverDescription>Changes apply as you make them.</PopoverDescription>
                  <FieldGroup className="mt-4">
                    <Field orientation="vertical"><FieldLabel>Workspace name</FieldLabel><Input size="md" value={name} onValueChange={setName} /></Field>
                    <Select label="Density" value={density} options={["Comfortable", "Compact"]} onChange={setDensity} />
                    <Field orientation="horizontal"><Checkbox checked={showDetails} onCheckedChange={setShowDetails} /><FieldLabel>Show details</FieldLabel></Field>
                  </FieldGroup>
                  <PopoverClose className="mt-4 w-full" render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}><ButtonLabel>Done</ButtonLabel></PopoverClose>
                </PopoverBody>
              </PopoverPopup>
            </Popover>
            <Text as="p" variant="caption" className="max-w-64 break-words text-center">{name || "Untitled workspace"} · {density.toLowerCase()} · details {showDetails ? "visible" : "hidden"}</Text>
          </div>
  </div>;
}

export function PopoverPlayground() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [revision, setRevision] = useState(0);
  return <>
    <PlaygroundControls sectionId="popover" title="Popover" onReset={() => { setSettings(defaults); setRevision(value => value + 1); }}>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Side" value={settings.side} options={["top", "bottom", "left", "right"]} onChange={side => setSettings(s => ({ ...s, side }))} />
        <Select label="Alignment" value={settings.align} options={["start", "center", "end"]} onChange={align => setSettings(s => ({ ...s, align }))} />
        <Select label="Scale origin" value={settings.origin} options={["Trigger", "Center"]} onChange={origin => setSettings(s => ({ ...s, origin }))} />
        <Range label="Offset" value={settings.sideOffset} min={4} max={24} step={2} unit="px" onChange={sideOffset => setSettings(s => ({ ...s, sideOffset }))} />
      </div>
      <p className="mt-3 text-small text-muted-foreground">Trigger origin follows the anchor, including when placement flips. Center is a comparison; reduced motion disables scaling.</p>
    </PlaygroundControls>
    <CatalogExample title="Playground" description="Use Controls to compare trigger and center origins, then change placement, alignment, and offset. Reset restores the preview’s settings and content." code={popoverSettingsCode(settings)}>
      <PopoverPreferences key={revision} settings={settings} />
    </CatalogExample>
  </>;
}

export function popoverSettingsCode(settings: Settings = defaults) {
  return `<Popover>
  <PopoverTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}>Workspace settings</PopoverTrigger>
  <PopoverPopup side="${settings.side}" align="${settings.align}" sideOffset={${settings.sideOffset}}${settings.origin === "Center" ? ' className="origin-center"' : ""}
    positionerProps={{ collisionPadding: 16 }}>
    <PopoverBody>
      <PopoverTitle>Workspace settings</PopoverTitle>
      <PopoverDescription>Changes apply as you make them.</PopoverDescription>
      <FieldGroup className="mt-4">
        <Field orientation="vertical">
          <FieldLabel>Workspace name</FieldLabel>
          <Input size="md" value={name} onValueChange={setName} />
        </Field>
        {/* Density uses MenuRadioGroup; Show details uses Checkbox. */}
      </FieldGroup>
      <PopoverClose render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}>Done</PopoverClose>
    </PopoverBody>
  </PopoverPopup>
</Popover>`;
}
