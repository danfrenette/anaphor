"use client";

import { useState } from "react";
import { Button, ButtonLabel, Section, Text, Tooltip, TooltipGroup, TooltipProvider, TooltipPopup, TooltipTrigger } from "@anaphor/system";
import { BookmarkSimple, TextB, TextItalic, TextUnderline } from "@phosphor-icons/react";
import { PlaygroundControls } from "./playground-host";
import { Range, Select } from "./playground-fields";
import { CatalogExample } from "./catalog-example";

const defaults = { side: "top" as const, align: "center" as const, sideOffset: 8, delay: 400, timeout: 400 };
type Settings = { side: "top" | "right" | "bottom" | "left"; align: "start" | "center" | "end"; sideOffset: number; delay: number; timeout: number };
const formats = [{ id: "bold", label: "Bold", Icon: TextB }, { id: "italic", label: "Italic", Icon: TextItalic }, { id: "underline", label: "Underline", Icon: TextUnderline }] as const;

function TooltipExample({ example, settings = defaults, label }: { example: "Single" | "Group"; settings?: Settings; label: string }) {
  const [saved, setSaved] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const placement = { side: settings.side, align: settings.align, sideOffset: settings.sideOffset };
  return <div role="group" aria-label={label} className="grid min-h-48 place-content-center justify-items-center gap-5">
    {example === "Single" ? <>
      <TooltipProvider delay={settings.delay} closeDelay={80} timeout={0}>
        <Tooltip><TooltipTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} aria-pressed={saved} onClick={() => setSaved(value => !value)} />}>
          <BookmarkSimple aria-hidden="true" weight={saved ? "fill" : "regular"} /><ButtonLabel>{saved ? "Saved reference" : "Save reference"}</ButtonLabel>
        </TooltipTrigger><TooltipPopup {...placement}>{saved ? "Remove from your reading list" : "Keep this reference in your reading list"}</TooltipPopup></Tooltip>
      </TooltipProvider>
      <Text as="p" variant="caption" className="max-w-80 text-center">Hover or focus for context. Click to save the reference.</Text>
    </> : <>
      <TooltipGroup delay={settings.delay} closeDelay={80} timeout={settings.timeout}>
        <div role="group" aria-label="Text formatting" className="flex gap-1 rounded-control border border-border p-1">
          {formats.map(({ id, label, Icon }) => <Tooltip key={id}><TooltipTrigger aria-label={label} render={<Button nativeButton type="button" variant="ghost" tone="neutral" size="md" shape="square" iconOnly loading={false} className={`size-11 rounded-[calc(var(--radius-control)-4px)] ${active.includes(id) ? "bg-muted" : ""}`} aria-pressed={active.includes(id)} onClick={() => setActive(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />}><Icon aria-hidden="true" /></TooltipTrigger><TooltipPopup {...placement}>{label}</TooltipPopup></Tooltip>)}
        </div>
      </TooltipGroup>
      <Text as="p" variant="body" className={`text-center ${active.includes("bold") ? "font-bold" : ""} ${active.includes("italic") ? "italic" : ""} ${active.includes("underline") ? "underline underline-offset-4" : ""}`}>A place for deliberate work.</Text>
      <Text as="p" variant="caption" className="max-w-80 text-center">Pause on one icon, then move to its neighbor. The next hint appears instantly.</Text>
    </>}
  </div>;
}

