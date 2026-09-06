import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, ButtonLabel } from "@design-language/system";
import type { FormEvent } from "react";
import { expect, test, vi } from "vitest";

test("activates by pointer and keyboard without submitting its form", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
  render(
    <form onSubmit={onSubmit}>
      <Button onClick={onClick}><ButtonLabel>Execute</ButtonLabel></Button>
    </form>,
  );
  const button = screen.getByRole("button", { name: "Execute" });
  await user.tab();
  expect(button).toHaveFocus();
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
  await user.click(button);
  expect(onClick).toHaveBeenCalledTimes(3);
  expect(onSubmit).not.toHaveBeenCalled();
});

test("keeps focus and blocks activation while loading, then recovers", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const action = (loading: boolean) => (
    <Button loading={loading} onClick={onClick}><ButtonLabel>Save</ButtonLabel></Button>
  );
  const { rerender } = render(action(false));
  const button = screen.getByRole("button", { name: "Save" });
  await user.tab();
  expect(button).toHaveFocus();
  rerender(action(true));
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(button).toHaveAttribute("aria-disabled", "true");
  await user.keyboard("{Enter} ");
  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
  rerender(action(false));
  expect(button).not.toHaveAttribute("aria-busy");
  await user.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});

test("disabled actions cannot activate and are skipped by keyboard navigation", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(
    <>
      <Button disabled onClick={onClick}><ButtonLabel>Delete item</ButtonLabel></Button>
      <Button><ButtonLabel>Cancel</ButtonLabel></Button>
    </>,
  );
  const button = screen.getByRole("button", { name: "Delete item" });
  expect(button).toBeDisabled();
  await user.click(button);
  await user.tab();
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onClick).not.toHaveBeenCalled();
});

test("preserves a composed submit button's behavior and formatted action name", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
  const count = 3;
  const onRenderClick = vi.fn();
  render(
    <form onSubmit={onSubmit}>
      <Button render={<button onClick={onRenderClick} />} type="submit">
        <svg aria-hidden="true" />
        <ButtonLabel>Save {count} <strong>items</strong></ButtonLabel>
      </Button>
    </form>,
  );
  await user.click(screen.getByRole("button", { name: "Save 3 items" }));
  expect(onSubmit).toHaveBeenCalledOnce();
  expect(onRenderClick).toHaveBeenCalledOnce();
});

test("composed anchors block navigation while loading and recover", async () => {
  const user = userEvent.setup();
  const activate = vi.fn();
  const action = (loading: boolean) => (
    <Button nativeButton={false} render={<a href="#card" />} loading={loading} onClick={activate}>
      <ButtonLabel>Explore Card</ButtonLabel>
    </Button>
  );
  const { rerender } = render(action(false));
  const anchor = screen.getByRole("button", { name: "Explore Card" });
  await user.tab();
  await user.keyboard("{Enter} ");
  expect(activate).toHaveBeenCalledTimes(2);
  rerender(action(true));
  expect(anchor).toHaveFocus();
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  expect(anchor.dispatchEvent(click)).toBe(false);
  await user.keyboard("{Enter} ");
  expect(activate).toHaveBeenCalledTimes(2);
  rerender(action(false));
  await user.click(anchor);
  expect(activate).toHaveBeenCalledTimes(3);
});
