import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PrivateQueries } from "./private-access";
import { DeviceApproval } from "./device-approval";

const network = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("axios", async (original) => {
  const actual = await original<typeof import("axios")>();
  return { ...actual, default: { ...actual.default, create: () => network } };
});

test("editing a device code removes its reviewed request before another approval", async () => {
  network.get.mockResolvedValue({
    data: {
      client_id: "Anaphor CLI",
      scope: "tours:read tours:write",
      status: "pending",
    },
  });
  network.post.mockResolvedValue({});
  const user = userEvent.setup();
  render(
    <PrivateQueries>
      <DeviceApproval code="FIRST" />
    </PrivateQueries>,
  );
  await user.click(screen.getByRole("button", { name: "Review request" }));
  await user.click(
    await screen.findByRole("button", { name: "Approve device" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Device approved. Return to your CLI.",
  );
  await user.clear(screen.getByRole("textbox", { name: "Device code" }));
  await user.type(
    screen.getByRole("textbox", { name: "Device code" }),
    "SECOND",
  );
  expect(
    screen.queryByRole("button", { name: "Approve device" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review request" }));
  expect(
    await screen.findByRole("button", { name: "Approve device" }),
  ).toBeVisible();
});

test("a denied request reports completion and prevents another decision", async () => {
  network.get.mockResolvedValue({
    data: {
      client_id: "Anaphor CLI",
      scope: "tours:read tours:write",
      status: "pending",
    },
  });
  network.post.mockResolvedValue({});
  const user = userEvent.setup();
  render(
    <PrivateQueries>
      <DeviceApproval code="DENIED" />
    </PrivateQueries>,
  );
  await user.click(screen.getByRole("button", { name: "Review request" }));
  await user.click(await screen.findByRole("button", { name: "Deny device" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Device denied.");
  expect(screen.getByRole("button", { name: "Approve device" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Deny device" })).toBeDisabled();
});
