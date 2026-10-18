"use client";

import { SidebarInsetContent, SidebarTrigger, useSidebar } from "@anaphor/system";
import { useSidebarPlacement } from "../../demo-shell";

// Keep full-viewport sidebar regression controls separate from the catalog playground.
export default function SidebarFixture() {
  const { placement, setPlacement } = useSidebarPlacement();
  const { desktopOpen, mobileOpen } = useSidebar();
  return <SidebarInsetContent className="mx-auto max-w-5xl px-8"><section id="sidebar">
    <h2>Sidebar</h2>
    <div role="group" aria-label="Sidebar placement">
      {(["left", "right"] as const).map(side => <button key={side} aria-pressed={placement === side} onClick={() => setPlacement(side)}>{side === "left" ? "Left" : "Right"}</button>)}
    </div>
    <SidebarTrigger target="desktop" className="hidden md:block" aria-label={`${desktopOpen ? "Collapse" : "Open"} sidebar in section`} />
    <SidebarTrigger target="mobile" className="md:hidden" aria-label={`${mobileOpen ? "Collapse" : "Open"} sidebar in section`} />
  </section></SidebarInsetContent>;
}