function tooltipCode(example: "Single" | "Group", settings: Settings = defaults) {
  const popup = `side="${settings.side}" align="${settings.align}" sideOffset={${settings.sideOffset}}`;
  if (example === "Single") return `const [saved, setSaved] = useState(false);

<TooltipProvider delay={${settings.delay}} closeDelay={80} timeout={0}>
  <Tooltip>
    <TooltipTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral"
      size="md" shape="square" iconOnly={false} loading={false}
      aria-pressed={saved} onClick={() => setSaved(value => !value)} />}>
      <BookmarkSimple aria-hidden="true" weight={saved ? "fill" : "regular"} />
      <ButtonLabel>{saved ? "Saved reference" : "Save reference"}</ButtonLabel>
    </TooltipTrigger>
    <TooltipPopup ${popup}>
      {saved ? "Remove from your reading list" : "Keep this reference in your reading list"}
    </TooltipPopup>
  </Tooltip>
</TooltipProvider>`;
  return `const [active, setActive] = useState<string[]>([]);
const formats = [
  { id: "bold", label: "Bold", Icon: TextB },
  { id: "italic", label: "Italic", Icon: TextItalic },
  { id: "underline", label: "Underline", Icon: TextUnderline },
];

<TooltipGroup delay={${settings.delay}} closeDelay={80} timeout={${settings.timeout}}>
  <div role="group" aria-label="Text formatting" className="flex gap-1 rounded-control border border-border p-1">
    {formats.map(({ id, label, Icon }) => <Tooltip key={id}>
      <TooltipTrigger aria-label={label} render={<Button nativeButton type="button"
        variant="ghost" tone="neutral" size="md" shape="square" iconOnly loading={false}
        aria-pressed={active.includes(id)}
        onClick={() => setActive(current => current.includes(id)
          ? current.filter(value => value !== id) : [...current, id])} />}>
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipPopup ${popup}>{label}</TooltipPopup>
    </Tooltip>)}
  </div>
</TooltipGroup>`;
}

export function TooltipDemo() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [example, setExample] = useState<"Single" | "Group">("Single");
  const [revision, setRevision] = useState(0);
  return <Section id="tooltip" className="border-t border-border py-12">
    <PlaygroundControls sectionId="tooltip" title="Tooltip" onReset={() => { setSettings(defaults); setExample("Single"); setRevision(value => value + 1); }}>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Example" value={example} options={["Single", "Group"]} onChange={setExample} />
        <Select label="Side" value={settings.side} options={["top", "right", "bottom", "left"]} onChange={side => setSettings(s => ({ ...s, side }))} />
        <Select label="Alignment" value={settings.align} options={["start", "center", "end"]} onChange={align => setSettings(s => ({ ...s, align }))} />
        <Range label="Offset" value={settings.sideOffset} min={4} max={20} step={2} unit="px" onChange={sideOffset => setSettings(s => ({ ...s, sideOffset }))} />
        <Range label="Initial delay" value={settings.delay} min={0} max={1000} step={100} unit="ms" onChange={delay => setSettings(s => ({ ...s, delay }))} />
        {example === "Group" && <Range label="Instant window" value={settings.timeout} min={100} max={1000} step={100} unit="ms" onChange={timeout => setSettings(s => ({ ...s, timeout }))} />}
      </div>
    </PlaygroundControls>
    <Text as="h2" variant="title">Tooltip</Text>
    <Text as="p" variant="description" className="mt-3">A little context on hover or keyboard focus.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Single tooltip" description="A brief hint that follows the action’s current state." code={tooltipCode("Single")}>
        <TooltipExample example="Single" label="Single tooltip preview" />
      </CatalogExample>
      <CatalogExample title="Instant group" description="The first hint waits. Neighboring hints skip the delay and entrance animation." code={tooltipCode("Group")}>
        <TooltipExample example="Group" label="Instant group preview" />
      </CatalogExample>
      <CatalogExample title="Playground" description="Use Controls to explore placement and timing. Reset restores this preview’s settings and actions." code={tooltipCode(example, settings)}>
        <TooltipExample key={revision} example={example} settings={settings} label="Tooltip playground preview" />
      </CatalogExample>
    </div>
    <p className="mt-4 text-small text-muted-foreground">Keyboard focus opens hints immediately; Escape dismisses them. Keep hints brief and noninteractive, with essential information available without hovering.</p>
  </Section>;
}
