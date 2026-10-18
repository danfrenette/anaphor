"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowDown, ArrowUp, ArrowElbowDownLeft, MagnifyingGlass, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button, ButtonLabel } from "./button";
import { Text } from "./text";
import { Kbd } from "./kbd";
import { fluidHoverTravel } from "../lib/motion";
import { cn } from "../lib/utils";

const highlightStyles = cn(
  // Layout
  "pointer-events-none absolute inset-x-2 top-0 rounded-md",
  // Surface
  "bg-[color-mix(in_oklch,var(--anaphor-brand)_14%,var(--anaphor-foreground))]",
);

const itemStyles = cn(
  // Layout
  "relative flex min-h-10 cursor-default items-center gap-3 rounded-md px-3 py-2 outline-none",
  // State and coarse-pointer target
  "data-disabled:text-muted-foreground pointer-coarse:min-h-11",
  // Icon treatment
  "[&>svg]:size-4 [&>svg]:shrink-0",
);

export type CommandPaletteItem = {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  keywords?: string;
  disabled?: boolean;
};

export type CommandPaletteProps<Item extends CommandPaletteItem> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: readonly Item[];
  onSelect: (item: Item) => void;
  title: string;
  placeholder?: string;
  /** Render compact, non-interactive presentation at the inline end of each item. */
  renderTrailing?: (item: Item) => ReactNode;
  /** Animate pointer highlight travel. Keyboard navigation always stays instant. */
  animateHighlight?: boolean;
};

