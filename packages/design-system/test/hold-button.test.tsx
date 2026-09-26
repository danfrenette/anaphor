import { act, fireEvent, render, screen } from "@testing-library/react";
import { HoldButton } from "@anaphor/system";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => vi.useRealTimers());

test("completes only after the full hold and cancels on release", () => {
  vi.useFakeTimers();
  const onHoldComplete = vi.fn();
  render(<HoldButton duration={2000} size="md" shape="square" onHoldComplete={onHoldComplete}>Hold to delete</HoldButton>);
  const button = screen.getByRole("button", { name: "Hold to delete" });

  fireEvent.keyDown(button, { key: " " });
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.keyUp(button, { key: " " });
  act(() => vi.advanceTimersByTime(2000));
  expect(onHoldComplete).not.toHaveBeenCalled();

  fireEvent.keyDown(button, { key: "Enter" });
  act(() => vi.advanceTimersByTime(2000));
  expect(onHoldComplete).toHaveBeenCalledOnce();
  fireEvent.keyDown(button, { key: "Enter", repeat: true });
  act(() => vi.advanceTimersByTime(2000));
  expect(onHoldComplete).toHaveBeenCalledOnce();
  fireEvent.keyUp(button, { key: "Enter" });
  expect(onHoldComplete).toHaveBeenCalledOnce();
});

test("cancels on blur and does not start when disabled", () => {
  vi.useFakeTimers();
  const onHoldComplete = vi.fn();
  const example = (disabled: boolean) => <HoldButton duration={2000} size="sm" shape="round" disabled={disabled} onHoldComplete={onHoldComplete}>Hold</HoldButton>;
  const { rerender } = render(example(false));
  const button = screen.getByRole("button", { name: "Hold" });
  fireEvent.keyDown(button, { key: "Enter" });
  fireEvent.blur(button);
  act(() => vi.advanceTimersByTime(2000));
  expect(onHoldComplete).not.toHaveBeenCalled();

  rerender(example(true));
  fireEvent.keyDown(button, { key: "Enter" });
  act(() => vi.advanceTimersByTime(2000));
  expect(onHoldComplete).not.toHaveBeenCalled();

  rerender(example(false));
  fireEvent.keyDown(button, { key: "Enter" });
  rerender(example(true));
  act(() => vi.advanceTimersByTime(2000));
  expect(onHoldComplete).not.toHaveBeenCalled();
});
