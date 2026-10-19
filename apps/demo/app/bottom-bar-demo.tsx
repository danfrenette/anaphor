"use client";

import { useState } from "react";
import { BottomBar, BottomBarAction, BottomBarGroup, BottomBarStatus, CommandPalette, FieldGroup, Section, Text } from "@anaphor/system";
import { MagnifyingGlass, Question } from "@phosphor-icons/react";
import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

const defaults = { appearance: "integrated" as const, status: true, labels: true };
type Settings = { appearance: "standalone" | "integrated"; status: boolean; labels: boolean };
const commands = [
  { id: "notes", label: "Open notes", group: "Workspace" },
  { id: "references", label: "Find references", group: "Workspace" },
];

function BottomBarPreview({ label, settings = defaults }: { label: string; settings?: Settings }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [message, setMessage] = useState("Your work stays in view above the utilities.");
  return <div role="group" aria-label={label} className="@container min-w-0 rounded-md border border-border bg-muted">
    <div className="m-2 grid min-h-40 content-start gap-2 rounded-sm bg-background p-4">
      <Text as="h4" variant="ui">Workspace</Text>
      <Text as="p" variant="caption" role="status">{message}</Text>
    </div>
    <BottomBar appearance={settings.appearance} aria-label={label + " utilities"} className="rounded-b-md">
      <BottomBarGroup className="flex-1">
        <BottomBarAction aria-label="Help" onClick={() => setMessage("Search opens workspace commands. Utilities stay available below your work.")}>
          <Question aria-hidden="true" />{settings.labels && <span className="hidden @sm:inline">Help</span>}
        </BottomBarAction>
        {settings.status && <BottomBarStatus>All changes saved</BottomBarStatus>}
      </BottomBarGroup>
      <BottomBarGroup className="shrink-0">
        <BottomBarAction aria-label="Search workspace" aria-haspopup="dialog" onClick={event => { event.currentTarget.focus(); setSearchOpen(true); }}>
          <MagnifyingGlass aria-hidden="true" />{settings.labels && <span className="hidden @sm:inline">Search</span>}
        </BottomBarAction>
      </BottomBarGroup>
    </BottomBar>
    <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} title={label + " commands"} items={commands} animateHighlight={false} onSelect={item => setMessage("Selected: " + item.label)} />
  </div>;
}

function bottomBarCode(settings: Settings = defaults) {
  return `<BottomBar appearance="${settings.appearance}" aria-label="Workspace utilities">
  <BottomBarGroup className="flex-1">
    <BottomBarAction aria-label="Help" onClick={showHelp}>
      <Question aria-hidden="true" />${settings.labels ? '<span className="hidden @sm:inline">Help</span>' : ""}
    </BottomBarAction>${settings.status ? "\n    <BottomBarStatus>All changes saved</BottomBarStatus>" : ""}
  </BottomBarGroup>
  <BottomBarGroup className="shrink-0">
    <BottomBarAction aria-label="Search workspace" aria-haspopup="dialog" onClick={event => { event.currentTarget.focus(); setSearchOpen(true); }}>
      <MagnifyingGlass aria-hidden="true" />${settings.labels ? '<span className="hidden @sm:inline">Search</span>' : ""}
    </BottomBarAction>
  </BottomBarGroup>
</BottomBar>`;
}

export function BottomBarDemo() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [revision, setRevision] = useState(0);
  return <Section id="bottom-bar" className="border-t border-border py-12">
    <PlaygroundControls sectionId="bottom-bar" title="Bottom bar" onReset={() => { setSettings(defaults); setRevision(value => value + 1); }}>
      <FieldGroup>
        <Select label="Appearance" value={settings.appearance} options={["standalone", "integrated"]} onChange={appearance => setSettings(s => ({ ...s, appearance }))} />
        <Check label="Show status" checked={settings.status} onChange={status => setSettings(s => ({ ...s, status }))} />
        <Check label="Show action labels" checked={settings.labels} onChange={labels => setSettings(s => ({ ...s, labels }))} />
      </FieldGroup>
    </PlaygroundControls>
    <Text as="h2" variant="title">Bottom bar</Text>
    <Text as="p" variant="description" className="mt-3">A quiet place for persistent utilities and short status messages.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Anatomy" description="Utilities and status sit at the start; supporting actions sit at the end. The work stays above them." code={bottomBarCode()} framed={false}>
        <BottomBarPreview label="Bottom bar anatomy" />
      </CatalogExample>
      <CatalogExample title="Appearances" description="Standalone adds a surface and top divider. Integrated joins the surrounding workspace canvas." code={'<BottomBar appearance="standalone">…</BottomBar>\n<BottomBar appearance="integrated">…</BottomBar>'} framed={false}>
        <div className="grid gap-6">
          {(["standalone", "integrated"] as const).map(appearance => <div key={appearance}>
            <h4 className="mb-3 font-sans text-ui font-medium normal-case text-muted-foreground">{appearance === "standalone" ? "Standalone" : "Integrated"}</h4>
            <BottomBarPreview label={appearance + " bottom bar"} settings={{ ...defaults, appearance }} />
          </div>)}
        </div>
      </CatalogExample>
      <CatalogExample title="Playground" description="Use Controls to change appearance, status, and action labels. Try Help or Search; feedback stays in this example." code={bottomBarCode(settings)} framed={false}>
        <BottomBarPreview key={revision} label="Bottom bar playground" settings={settings} />
      </CatalogExample>
    </div>
    <p className="mt-4 text-small text-muted-foreground">The manual’s bottom bar is also a live example. Narrow previews hide action labels and truncate status while keeping accessible names and controls available.</p>
  </Section>;
}
