import { fireEvent, render, screen } from "@testing-library/react";
import { Button, ButtonLabel } from "@design-language/system";
import { expect, test, vi } from "vitest";

test("exposes a safe native button through the public package API", () => {
  const onClick = vi.fn();

  render(<Button onClick={onClick}><ButtonLabel>Execute</ButtonLabel></Button>);
  const button = screen.getByRole("button", { name: "Execute" });

  expect(button).toHaveAttribute("type", "button");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});

test("keeps its action named and suppresses activation while loading", () => {
  const onClick = vi.fn();

  render(
    <Button loading onClick={onClick}>
      <ButtonLabel>Submit</ButtonLabel>
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Submit" });

  expect(button).toHaveAttribute("aria-busy", "true");
  expect(button).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

test("composes a custom button through the Base UI render prop", () => {
  render(
    <Button render={<button data-composed="true" />}>
      <svg aria-hidden="true" />
      <ButtonLabel>Create project</ButtonLabel>
    </Button>,
  );

  expect(
    screen.getByRole("button", { name: "Create project" }),
  ).toHaveAttribute("data-composed", "true");
});

test("keeps interpolated and formatted text together as the action name", () => {
  const count = 3;
  render(
    <Button>
      <svg aria-hidden="true" />
      <ButtonLabel>Save {count} <strong>items</strong></ButtonLabel>
    </Button>,
  );

  expect(screen.getByRole("button", { name: "Save 3 items" })).toBeEnabled();
  expect(screen.getByText("items").tagName).toBe("STRONG");
});

test("exposes intentional appearance defaults and choices", () => {
  const { rerender } = render(<Button><ButtonLabel>Default</ButtonLabel></Button>);
  const button = screen.getByRole("button", { name: "Default" });

  expect(button).toHaveAttribute("data-variant", "solid");
  expect(button).toHaveAttribute("data-size", "md");
  expect(button).toHaveAttribute("data-tone", "accent");
  expect(button).toHaveAttribute("data-shape", "square");

  rerender(
    <Button variant="ghost" size="xs" tone="neutral" shape="round">
      <ButtonLabel>Default</ButtonLabel>
    </Button>,
  );

  expect(button).toHaveAttribute("data-variant", "ghost");
  expect(button).toHaveAttribute("data-size", "xs");
  expect(button).toHaveAttribute("data-tone", "neutral");
  expect(button).toHaveAttribute("data-shape", "round");
  expect(button).toHaveClass("text-small");

  rerender(<Button size="lg"><ButtonLabel>Default</ButtonLabel></Button>);
  expect(button).toHaveClass("text-body");
  expect(button).not.toHaveClass("text-small");
});
