import { render, screen } from "@testing-library/react";
import {
  BottomBar,
  Sidebar,
  SidebarInset,
  SidebarProvider,
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
  WorkspaceShell,
  WorkspaceTopBar,
} from "@anaphor/system";
import { expect, test } from "vitest";

for (let regions = 0; regions < 16; regions += 1) {
  test(`workspace shell composes optional regions ${regions.toString(2).padStart(4, "0")}`, () => {
    const top = Boolean(regions & 1);
    const left = Boolean(regions & 2);
    const right = Boolean(regions & 4);
    const bottom = Boolean(regions & 8);
    const content = (
      <WorkspaceCard>
        <WorkspaceCardHeader>Page heading</WorkspaceCardHeader>
        <WorkspaceCardBody><main>Page content</main></WorkspaceCardBody>
      </WorkspaceCard>
    );
    const center = left || right ? (
      <SidebarProvider mode="uncontrolled" defaultOpen shortcut={null} resizable={false} side={left && right ? "both" : left ? "left" : "right"} layout="workspace">
        {left && <Sidebar side="left" aria-label="Navigation" />}
        <SidebarInset>{content}</SidebarInset>
        {right && <Sidebar side="right" aria-label="Context" />}
      </SidebarProvider>
    ) : content;

    const { container } = render(
      <WorkspaceShell>
        {top && <WorkspaceTopBar>Custom tabs</WorkspaceTopBar>}
        {center}
        {bottom && <BottomBar aria-label="Utilities">Help</BottomBar>}
      </WorkspaceShell>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Page content");
    expect(container.querySelectorAll('[data-slot="workspace-card"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="workspace-top-bar"]')).toHaveLength(Number(top));
    expect(Boolean(screen.queryByRole("complementary", { name: "Navigation" }))).toBe(left);
    expect(Boolean(screen.queryByRole("complementary", { name: "Context" }))).toBe(right);
    expect(Boolean(screen.queryByRole("contentinfo", { name: "Utilities" }))).toBe(bottom);
  });
}