/** A controlled launcher. The consumer owns commands and their effects. */
export function CommandPalette<Item extends CommandPaletteItem>({ open, onOpenChange, ...props }: CommandPaletteProps<Item>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal className="fixed inset-0 isolate z-[var(--anaphor-z-overlay)]">
        <Dialog.Backdrop forceRender className="command-backdrop fixed inset-0 z-[var(--anaphor-z-backdrop)] bg-[oklch(0_0_0/0.24)]" />
        <PaletteContent {...props} onOpenChange={onOpenChange} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteContent<Item extends CommandPaletteItem>({ items, onSelect, title, placeholder = "Search commands…", renderTrailing, animateHighlight = false, onOpenChange }: Omit<CommandPaletteProps<Item>, "open">) {
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Item>();
  const [activeFromFinePointer, setActiveFromFinePointer] = useState(false);
  const [highlight, setHighlight] = useState<{ top: number; height: number }>();
  const reducedMotion = useReducedMotion();
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = items.filter(item => `${item.label} ${item.group} ${item.keywords ?? ""}`.toLocaleLowerCase().includes(normalized));
  const groups = [...new Set(filtered.map(item => item.group))];

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const element = [...list.querySelectorAll<HTMLElement>('[data-command-id]')].find(element => element.dataset.commandId === active?.id);
      if (!element) { setHighlight(undefined); return; }
      setHighlight({ top: element.offsetTop, height: element.offsetHeight });
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, query]);

  return (
    <Dialog.Popup ref={popupRef} initialFocus={() => window.matchMedia("(pointer: coarse)").matches ? popupRef.current : inputRef.current} data-slot="command-palette"
      className={cn(
        // Position and layout
        "command-palette fixed inset-x-4 top-[min(18vh,8rem)] z-[var(--anaphor-z-overlay)] mx-auto",
        "flex max-h-[min(36rem,75dvh)] max-w-xl flex-col overflow-hidden rounded-card",
        // Surface and accessibility
        "bg-muted text-foreground shadow-card outline-none",
      )}
      onKeyDownCapture={() => setActiveFromFinePointer(false)}>
      <Dialog.Title render={<Text as="h2" variant="subheading" />} className="px-4 pt-4">{title}</Dialog.Title>
      <Dialog.Description className="sr-only">Type to filter commands. Use the arrow keys to navigate and Enter to open.</Dialog.Description>
      <Autocomplete.Root items={filtered} filter={null} inline open autoHighlight="always" keepHighlight
        value={query} onValueChange={setQuery} itemToStringValue={(item: Item) => item.label}
        onItemHighlighted={(item, details) => { setActive(item); setActiveFromFinePointer(details.reason === "pointer" && typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches); }}>
        <div className={cn(
          // Layout and surface
          "relative m-3 flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-border bg-background pe-2",
          // Accessibility
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
        )}>
          <MagnifyingGlass className="pointer-events-none absolute start-3 size-4 text-muted-foreground" aria-hidden="true" />
          <Autocomplete.Input ref={inputRef} aria-label={title} placeholder={placeholder} autoComplete="off" spellCheck={false} className={cn(
            // Layout
            "min-w-0 flex-1 bg-transparent py-3 ps-9 outline-none",
            // Typography
            "font-sans text-body text-foreground placeholder:text-muted-foreground",
          )} />
          <Dialog.Close render={<Button iconOnly loading={false} nativeButton type="button" shape="square" size="md" variant="ghost" tone="neutral" aria-label="Close command palette" />}><X aria-hidden="true" /></Dialog.Close>
        </div>
        <div className="flex h-80 min-h-0 flex-col">
          <Autocomplete.Empty render={<Text as="p" variant="caption" />} className="grid flex-1 place-content-center px-4 text-center empty:hidden" >No commands found. Try another search.</Autocomplete.Empty>
          <Autocomplete.List ref={listRef} className="relative min-h-0 overflow-y-auto overscroll-contain px-2 pb-2" aria-label="Commands">
            {highlight && (animateHighlight && activeFromFinePointer && !reducedMotion ? (
              <motion.div key={active?.group} aria-hidden="true" data-slot="command-fluid-highlight" className={highlightStyles}
                initial={false} animate={{ transform: `translateY(${highlight.top}px)` }} style={{ height: highlight.height }} transition={fluidHoverTravel} />
            ) : (
              <div aria-hidden="true" data-slot="command-fluid-highlight" className={highlightStyles}
                style={{ height: highlight.height, transform: `translateY(${highlight.top}px)` }} />
            ))}
            {groups.map(group => (
              <Autocomplete.Group key={group}>
                <Autocomplete.GroupLabel render={<Text as="div" variant="ui" />} className="relative px-3 pt-3 pb-2 text-muted-foreground">{group}</Autocomplete.GroupLabel>
                {filtered.filter(item => item.group === group).map(item => {
                  const trailing = renderTrailing?.(item);
                  return (
                    <Autocomplete.Item key={item.id} value={item} disabled={item.disabled} data-command-id={item.id}
                      className={itemStyles}
                      onClick={() => { onOpenChange(false); onSelect(item); }}>
                      {item.icon}<Text as="span" variant="ui" className="min-w-0 flex-1 truncate">{item.label}</Text>
                      {trailing != null && <span data-slot="command-palette-trailing" className="pointer-events-none ms-auto flex shrink-0 items-center">{trailing}</span>}
                    </Autocomplete.Item>
                  );
                })}
              </Autocomplete.Group>
            ))}
          </Autocomplete.List>
        </div>
      </Autocomplete.Root>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t-[length:var(--anaphor-border-hairline)] border-border px-4 py-2">
        <Text as="span" variant="caption" className="flex items-center gap-1"><Kbd role="img" aria-label="Up arrow"><ArrowUp aria-hidden="true" /></Kbd><Kbd role="img" aria-label="Down arrow"><ArrowDown aria-hidden="true" /></Kbd> Navigate <Kbd role="img" aria-label="Enter" className="ms-2"><ArrowElbowDownLeft aria-hidden="true" /></Kbd> Open</Text>
        <Dialog.Close render={<Button iconOnly={false} loading={false} nativeButton type="button" shape="square" size="md" variant="ghost" tone="neutral" />}><ButtonLabel>Esc</ButtonLabel></Dialog.Close>
      </div>
    </Dialog.Popup>
  );
}
