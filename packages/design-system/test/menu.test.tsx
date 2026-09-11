import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@anaphor/system";
import { expect, test, vi } from "vitest";

test("opens, moves focus through actions, and returns focus on Escape", async () => {
  const user = userEvent.setup();
  render(
    <Menu>
      <MenuTrigger>File actions</MenuTrigger>
      <MenuPopup>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Move</MenuItem>
      </MenuPopup>
    </Menu>,
  );

  const trigger = screen.getByRole("button", { name: "File actions" });
  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menu")).toBeVisible();
  expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Move" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
});

test("activates an item and closes the menu", async () => {
  const user = userEvent.setup();
  const onRename = vi.fn();
  render(
    <Menu>
      <MenuTrigger>File actions</MenuTrigger>
      <MenuPopup><MenuItem onClick={onRename}>Rename</MenuItem></MenuPopup>
    </Menu>,
  );

  await user.tab();
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("menuitem", { name: "Rename" }));
  expect(onRename).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("does not activate disabled items and continues navigation", async () => {
  const user = userEvent.setup();
  const onUnavailable = vi.fn();
  render(
    <Menu>
      <MenuTrigger>File actions</MenuTrigger>
      <MenuPopup>
        <MenuItem>Rename</MenuItem>
        <MenuItem disabled onClick={onUnavailable}>Unavailable</MenuItem>
        <MenuItem>Share</MenuItem>
      </MenuPopup>
    </Menu>,
  );

  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Unavailable" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("menuitem", { name: "Unavailable" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onUnavailable).not.toHaveBeenCalled();
  expect(screen.getByRole("menu")).toBeVisible();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Share" })).toHaveFocus();
});
