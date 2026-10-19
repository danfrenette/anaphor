"use client";

import { Button, ButtonLabel, CommandPalette, FieldGroup, Kbd, KbdGroup, Text, useShortcut } from "@anaphor/system";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useRef, useState, type RefObject } from "react";
import { PlaygroundControls } from "./playground-host";
import { CatalogExample } from "./catalog-example";
import { Check } from "./playground-fields";

const defaults = { animateHighlight: false, shortcuts: true };
const commands = [
  { id: "rename", label: "Rename document", group: "Document", keywords: "edit title", shortcut: ["G", "R"] },
  { id: "copy", label: "Copy link", group: "Document", keywords: "share url", shortcut: ["G", "C"] },
  { id: "favorite", label: "Add to favorites", group: "Document", keywords: "save bookmark", shortcut: ["G", "F"] },
] as const;
type DemoCommand = (typeof commands)[number];

export function CommandPalettePlayground() {
  const [settings, setSettings] = useState(defaults);
  const [revision, setRevision] = useState(0);
  return <>
    <PlaygroundControls sectionId="command-palette" title="Command palette" onReset={() => { setSettings(defaults); setRevision(value => value + 1); }}>
      <FieldGroup>
        <Check label="Animate highlight" checked={settings.animateHighlight} onChange={animateHighlight => setSettings(s => ({ ...s, animateHighlight }))} />
        <Check label="Show shortcuts" checked={settings.shortcuts} onChange={shortcuts => setSettings(s => ({ ...s, shortcuts }))} />
      </FieldGroup>
      <Text as="p" variant="caption" className="mt-3">Pointer motion only. Keyboard navigation stays instant.</Text>
    </PlaygroundControls>
    <CatalogExample title="Playground" description="Use Controls to compare shortcut hints and optional pointer highlight motion." code={commandPaletteCode(settings)}>
      <CommandExample key={revision} settings={settings} />
    </CatalogExample>
  </>;
}

type ExampleCommand = { id: string; label: string; group: string; keywords?: string; shortcut?: readonly string[]; disabled?: boolean };
const groupedCommands: readonly ExampleCommand[] = [
  ...commands,
  { id: "archive", label: "Archive document", group: "Workspace", keywords: "store", disabled: true },
  { id: "settings", label: "Workspace settings", group: "Workspace", keywords: "preferences" },
];

export function CommandExample({ label = "Open example palette", title = "Document commands", settings = defaults, grouped = false }: { label?: string; title?: string; settings?: typeof defaults; grouped?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const shortcutScope = useRef<HTMLDivElement>(null);
  const select = (command: { readonly label: string }) => setSelected(command.label);
  const items: readonly ExampleCommand[] = grouped ? groupedCommands : commands;
  return <div ref={shortcutScope}>
    {commands.map(command => <CommandShortcut key={command.id} command={command} scope={shortcutScope} onSelect={select} />)}
    <div aria-label={label + " preview"} role="group" className="grid min-h-48 place-content-center justify-items-center">
        <Button iconOnly={false} loading={false} nativeButton type="button" shape="square" size="md" variant="outline" tone="neutral" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <MagnifyingGlass aria-hidden="true" /><ButtonLabel>{label}</ButtonLabel>
        </Button>
        <Text as="p" variant="caption" role="status" className="mt-4">{selected ? `Selected: ${selected}` : "Example commands report your selection here."}</Text>
    </div>
    <CommandPalette open={open} onOpenChange={setOpen} title={title} animateHighlight={settings.animateHighlight}
      items={items} onSelect={select}
      renderTrailing={settings.shortcuts ? item => item.shortcut && (
        <KbdGroup role="img" aria-label={`${item.shortcut[0]} then ${item.shortcut[1]}`}>
          {item.shortcut.map(key => <Kbd key={key}>{key}</Kbd>)}
        </KbdGroup>
      ) : undefined} />
  </div>;
}

export function commandPaletteCode(settings = defaults) {
  return `<CommandPalette
  open={open}
  onOpenChange={setOpen}
  title="Document commands"
  animateHighlight={${settings.animateHighlight}}
  items={commands}
  onSelect={item => setSelected(item.label)}${settings.shortcuts ? `
  renderTrailing={item => item.shortcut && <KbdGroup>
    {item.shortcut.map(key => <Kbd key={key}>{key}</Kbd>)}
  </KbdGroup>}` : ""}
/>`;
}

function CommandShortcut({ command, scope, onSelect }: { command: DemoCommand; scope: RefObject<HTMLDivElement | null>; onSelect: (command: { readonly label: string }) => void }) {
  useShortcut(command.shortcut, () => onSelect(command), { scope });
  return null;
}
