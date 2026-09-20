import { useState } from "react";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette, Kbd, KbdGroup } from "@anaphor/system";
import { beforeEach, expect, test, vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
});

const items = [
  { id: "button", label: "Button", group: "Components", keywords: "action" },
  { id: "disabled", label: "Unavailable", group: "Components", disabled: true },
  { id: "input", label: "Input", group: "Components" },
  { id: "type", label: "Typography", group: "Foundations" },
];
function Example({ onSelect = () => {}, renderTrailing }: { onSelect?: (item: typeof items[number]) => void; renderTrailing?: (item: typeof items[number]) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Search</button><CommandPalette items={items} open={open} onOpenChange={setOpen} title="Find a command" onSelect={onSelect} renderTrailing={renderTrailing} /></>;
}

test("filters by keywords and executes a command with Enter", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Example onSelect={onSelect} />);
  await user.click(screen.getByRole("button", { name: "Search" }));
  const input = await screen.findByRole("combobox");
  await waitFor(() => expect(input).toHaveFocus());
  await user.type(input, "action");
  expect(screen.getByRole("option", { name: "Button" })).toBeVisible();
  expect(screen.queryByRole("option", { name: "Typography" })).not.toBeInTheDocument();
  await user.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledWith(items[0]);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("shows an empty state, restores focus, and resets search on reopening", async () => {
  const user = userEvent.setup();
  render(<Example />);
  const trigger = screen.getByRole("button", { name: "Search" });
  await user.click(trigger);
  await user.type(await screen.findByRole("combobox"), "missing");
  expect(screen.getByText("No commands found. Try another search.")).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());
  await user.click(trigger);
  expect(await screen.findByRole("combobox")).toHaveValue("");
});

test("disabled commands cannot execute", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Example onSelect={onSelect} />);
  await user.click(screen.getByRole("button", { name: "Search" }));
  await user.click(await screen.findByRole("option", { name: "Unavailable" }));
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeVisible();
});

test("renders stable consumer-owned trailing content without searching it", async () => {
  const user = userEvent.setup();
  render(
    <Example
      renderTrailing={item => item.id === "button" ? (
        <KbdGroup aria-label="G then B"><Kbd>G</Kbd><Kbd>B</Kbd></KbdGroup>
      ) : null}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Search" }));
  const option = await screen.findByRole("option", { name: /Button/ });
  expect(option.querySelector('[data-slot="command-palette-trailing"]')).toHaveTextContent("GB");
  expect(option.querySelector("svg")).not.toBeInTheDocument();

  await user.type(screen.getByRole("combobox"), "gb");
  expect(screen.getByText("No commands found. Try another search.")).toBeVisible();
});
