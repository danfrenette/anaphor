import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@anaphor/system";
import { Fragment } from "react";
import { expect, test, vi } from "vitest";

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
  const indicator = container.querySelector('[data-slot="tabs-indicator"]');

  expect(screen.getByRole("tab", { name: "Library" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Library content");
  expect(indicator).toHaveAttribute("aria-hidden", "true");

  await user.click(screen.getByRole("tab", { name: "Recents" }));
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Recent content");
});

test("keeps a distinct active copy for tabs in keyed fragments and sibling lists", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  function Sources({ ids }: { ids: string[] }) {
    return (
      <Tabs defaultValue="b">
        <TabsList aria-label="Sources" variant="lifted">
          {ids.map(id => <Fragment key={id}>
            <TabsTab value={id}>Source {id}</TabsTab>
            <button type="button">Close {id}</button>
          </Fragment>)}
        </TabsList>
      </Tabs>
    );
  }
  const { container, rerender } = render(<Sources ids={["a", "b", "c"]} />);
  rerender(<Sources ids={["c", "a", "b"]} />);
  const copies = [...container.querySelectorAll('[data-slot="tabs-active-copy"]')].map(copy => copy.textContent);

  expect(copies).toEqual(["Source c", "Source a", "Source b"]);
  rerender(<Tabs defaultValue="a"><TabsList aria-label="Grouped">
    {["a", "b"].map(id => <TabsTab key={id} value={id}>Pinned {id}</TabsTab>)}
    {["a", "b"].map(id => <TabsTab key={id} value={`recent-${id}`}>Recent {id}</TabsTab>)}
  </TabsList></Tabs>);
  expect(consoleError.mock.calls.flat().map(String).join("\n")).not.toContain("same key");
  consoleError.mockRestore();
});

test("selects on Enter rather than focus and prevents disabled activation", async () => {
  const user = userEvent.setup();
  render(<ExampleTabs />);

  await user.tab();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveFocus();
  expect(screen.getByRole("tab", { name: "Library" })).toHaveAttribute("aria-selected", "true");

  await user.keyboard("{Enter}");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Disabled" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("tab", { name: "Recents" })).toHaveAttribute("aria-selected", "true");
});
