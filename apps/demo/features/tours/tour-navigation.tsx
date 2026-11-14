"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { Menu, MenuItem, MenuPopup, MenuTrigger, Text, useContentSections } from "@anaphor/system";
import type { TourDocument } from "./document";

export function TourNavigation({ sections, concernIds }: { sections: readonly TourDocument["sections"][number][]; concernIds: string[] }) {
  const { activeId } = useContentSections();
  const selected: TourDocument["sections"][number] | undefined = sections.find(section => activeId === `tour-section:${section.id}`) ?? sections[0];
  const review = reviewFor(selected);
  const subsections = selected ? [
    { id: `tour-section:${selected.id}`, label: "Behavior" },
    ...(review?.steps.map((step, index) => ({ id: `tour-step:${selected.id}:${step.id}`, label: `${index + 1}. ${step.title}` })) ?? []),
    ...("evidenceIds" in selected ? [{ id: `tour-verification:${selected.id}`, label: "Verification" }] : []),
    ...(concernIds.includes(selected.id) ? [{ id: `tour-concerns:${selected.id}`, label: "Open concerns" }] : []),
  ] : [];
  const linkStyle = "flex min-h-11 items-center rounded-md px-3 py-2 text-ui font-normal hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring [overflow-wrap:anywhere]";
  return <aside className="sticky top-0 z-[var(--anaphor-z-navigation)] bg-background lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
    <nav aria-label="Tour navigation" className="hidden space-y-3 lg:block">
      <a href="#tour-contents" className={linkStyle}>All business cases</a>
      <ol className="space-y-2">{sections.map((section, index) => <li key={section.id}>
        <a href={`#tour-section:${section.id}`} aria-current={section === selected ? "location" : undefined}
          className={`${linkStyle} gap-3 ${section === selected ? "bg-muted" : ""}`}>
          <span className="w-5 shrink-0 font-mono text-small text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          {section.title}
        </a>
        {section === selected && <ol className="ms-8 mt-1 border-s border-border ps-2">
          {subsections.map(item => <li key={item.id}><a className={linkStyle} href={`#${item.id}`}>{item.label}</a></li>)}
        </ol>}
      </li>)}</ol>
      <a href="#merge-concerns" className={linkStyle}>Merge assessment</a>
    </nav>
    <nav aria-label="Narrow tour navigation" className="flex flex-wrap gap-2 border-y border-border py-3 lg:hidden">
      <NavigationMenu label="Choose business case" current={selected?.title ?? "Business cases"}
        items={[{ id: "tour-contents", label: "All business cases" }, ...sections.map((section, index) => ({ id: `tour-section:${section.id}`, label: `${String(index + 1).padStart(2, "0")} · ${section.title}` })), { id: "merge-concerns", label: "Merge assessment" }]} />
      <NavigationMenu label="Choose case subsection" current="In this case" items={subsections} />
    </nav>
  </aside>;
}

function reviewFor(section: TourDocument["sections"][number] | undefined) {
  return section && "review" in section ? section.review : undefined;
}

function NavigationMenu({ label, current, items }: { label: string; current: string; items: { id: string; label: string }[] }) {
  return <Menu>
    <MenuTrigger aria-label={label} className="flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-control border border-input-border px-3 text-ui focus-visible:outline-2 focus-visible:outline-ring">
      <Text as="span" variant="ui" className="truncate">{current}</Text><CaretDownIcon size={16} className="shrink-0" aria-hidden="true" />
    </MenuTrigger>
    <MenuPopup align="start" side="bottom" sideOffset={8} className="max-w-[calc(100vw-3rem)]">
      {items.map(item => <MenuItem key={item.id} variant="default" nativeButton={false} render={<a href={`#${item.id}`} />} className="min-h-11 whitespace-normal">{item.label}</MenuItem>)}
    </MenuPopup>
  </Menu>;
}
