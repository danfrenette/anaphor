"use client";

import { Section, Text } from "@anaphor/system";
import { useSidebarPlacement } from "./demo-shell";

const placements = ["left", "right"] as const;

export function SidebarDemo() {
  const { placement, setPlacement } = useSidebarPlacement();
  return <Section id="sidebar" className="border-t border-border py-12">
    <p className="text-label tracking-[0.08em] uppercase">02.00 / Layout</p>
    <Text as="h2" variant="heading" className="mt-3">Sidebar</Text>
    <Text as="p" variant="description" className="mt-3">
      Place the manual navigation on either edge. The reading area keeps its measure as the panel opens and closes.
    </Text>
    <p className="mt-3 text-small text-muted-foreground">The workspace shell preview above shows how a separate context panel can sit on the other side when an app needs one.</p>

    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <div role="group" aria-label="Sidebar placement" className="inline-flex rounded-xl bg-muted p-1 shadow-[var(--anaphor-shadow-card)]">
        {placements.map(option => <button
          key={option}
          type="button"
          aria-pressed={placement === option}
          onClick={() => setPlacement(option)}
          className="min-h-11 min-w-16 rounded-lg px-4 text-ui font-medium capitalize text-muted-foreground transition-[color,background-color,box-shadow,transform] duration-150 ease-[var(--anaphor-ease-out)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.96] aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-[var(--anaphor-shadow-card)]"
        >{option}</button>)}
      </div>
      <p className="text-small text-muted-foreground">This changes the page layout. Use the header button to open or close it.</p>
    </div>

    <div className="mt-6 rounded-xl bg-muted p-2 shadow-[var(--anaphor-shadow-card)]">
      <div className="flex h-44 overflow-hidden rounded-lg bg-background shadow-[var(--anaphor-shadow-card)]" aria-hidden="true">
        {placement !== "right" && <div className="flex w-[22%] min-w-20 flex-col gap-2 border-e border-border bg-muted p-4">
          <span className="h-2 w-14 rounded-full bg-foreground/40" /><span className="mt-3 h-2 w-full rounded-full bg-foreground/15" /><span className="h-2 w-3/4 rounded-full bg-foreground/15" /><span className="h-2 w-5/6 rounded-full bg-foreground/15" />
        </div>}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <span className="text-label text-muted-foreground">Core content</span>
          <span className="h-2 w-full max-w-48 rounded-full bg-foreground/25" />
          <span className="h-2 w-3/4 max-w-36 rounded-full bg-foreground/15" />
        </div>
        {placement !== "left" && <div className="flex w-[22%] min-w-20 flex-col gap-2 border-s border-border bg-muted p-4">
          <span className="h-2 w-14 rounded-full bg-foreground/40" /><span className="mt-3 h-2 w-full rounded-full bg-foreground/15" /><span className="h-2 w-3/4 rounded-full bg-foreground/15" /><span className="h-2 w-5/6 rounded-full bg-foreground/15" />
        </div>}
      </div>
    </div>
    <p role="status" className="mt-3 text-small text-muted-foreground">
      {`Navigation on the ${placement}.`}
    </p>
  </Section>;
}
