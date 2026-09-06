import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@design-language/system";
import { expect, test, vi } from "vitest";

test("exposes a safe native button through the public package API", () => {
  const onClick = vi.fn();

  render(<Button onClick={onClick}>Execute</Button>);
  const button = screen.getByRole("button", { name: "Execute" });

  expect(button).toHaveAttribute("type", "button");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});

test("keeps its action named and suppresses activation while loading", () => {
  const onClick = vi.fn();

  render(
    <Button loading onClick={onClick}>
      Submit
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
      Create project
    </Button>,
  );

  expect(
    screen.getByRole("button", { name: "Create project" }),
  ).toHaveAttribute("data-composed", "true");
});

test("optically offsets direct text children without wrapping composed elements", () => {
  const { container } = render(
    <Button>
      <svg data-testid="leading-icon" aria-hidden="true" />
      Execute
      {13}
      <span data-testid="composed-child">Details</span>
    </Button>,
  );

  const labels = container.querySelectorAll('[data-slot="button-label"]');
  expect(labels).toHaveLength(2);
  expect(labels[0]).toHaveTextContent("Execute");
  expect(labels[1]).toHaveTextContent("13");
  expect(labels[0]).toHaveClass("relative", "-top-[1px]");
  expect(screen.getByTestId("leading-icon")).not.toHaveAttribute(
    "data-slot",
    "button-label",
  );
  expect(screen.getByTestId("composed-child")).not.toHaveAttribute(
    "data-slot",
    "button-label",
  );
});

test("exposes intentional appearance defaults and choices", () => {
  const { rerender } = render(<Button>Default</Button>);
  const button = screen.getByRole("button", { name: "Default" });

  expect(button).toHaveAttribute("data-variant", "solid");
  expect(button).toHaveAttribute("data-size", "md");
  expect(button).toHaveAttribute("data-tone", "accent");
  expect(button).toHaveAttribute("data-shape", "square");

  rerender(
    <Button variant="ghost" size="xs" tone="neutral" shape="round">
      Default
    </Button>,
  );

  expect(button).toHaveAttribute("data-variant", "ghost");
  expect(button).toHaveAttribute("data-size", "xs");
  expect(button).toHaveAttribute("data-tone", "neutral");
  expect(button).toHaveAttribute("data-shape", "round");
  expect(button).toHaveClass("text-small");

  rerender(<Button size="lg">Default</Button>);
  expect(button).toHaveClass("text-body");
  expect(button).not.toHaveClass("text-small");
});
