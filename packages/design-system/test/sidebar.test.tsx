import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import {
  Sidebar,
  SidebarClose,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@anaphor/system";
import { beforeEach, expect, test, vi } from "vitest";

const mediaListeners = new Set<EventListenerOrEventListenerObject>();
let mediaMatches = false;

const mediaQuery: MediaQueryList = {
  get matches() { return mediaMatches; },
  media: "(max-width: 47.999rem)",
  onchange: null,
  addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { mediaListeners.add(listener); },
  removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { mediaListeners.delete(listener); },
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

beforeEach(() => {
  mediaMatches = false;
  mediaListeners.clear();
  vi.stubGlobal("matchMedia", () => mediaQuery);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

function Example() {
  return (
    <SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}>
      <Sidebar>
        <SidebarClose />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive render={<a href="#button" />}>Button</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={false} render={<a href="#card" />}>Card</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger target="desktop" />
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

test("reports controlled changes without changing the supplied open state", () => {
  const onOpenChange = vi.fn();
  const { container } = render(
    <SidebarProvider mode="controlled" open={true} onOpenChange={onOpenChange} shortcut={null} resizable={false}>
      <SidebarTrigger target="desktop" />
    </SidebarProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(container.firstElementChild).toHaveAttribute("data-desktop-open", "true");
});

test("keeps the resize rail opt-in and supports keyboard resizing", () => {
  const { container, rerender } = render(<SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}><Sidebar><SidebarRail /></Sidebar></SidebarProvider>);
  expect(screen.queryByRole("button", { name: "Adjust or collapse sidebar" })).not.toBeInTheDocument();

  rerender(<SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable><Sidebar><SidebarRail /></Sidebar></SidebarProvider>);
  const rail = screen.getByRole("button", { name: "Adjust or collapse sidebar" });
  fireEvent.keyDown(rail, { key: "ArrowRight" });
  expect(container.firstElementChild).toHaveStyle("--anaphor-sidebar-drag-width: 16px");
  fireEvent.click(rail, { detail: 0 });
  expect(container.firstElementChild).toHaveAttribute("data-desktop-open", "false");
});

test("uses each interaction's motion preference and allows consumers to cancel toggles", () => {
  const { container, rerender } = render(<SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}><SidebarTrigger target="desktop" /></SidebarProvider>);
  const trigger = screen.getByRole("button");
  fireEvent.click(trigger, { detail: 0 });
  expect(container.firstElementChild).toHaveAttribute("data-motion", "instant");
  fireEvent.click(trigger, { detail: 1 });
  expect(container.firstElementChild).toHaveAttribute("data-motion", "animate");
  expect(container.firstElementChild).toHaveAttribute("data-desktop-open", "true");

  rerender(<SidebarProvider mode="uncontrolled" defaultOpen={true} shortcut="b" resizable={false}><SidebarTrigger target="desktop" onClick={event => event.preventDefault()} /></SidebarProvider>);
  fireEvent.click(trigger);
  expect(container.firstElementChild).toHaveAttribute("data-desktop-open", "true");
});

test("tracks selection owned by a descendant without rerendering the menu", async () => {
  function Destination() {
    const [active, setActive] = useState(false);
    return <SidebarMenuItem><SidebarMenuButton isActive={active} onClick={() => setActive(true)}>Choose destination</SidebarMenuButton></SidebarMenuItem>;
  }
  const { container } = render(<SidebarMenu><Destination /></SidebarMenu>);
  expect(container.querySelector('[data-slot="sidebar-menu-selection"]')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Choose destination" }));
  await waitFor(() => expect(container.querySelector('[data-slot="sidebar-menu-selection"]')).toBeInTheDocument());
});
