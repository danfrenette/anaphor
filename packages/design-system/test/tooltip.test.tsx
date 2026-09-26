import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipPopup } from "@anaphor/system";

test("describes a focused trigger and dismisses on Escape without moving focus", async () => {
  const user = userEvent.setup();
  render(<TooltipProvider delay={0}><Tooltip><TooltipTrigger>Settings</TooltipTrigger><TooltipPopup side="top" align="center" sideOffset={6}>Choose visible columns</TooltipPopup></Tooltip></TooltipProvider>);
  await user.tab();
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Choose visible columns");
  expect(screen.getByRole("button", { name: "Settings" })).toHaveAccessibleDescription("Choose visible columns");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
});

test("shows hints on hover and leaves the trigger action usable", async () => {
  const user = userEvent.setup();
  render(<TooltipProvider delay={0} closeDelay={0}><Tooltip><TooltipTrigger>Help</TooltipTrigger><TooltipPopup side="bottom" align="start" sideOffset={6}>More information</TooltipPopup></Tooltip></TooltipProvider>);
  const trigger = screen.getByRole("button", { name: "Help" });
  await user.hover(trigger);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("More information");
  await user.click(trigger);
  await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
});
