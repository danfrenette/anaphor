import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@anaphor/system";
import { expect, test } from "vitest";

function ExampleTabs() {
  return (
    <Tabs defaultValue="library">
      <TabsList aria-label="Collection">
        <TabsTab value="library">Library</TabsTab>
        <TabsTab value="recents">Recents</TabsTab>
        <TabsTab value="disabled" disabled>Disabled</TabsTab>
      </TabsList>
      <TabsPanel value="library">Library content</TabsPanel>
      <TabsPanel value="recents">Recent content</TabsPanel>
      <TabsPanel value="disabled">Disabled content</TabsPanel>
    </Tabs>
  );
}

test("connects tabs to their panels and changes selection by pointer", async () => {
  const user = userEvent.setup();
  const { container } = render(<ExampleTabs />);
  const root = container.querySelector('[data-slot="tabs"]');
  const indicator = container.querySelector('[data-slot="tabs-indicator"]');

  expect(screen.getByRole("tab", { name: "Library" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Library content");
  expect(indicator).toHaveAttribute("aria-hidden", "true");

  await user.click(screen.getByRole("tab", { name: "Recents" }));
  expect(root).toHaveAttribute("data-tabs-input", "pointer");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Recent content");
});

test("keeps keyboard selection instant and prevents disabled activation", async () => {
  const user = userEvent.setup();
  const { container } = render(<ExampleTabs />);
  const root = container.querySelector('[data-slot="tabs"]');

  await user.tab();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveFocus();
  expect(screen.getByRole("tab", { name: "Library" })).toHaveAttribute("aria-selected", "true");
  expect(root).toHaveAttribute("data-tabs-input", "keyboard");

  await user.keyboard("{Enter}");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Disabled" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveAttribute("aria-selected", "true");
});
