import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Popover, PopoverBody, PopoverClose, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger } from "@anaphor/system";

function Content() {
  return <PopoverPopup side="bottom" align="start" sideOffset={8}>
    <PopoverBody>
      <PopoverTitle>Preferences</PopoverTitle>
      <PopoverDescription>Adjust your workspace.</PopoverDescription>
      <label>Name<input /></label>
      <label><input type="checkbox" />Show details</label>
      <PopoverClose>Done</PopoverClose>
    </PopoverBody>
  </PopoverPopup>;
}

test("labels the panel, focuses its form, and returns focus on Escape", async () => {
  const user = userEvent.setup();
  render(<Popover><PopoverTrigger>Open preferences</PopoverTrigger><Content /></Popover>);
  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("dialog", { name: "Preferences" })).toHaveAccessibleDescription("Adjust your workspace.");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  await user.type(screen.getByRole("textbox"), "Research");
  await user.tab();
  expect(screen.getByRole("checkbox")).toHaveFocus();
  await user.keyboard(" ");
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open preferences" })).toHaveFocus();
});

test("supports controlled state, close controls, and outside dismissal", async () => {
  const user = userEvent.setup();
  const changes = vi.fn();
  function Example() {
    const [open, setOpen] = useState(false);
    return <>
      <Popover open={open} onOpenChange={(value, details) => { changes(value, details.reason); setOpen(value); }}>
        <PopoverTrigger>Open preferences</PopoverTrigger><Content />
      </Popover>
      <button>Outside</button>
    </>;
  }
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Open preferences" }));
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(changes).toHaveBeenLastCalledWith(false, "close-press");
  expect(screen.getByRole("button", { name: "Open preferences" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Open preferences" }));
  await user.click(screen.getByRole("button", { name: "Outside" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(changes).toHaveBeenLastCalledWith(false, expect.stringMatching(/^(outside-press|focus-out)$/));
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});

test("honors cancellation and does not open from a disabled trigger", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Popover><PopoverTrigger disabled>Open preferences</PopoverTrigger><Content /></Popover>);
  await user.click(screen.getByRole("button", { name: "Open preferences" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  rerender(<Popover onOpenChange={(_, details) => details.cancel()}><PopoverTrigger>Open preferences</PopoverTrigger><Content /></Popover>);
  await user.click(screen.getByRole("button", { name: "Open preferences" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
