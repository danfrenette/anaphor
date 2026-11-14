import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster, createToastManager } from "@anaphor/system";
import { expect, test, vi } from "vitest";

function mount() {
  const manager = createToastManager();
  render(<Toaster toastManager={manager} position="bottom-right" timeout={0} limit={3} />);
  return manager;
}

test("global callers update one notification, invoke its action, and dismiss it", async () => {
  const user = userEvent.setup();
  const manager = mount();
  const undo = vi.fn();
  let id = "";
  act(() => { id = manager.add({ title: "Note archived", type: "success", actionProps: { children: "Undo", onClick: undo } }); });
  await user.click(await screen.findByRole("button", { name: "Undo" }));
  expect(undo).toHaveBeenCalledOnce();
  expect(screen.getByText("Note archived")).toBeVisible();
  act(() => { manager.update(id, { title: "Note restored", actionProps: undefined }); });
  expect(await screen.findByText("Note restored")).toBeVisible();
  expect(screen.queryByText("Note archived")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
  await waitFor(() => expect(screen.queryByText("Note restored")).not.toBeInTheDocument());
});

test("promise success and failure replace loading without duplicating notifications", async () => {
  const manager = mount();
  let resolve!: (value: string) => void;
  const operation = new Promise<string>(done => { resolve = done; });
  let result!: Promise<string>;
  act(() => { result = manager.promise(operation, { loading: "Saving", success: value => `Saved ${value}`, error: "Save failed" }); });
  expect(await screen.findByText("Saving")).toBeVisible();
  await act(async () => { resolve("note"); await result; });
  expect(screen.getByText("Saved note")).toBeVisible();
  expect(screen.queryByText("Saving")).not.toBeInTheDocument();
  await userEvent.setup().keyboard("{F6}");
  expect(screen.getAllByRole("button", { name: "Dismiss notification" })).toHaveLength(1);
  await act(async () => {
    await expect(manager.promise(Promise.reject(new Error("offline")), { loading: "Saving", success: "Saved", error: { title: "Save failed", description: "Try again", timeout: 0 } })).rejects.toThrow("offline");
  });
  expect(screen.getByText("Save failed")).toBeVisible();
  expect(screen.getByText("Try again")).toBeVisible();
  act(() => manager.close());
  await waitFor(() => expect(screen.queryByText("Save failed")).not.toBeInTheDocument());
});

test("independent managers route feedback only to their own viewport", async () => {
  const first = createToastManager();
  const second = createToastManager();
  render(<>
    <Toaster toastManager={first} position="top-right" timeout={0} limit={3} viewportProps={{ "aria-label": "First notifications" }} />
    <Toaster toastManager={second} position="bottom-left" timeout={0} limit={3} viewportProps={{ "aria-label": "Second notifications" }} />
  </>);
  act(() => { first.add({ title: "Only first" }); second.add({ title: "Only second" }); });
  expect(await screen.findByText("Only first")).toBeVisible();
  expect(screen.getAllByText("Only first")).toHaveLength(1);
  act(() => first.close());
  await waitFor(() => expect(screen.queryByText("Only first")).not.toBeInTheDocument());
  expect(screen.getByText("Only second")).toBeVisible();
});

test("input-specific motion preserves consumer viewport event handlers", async () => {
  const user = userEvent.setup();
  const manager = createToastManager();
  const focus = vi.fn();
  const keyDown = vi.fn();
  const pointerDown = vi.fn();
  const pointerMove = vi.fn();
  render(<Toaster toastManager={manager} position="top-center" timeout={0} limit={3}
    viewportProps={{ onFocusCapture: focus, onKeyDownCapture: keyDown, onPointerDownCapture: pointerDown, onPointerMoveCapture: pointerMove }} />);
  act(() => { manager.add({ title: "Saved" }); });
  await user.keyboard("{F6}{Tab}");
  expect(focus).toHaveBeenCalled();
  expect(keyDown).toHaveBeenCalled();
  const close = screen.getByRole("button", { name: "Dismiss notification" });
  await user.hover(close);
  expect(pointerMove).toHaveBeenCalled();
  await user.click(close);
  expect(pointerDown).toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByText("Saved")).not.toBeInTheDocument());
});

test("replacing a held notification cancels its old pointer before reuse", async () => {
  const user = userEvent.setup();
  const manager = mount();
  act(() => { manager.add({ id: "reused", title: "Original" }); });
  const original = await screen.findByRole("dialog", { name: "Original" });
  await user.pointer([
    { keys: "[MouseLeft>]", target: original, coords: { clientX: 10, clientY: 10 } },
    { target: original, coords: { clientX: 11, clientY: 10 } },
    { target: original, coords: { clientX: 30, clientY: 10 } },
  ]);
  expect(original).toHaveAttribute("data-swiping", "");
  act(() => {
    manager.close("reused");
    manager.add({ id: "reused", title: "Replacement" });
  });
  const replacement = await screen.findByRole("dialog", { name: "Replacement" });
  await user.pointer([
    { target: replacement, coords: { clientX: 150, clientY: 10 } },
    { keys: "[/MouseLeft]", target: replacement, coords: { clientX: 150, clientY: 10 } },
  ]);
  expect(screen.getByText("Replacement")).toBeVisible();
});
