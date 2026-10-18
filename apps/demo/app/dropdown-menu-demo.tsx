"use client";

import { Button, ButtonLabel, Menu, MenuTrigger, MenuPopup, MenuRadioGroup, MenuRadioItem, Section, Text } from "@anaphor/system";
import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { DropdownMenuExample } from "./dropdown-menu-example";
import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

function actionsCode(side: string, align: string, icons: boolean, shortcuts: boolean, disabled: boolean) {
  return `<Menu>
  <MenuTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}>File actions</MenuTrigger>
  <MenuPopup side="${side}" align="${align}" sideOffset={6}>
    <MenuGroup>
      <MenuGroupLabel>Document</MenuGroupLabel>
      <MenuItem variant="default" onClick={() => setLastAction("Rename selected")}>${icons ? '<PencilSimple aria-hidden="true" />' : ""}Rename${shortcuts ? '<MenuShortcut>R</MenuShortcut>' : ""}</MenuItem>
      <MenuItem variant="default" onClick={() => setLastAction("Move selected")}>${icons ? '<FolderSimple aria-hidden="true" />' : ""}Move to…</MenuItem>
      <MenuItem variant="default"${disabled ? ' disabled' : ''} onClick={() => setLastAction("Share selected")}>${icons ? '<ShareNetwork aria-hidden="true" />' : ""}Share</MenuItem>
    </MenuGroup>
    <MenuSeparator />
    <MenuItem variant="destructive" onClick={() => setLastAction("Delete selected")}>${icons ? '<Trash aria-hidden="true" />' : ""}Delete${shortcuts ? '<MenuShortcut>⌘⌫</MenuShortcut>' : ""}</MenuItem>
  </MenuPopup>
</Menu>`;
}

export function DropdownMenuDemo() {
  const [sort, setSort] = useState("Name");
  const [side, setSide] = useState<"bottom" | "top" | "left" | "right">("bottom");
  const [align, setAlign] = useState<"start" | "center" | "end">("start");
  const [icons, setIcons] = useState(true);
  const [shortcuts, setShortcuts] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [revision, setRevision] = useState(0);
  return <Section id="dropdown-menu" className="border-t border-border py-12">
    <Text as="h2" variant="title">Dropdown menu</Text>
    <Text as="p" variant="description" className="mt-3">Keep a short list of actions close to the work.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Actions & states" description="Group related actions, keep unavailable items visible, and reserve the destructive treatment for Delete." code={actionsCode("bottom", "start", true, true, true)}>
        <DropdownMenuExample label="Document actions" disableShare />
      </CatalogExample>
      <CatalogExample title="Selection" description="Radio items keep one option selected. The trigger reflects the current choice." code={'const [sort, setSort] = useState("Name");\n\n<Menu>\n  <MenuTrigger>Sort: {sort}</MenuTrigger>\n  <MenuPopup side="bottom" align="start" sideOffset={6}>\n    <MenuRadioGroup value={sort} onValueChange={setSort}>\n      <MenuRadioItem value="Name">Name</MenuRadioItem>\n      <MenuRadioItem value="Updated">Updated</MenuRadioItem>\n      <MenuRadioItem value="Created">Created</MenuRadioItem>\n    </MenuRadioGroup>\n  </MenuPopup>\n</Menu>'}>
        <div className="grid min-h-40 place-items-center"><Menu><MenuTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}><ButtonLabel>Sort: {sort}</ButtonLabel><CaretDown aria-hidden="true" /></MenuTrigger><MenuPopup side="bottom" align="start" sideOffset={6}><MenuRadioGroup value={sort} onValueChange={setSort}>{["Name", "Updated", "Created"].map(value => <MenuRadioItem key={value} value={value}>{value}</MenuRadioItem>)}</MenuRadioGroup></MenuPopup></Menu></div>
      </CatalogExample>
      <PlaygroundControls sectionId="dropdown-menu" title="Dropdown menu" onReset={() => { setSide("bottom"); setAlign("start"); setIcons(true); setShortcuts(true); setDisabled(false); setRevision(value => value + 1); }}>
        <div className="grid grid-cols-2 gap-4"><Select label="Placement" value={side} options={["bottom", "top", "left", "right"]} onChange={setSide} /><Select label="Alignment" value={align} options={["start", "center", "end"]} onChange={setAlign} /><Check label="Icons" checked={icons} onChange={setIcons} /><Check label="Shortcut hints" checked={shortcuts} onChange={setShortcuts} /><Check label="Disable Share" checked={disabled} onChange={setDisabled} /></div>
        <p className="mt-3 text-small text-muted-foreground">Placement is preferred; the popup can flip near a viewport edge.</p>
      </PlaygroundControls>
      <CatalogExample title="Playground" description="Use Controls to configure File actions, then select an item to see feedback." code={actionsCode(side, align, icons, shortcuts, disabled)}>
        <DropdownMenuExample key={revision} side={side} align={align} icons={icons} shortcuts={shortcuts} disableShare={disabled} />
      </CatalogExample>
    </div>
    <p className="mt-4 text-small text-muted-foreground">Actions are simulated. Shortcut hints are labels; applications register the shortcuts.</p>
  </Section>;
}
