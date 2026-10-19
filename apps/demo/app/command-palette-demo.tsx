"use client";

import { Section, Text } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { CommandExample, CommandPalettePlayground, commandPaletteCode } from "./command-palette-playground";

export function CommandPaletteDemo() {
  return <Section id="command-palette" className="border-t border-border py-12">
    <Text as="h2" variant="title">Command palette</Text>
    <Text as="p" variant="description" className="mt-3">Find an action, run it, and get back to work.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Commands & groups" description="Group related actions and keep unavailable commands visible. Selecting an action reports it here." code={`const commands = [
  { id: "rename", label: "Rename document", group: "Document", keywords: "edit title" },
  { id: "archive", label: "Archive document", group: "Workspace", disabled: true },
  { id: "settings", label: "Workspace settings", group: "Workspace", keywords: "preferences" },
];

${commandPaletteCode({ animateHighlight: false, shortcuts: false })}`}>
        <CommandExample label="Browse commands" title="Commands & groups" grouped />
      </CatalogExample>
      <CatalogExample title="Search & empty results" description="Search “bookmark” to find Add to favorites. Try an unmatched query, then clear it to restore the list." code={commandPaletteCode()}>
        <CommandExample label="Try searching" title="Search commands" />
      </CatalogExample>
      <CommandPalettePlayground />
    </div>
    <p className="mt-4 text-small text-muted-foreground">Keep focus in search: ↑/↓ selects a result and Enter runs it. Tab moves to the close button; Escape dismisses the palette and returns focus. G then R, C, or F runs the focused example’s action while its palette is closed. Actions are simulated.</p>
  </Section>;
}
