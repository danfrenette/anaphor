"use client";

import { Button, ButtonLabel, Card, CardContent, CardHeader, CardTitle, CommandPalette, FieldGroup, Kbd, KbdGroup, Text, useShortcut } from "@anaphor/system";
import { Copy, MagnifyingGlass, PencilSimple, Star } from "@phosphor-icons/react";
import { useRef, useState, type RefObject } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check } from "./playground-fields";

const defaults = { animateHighlight: false, icons: true, shortcuts: true };
const commands = [
  { id: "rename", label: "Rename document", group: "Document", icon: <PencilSimple aria-hidden="true" />, keywords: "edit title", shortcut: ["G", "R"] },
  { id: "copy", label: "Copy link", group: "Document", icon: <Copy aria-hidden="true" />, keywords: "share url", shortcut: ["G", "C"] },
  { id: "favorite", label: "Add to favorites", group: "Document", icon: <Star aria-hidden="true" />, keywords: "save bookmark", shortcut: ["G", "F"] },
] as const;
type DemoCommand = (typeof commands)[number];

export function CommandPalettePlayground() {
  const [settings, setSettings] = useState(defaults);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const shortcutScope = useRef<HTMLDivElement>(null);
  const select = (command: { readonly label: string }) => setSelected(command.label);

  return <div ref={shortcutScope} className="contents">
    {commands.map(command => <CommandShortcut key={command.id} command={command} scope={shortcutScope} onSelect={select} />)}
    <PlaygroundControls sectionId="command-palette" title="Command palette" onReset={() => { setSettings(defaults); setSelected(undefined); }}>
      <FieldGroup>
        <Check label="Animate highlight" checked={settings.animateHighlight} onChange={animateHighlight => setSettings(s => ({ ...s, animateHighlight }))} />
        <Check label="Show icons" checked={settings.icons} onChange={icons => setSettings(s => ({ ...s, icons }))} />
        <Check label="Show shortcuts" checked={settings.shortcuts} onChange={shortcuts => setSettings(s => ({ ...s, shortcuts }))} />
      </FieldGroup>
      <Text as="p" variant="caption" className="mt-3">Pointer motion only. Keyboard navigation stays instant.</Text>
    </PlaygroundControls>
    <Card variant="default" aria-label="Command palette preview" role="group">
      <CardHeader><CardTitle as="h3" variant="label">Try a command</CardTitle></CardHeader>
      <CardContent>
        <Button iconOnly={false} loading={false} nativeButton type="button" shape="square" size="md" variant="outline" tone="neutral" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <MagnifyingGlass aria-hidden="true" /><ButtonLabel>Open example palette</ButtonLabel>
        </Button>
        <Text as="p" variant="caption" role="status" className="mt-4">{selected ? `Selected: ${selected}` : "Example commands report your selection here."}</Text>
      </CardContent>
    </Card>
    <CommandPalette open={open} onOpenChange={setOpen} title="Document commands" animateHighlight={settings.animateHighlight}
      items={commands.map(item => ({ ...item, icon: settings.icons ? item.icon : undefined }))} onSelect={select}
      renderTrailing={settings.shortcuts ? item => (
        <KbdGroup aria-label={`${item.shortcut[0]} then ${item.shortcut[1]}`}>
          {item.shortcut.map(key => <Kbd key={key}>{key}</Kbd>)}
        </KbdGroup>
      ) : undefined} />
  </div>;
}

function CommandShortcut({ command, scope, onSelect }: { command: DemoCommand; scope: RefObject<HTMLDivElement | null>; onSelect: (command: { readonly label: string }) => void }) {
  useShortcut(command.shortcut, () => onSelect(command), { scope });
  return null;
}
