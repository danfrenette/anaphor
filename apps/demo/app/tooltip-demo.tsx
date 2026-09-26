"use client";

import { useState } from "react";
import { Button, ButtonLabel, Card, CardContent, Section, Tabs, TabsList, TabsPanel, TabsTab, Text, Tooltip, TooltipGroup, TooltipProvider, TooltipPopup, TooltipTrigger } from "@anaphor/system";
import { BookmarkSimple, TextB, TextItalic, TextUnderline } from "@phosphor-icons/react";
import { PlaygroundControls } from "./playground-host";
import { Range, Select } from "./playground-fields";

const defaults = { side: "top" as const, align: "center" as const, sideOffset: 8, delay: 400, timeout: 400 };
type Settings = { side: "top" | "right" | "bottom" | "left"; align: "start" | "center" | "end"; sideOffset: number; delay: number; timeout: number };
const formats = [{ id: "bold", label: "Bold", Icon: TextB }, { id: "italic", label: "Italic", Icon: TextItalic }, { id: "underline", label: "Underline", Icon: TextUnderline }] as const;

export function TooltipDemo() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [saved, setSaved] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [tab, setTab] = useState("single");
  const placement = { side: settings.side, align: settings.align, sideOffset: settings.sideOffset };
  return <Section id="tooltip" className="border-t border-border py-12">
    <PlaygroundControls sectionId="tooltip" title="Tooltip" onReset={() => { setSettings(defaults); setSaved(false); setActive([]); setTab("single"); }}>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Side" value={settings.side} options={["top", "right", "bottom", "left"]} onChange={side => setSettings(s => ({ ...s, side }))} />
        <Select label="Alignment" value={settings.align} options={["start", "center", "end"]} onChange={align => setSettings(s => ({ ...s, align }))} />
        <Range label="Offset" value={settings.sideOffset} min={4} max={20} step={2} unit="px" onChange={sideOffset => setSettings(s => ({ ...s, sideOffset }))} />
        <Range label="Initial delay" value={settings.delay} min={0} max={1000} step={100} unit="ms" onChange={delay => setSettings(s => ({ ...s, delay }))} />
        {tab === "group" && <Range label="Instant window" value={settings.timeout} min={100} max={1000} step={100} unit="ms" onChange={timeout => setSettings(s => ({ ...s, timeout }))} />}
      </div>
    </PlaygroundControls>
    <Text as="p" variant="label" className="text-muted-foreground">Control / Tooltip</Text>
    <Text as="h2" variant="title" className="mt-8">Tooltip</Text>
    <Text as="p" variant="description" className="mt-3">A little context on hover or keyboard focus.</Text>
    <Tabs value={tab} onValueChange={value => { if (typeof value === "string") setTab(value); }} className="mt-8">
      <TabsList aria-label="Tooltip examples"><TabsTab value="single">Single tooltip</TabsTab><TabsTab value="group">Instant group</TabsTab></TabsList>
      <TabsPanel value="single" className="pt-5">
        <Card variant="default"><CardContent className="grid min-h-64 place-content-center justify-items-center gap-5 p-6">
          <TooltipProvider delay={settings.delay} closeDelay={80} timeout={0}>
            <Tooltip><TooltipTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} aria-pressed={saved} onClick={() => setSaved(value => !value)} />}>
              <BookmarkSimple aria-hidden="true" weight={saved ? "fill" : "regular"} /><ButtonLabel>{saved ? "Saved reference" : "Save reference"}</ButtonLabel>
            </TooltipTrigger><TooltipPopup {...placement}>{saved ? "Remove from your reading list" : "Keep this reference in your reading list"}</TooltipPopup></Tooltip>
          </TooltipProvider>
          <Text as="p" variant="caption" className="max-w-80 text-center">Hover or focus for context. Click to save the reference.</Text>
        </CardContent></Card>
      </TabsPanel>
      <TabsPanel value="group" className="pt-5">
        <Card variant="default"><CardContent className="grid min-h-64 place-content-center justify-items-center gap-5 p-6">
          <TooltipGroup delay={settings.delay} closeDelay={80} timeout={settings.timeout}>
            <div role="group" aria-label="Text formatting" className="flex gap-1 rounded-control border border-border p-1">
              {formats.map(({ id, label, Icon }) => <Tooltip key={id}><TooltipTrigger aria-label={label} render={<Button nativeButton type="button" variant="ghost" tone="neutral" size="md" shape="square" iconOnly loading={false} className={`size-11 rounded-[calc(var(--radius-control)-4px)] ${active.includes(id) ? "bg-muted" : ""}`} aria-pressed={active.includes(id)} onClick={() => setActive(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />}><Icon aria-hidden="true" /></TooltipTrigger><TooltipPopup {...placement}>{label}</TooltipPopup></Tooltip>)}
            </div>
          </TooltipGroup>
          <Text as="p" variant="body" className={`text-center ${active.includes("bold") ? "font-bold" : ""} ${active.includes("italic") ? "italic" : ""} ${active.includes("underline") ? "underline underline-offset-4" : ""}`}>A place for deliberate work.</Text>
          <Text as="p" variant="caption" className="max-w-80 text-center">Pause on one icon, then move to its neighbor. The next hint appears instantly.</Text>
        </CardContent></Card>
      </TabsPanel>
    </Tabs>
    <Text as="h3" variant="heading" className="mt-8">Wait once, then keep up</Text>
    <Text as="p" variant="body" className="mt-3">The first hint waits to avoid accidental appearances. Within an instant group, nearby hints skip both the delay and the entrance animation. Leave the group briefly and the initial delay returns.</Text>
    <Text as="p" variant="body" className="mt-3">Keep tooltips brief and informational. Escape dismisses the hint; keyboard focus opens it without waiting. Actions belong in a menu or popover, and essential information stays available without hovering.</Text>
  </Section>;
}
