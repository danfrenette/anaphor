"use client";

import { CardCopyButton } from "@anaphor/system";

const examples: Record<string, { title: string; item: string; code: string }> = {
  skeleton: { title: "Skeleton", item: "skeleton", code: `import { SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

<SkeletonRegion isLoading={isLoading} variant="pulse" label="Loading article">
  <h2><SkeletonText>{title ?? "Representative title"}</SkeletonText></h2>
</SkeletonRegion>` },
  tooltip: { title: "Tooltip", item: "tooltip", code: `import { TooltipGroup, Tooltip, TooltipTrigger, TooltipPopup } from "@/components/ui/tooltip";

<TooltipGroup delay={400} closeDelay={80} timeout={400}>
  <Tooltip>
    <TooltipTrigger>Settings</TooltipTrigger>
    <TooltipPopup side="top" align="center" sideOffset={8}>
      Configure visible columns
    </TooltipPopup>
  </Tooltip>
  <Tooltip>
    <TooltipTrigger>Filters</TooltipTrigger>
    <TooltipPopup side="top" align="center" sideOffset={8}>
      Narrow the results
    </TooltipPopup>
  </Tooltip>
</TooltipGroup>` },
  button: { title: "Button", item: "button", code: `import { Button, ButtonLabel } from "@/components/ui/button";

<Button
  variant="solid" tone="accent"
  size="md" shape="square"
  nativeButton type="button"
  iconOnly={false} loading={false}
>
  <ButtonLabel>Continue</ButtonLabel>
</Button>` },
  card: { title: "Card", item: "card", code: `import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";

<Card variant="default">
  <CardHeader>
    <CardTitle as="h2" variant="heading">
      Room to think
    </CardTitle>
  </CardHeader>
  <CardContent>Your content here.</CardContent>
</Card>` },
  badge: { title: "Badge", item: "badge", code: `import { Badge } from "@/components/ui/badge";

<Badge variant="soft" size="md" shape="round">
  Published
</Badge>` },
  input: { title: "Input", item: "input", code: `import { Input } from "@/components/ui/input";

<label>
  Project name
  <Input size="md" placeholder="Untitled" />
</label>` },
  checkbox: { title: "Checkbox", item: "checkbox", code: `import { Checkbox } from "@/components/ui/checkbox";

<label>
  <Checkbox defaultChecked />
  Include a plain-text version
</label>` },
  kbd: { title: "Kbd", item: "kbd", code: `import { Kbd, KbdGroup } from "@/components/ui/kbd";

<KbdGroup aria-label="Command K">
  <Kbd>⌘</Kbd><Kbd>K</Kbd>
</KbdGroup>` },
  tabs: { title: "Tabs", item: "tabs", code: `import {
  Tabs, TabsList, TabsTab, TabsPanel,
} from "@/components/ui/tabs";

<Tabs defaultValue="library">
  <TabsList aria-label="Collection">
    <TabsTab value="library">Library</TabsTab>
    <TabsTab value="recent">Recent</TabsTab>
  </TabsList>
  <TabsPanel value="library">Saved work</TabsPanel>
  <TabsPanel value="recent">Recent work</TabsPanel>
</Tabs>` },
  popover: { title: "Popover", item: "popover", code: `import {
  Popover, PopoverTrigger, PopoverPopup,
  PopoverBody, PopoverTitle,
  PopoverDescription, PopoverClose,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger>Preferences</PopoverTrigger>
  <PopoverPopup side="bottom" align="start" sideOffset={8}>
    <PopoverBody>
      <PopoverTitle>Preferences</PopoverTitle>
      <PopoverDescription>
        Changes apply immediately.
      </PopoverDescription>
      {/* Add fields and controls here. */}
      <PopoverClose>Done</PopoverClose>
    </PopoverBody>
  </PopoverPopup>
</Popover>` },
  "dropdown-menu": { title: "Menu", item: "menu", code: `import {
  Menu, MenuTrigger, MenuPopup, MenuItem,
} from "@/components/ui/menu";

<Menu>
  <MenuTrigger>Actions</MenuTrigger>
  <MenuPopup side="bottom" sideOffset={8} align="start">
    <MenuItem variant="default" onClick={() => alert("Copied")}>
      Copy link
    </MenuItem>
  </MenuPopup>
</Menu>` },
  "command-palette": { title: "Command palette", item: "command-palette", code: `import { useState } from "react";
import { CommandPalette } from
  "@/components/ui/command-palette";

function Example() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Search</button>
    <CommandPalette
      open={open} onOpenChange={setOpen}
      title="Search"
      items={[{ id: "home", label: "Home" }]}
      onSelect={item => console.log(item.id)}
    />
  </>;
}` },
};

const setup = `import {
  ThemeProvider, ThemeToggle,
} from "@/components/ui/theme";

// Add suppressHydrationWarning to your <html>.
<ThemeProvider>
  <ThemeToggle />
  {children}
</ThemeProvider>`;

export function codeTitle(sectionId?: string) {
  return sectionId === "data-table" ? "Data table exploration" : sectionId === "slider" ? "Slider code" : sectionId && examples[sectionId] ? `${examples[sectionId].title} code` : "Install Anaphor";
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return <figure className="min-w-0 overflow-hidden rounded-card border border-border bg-background">
    <figcaption className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-3 text-label text-muted-foreground">
      {title}<CardCopyButton value={code} aria-label={`Copy ${title}`} className="size-11" />
    </figcaption>
    <pre tabIndex={0} aria-label={title} className="max-h-[30dvh] overflow-auto overscroll-x-contain p-3 font-mono text-small leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"><code>{code}</code></pre>
  </figure>;
}

export function ComponentCode({ sectionId }: { sectionId?: string }) {
  if (sectionId === "data-table") return <p className="text-ui text-muted-foreground">This table is a visual exploration. A reusable component and installation example will follow once the design is settled.</p>;
  if (sectionId === "slider") return <div className="grid gap-3">
    <p className="text-small text-muted-foreground">Anaphor’s slider is adapted from DialKit, with optional magnetic snapping. Its source and styles are installed into your project.</p>
    <CodeBlock title="Install" code="pnpm dlx shadcn@latest add danfrenette/anaphor/slider" />
    <CodeBlock title="Usage" code={`import { Slider } from "@/components/ui/slider";

<Slider
  label="Amount" value={value} onChange={setValue}
  min={0} max={100} step={10}
  snap="magnetic" releaseThreshold={0.6}
/>`} />
  </div>;
  const example = sectionId ? examples[sectionId] : undefined;
  return <div className="grid min-w-0 gap-3">
    <p className="text-small text-muted-foreground">{example ? "A minimal example. Scroll longer lines horizontally or copy the full snippet." : "Start with a shadcn-initialized Tailwind v4 app. This private registry requires GitHub authentication."}</p>
    <CodeBlock title="Install" code={`pnpm dlx shadcn@latest add danfrenette/anaphor/${example?.item ?? "ui"}`} />
    <CodeBlock title={example ? "Usage" : "Theme setup"} code={example?.code ?? setup} />
  </div>;
}
