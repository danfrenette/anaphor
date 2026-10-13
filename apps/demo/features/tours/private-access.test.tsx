import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PrivateQueries, usePrivateAccess } from "./private-access";
import { usePrivateLogout } from "./use-private-logout";

const network = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("axios", async (original) => {
  const actual = await original<typeof import("axios")>();
  return { ...actual, default: { ...actual.default, create: () => network } };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function PrivatePage({ expiresAt }: { expiresAt: string }) {
  const access = usePrivateAccess(expiresAt);
  const logout = usePrivateLogout();
  return (
    <>
      {access.ended ? <h1>Sign in</h1> : <h1>Private tour</h1>}
      {logout.failed && <p role="alert">Revocation unconfirmed</p>}
      <button onClick={logout.signOut} disabled={logout.pending}>
        Sign out
      </button>
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  network.get.mockResolvedValue({
    data: {
      owner: "dan",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    },
  });
});
afterEach(() => vi.useRealTimers());

test("private content disappears at the original deadline even when the session response offers a later expiry", async () => {
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
  network.get.mockResolvedValue({
    data: { owner: "dan", expiresAt: "2030-01-02T00:00:00.000Z" },
  });
  render(
    <PrivateQueries>
      <PrivatePage expiresAt="2030-01-01T00:00:01.000Z" />
    </PrivateQueries>,
  );
  expect(screen.getByRole("heading", { name: "Private tour" })).toBeVisible();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(screen.getByRole("heading", { name: "Private tour" })).toBeVisible();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("denied access on focus removes private content", async () => {
  render(
    <PrivateQueries>
      <PrivatePage
        expiresAt={new Date(Date.now() + 86_400_000).toISOString()}
      />
    </PrivateQueries>,
  );
  await waitFor(() => expect(network.get).toHaveBeenCalled());
  network.get.mockRejectedValue({
    isAxiosError: true,
    response: { status: 403 },
  });
  fireEvent.focus(window);
  expect(await screen.findByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("failed sign-out hides private content and permits revocation retry", async () => {
  network.post
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({});
  const user = userEvent.setup();
  render(
    <PrivateQueries>
      <PrivatePage
        expiresAt={new Date(Date.now() + 86_400_000).toISOString()}
      />
    </PrivateQueries>,
  );
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("heading", { name: "Sign in" })).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("Revocation unconfirmed");
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
  );
  expect(refresh).toHaveBeenCalledOnce();
});
