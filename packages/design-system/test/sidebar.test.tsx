import { fireEvent, render, screen } from "@testing-library/react";
import {
  Sidebar,
  SidebarClose,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@anaphor/system";
import { beforeEach, expect, test, vi } from "vitest";

const mediaListeners = new Set<EventListenerOrEventListenerObject>();
let mediaMatches = false;

const mediaQuery = {
  get matches() { return mediaMatches; },
  media: "(max-width: 47.999rem)",
  onchange: null,
  addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { mediaListeners.add(listener); },
  removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { mediaListeners.delete(listener); },
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as MediaQueryList;

beforeEach(() => {
  mediaMatches = false;
  mediaListeners.clear();
  vi.stubGlobal("matchMedia", () => mediaQuery);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
});

function Example() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarClose />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive render={<a href="#button" />}>Button</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<a href="#card" />}>Card</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <SidebarTrigger target="mobile">Mobile navigation</SidebarTrigger>
      </SidebarInset>
    </SidebarProvider>
  );
}

test("marks the current destination independently from hover", () => {
  render(<Example />);

  const current = screen.getByRole("link", { name: "Button" });
  expect(current).toHaveAttribute("aria-current", "page");
  expect(current).toHaveAttribute("data-active");
  expect(document.querySelector('[data-slot="sidebar-menu-selection"]')).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Card" })).not.toHaveAttribute("aria-current");
});

test("supports desktop disclosure", () => {
  render(<Example />);

  const provider = document.querySelector('[data-slot="sidebar-provider"]');
  const desktopTrigger = screen.getByRole("button", { name: "Collapse sidebar" });
  fireEvent.click(desktopTrigger, { detail: 0 });
  expect(provider).toHaveAttribute("data-desktop-open", "false");
  expect(desktopTrigger).toHaveAttribute("aria-expanded", "false");
});

test("uses modal dialog behavior on mobile", () => {
  mediaMatches = true;
  render(<Example />);

  const provider = document.querySelector('[data-slot="sidebar-provider"]');
  const mobileTrigger = screen.getAllByRole("button", { name: "Open sidebar" })[0];
  if (!mobileTrigger) throw new Error("Expected a mobile sidebar trigger");
  mobileTrigger.focus();
  fireEvent.click(mobileTrigger, { detail: 0 });
  expect(provider).toHaveAttribute("data-mobile-open", "true");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }));
  expect(provider).toHaveAttribute("data-mobile-open", "false");
});

test("supports the conventional command shortcut", () => {
  render(<Example />);

  const provider = document.querySelector('[data-slot="sidebar-provider"]');
  fireEvent.keyDown(window, { key: "b", metaKey: true });
  expect(provider).toHaveAttribute("data-desktop-open", "false");
});
