import { render, screen } from "@testing-library/react";
import { Separator } from "@anaphor/system";
import { expect, test } from "vitest";

test("exposes separator semantics through the public package API", () => {
  render(<Separator aria-label="Section break" orientation="vertical" />);

  expect(
    screen.getByRole("separator", { name: "Section break" }),
  ).toHaveAttribute("aria-orientation", "vertical");
});


test("applies consumer classes from the current orientation", () => {
  const className = ({ orientation }: { orientation: "horizontal" | "vertical" }) =>
    orientation === "vertical" ? "bg-red-500" : "bg-blue-500";
  const { rerender } = render(<Separator className={className} orientation="vertical" />);
  const separator = screen.getByRole("separator");
  expect(separator).toHaveClass("bg-red-500");
  rerender(<Separator className={className} orientation="horizontal" />);
  expect(separator).toHaveClass("bg-blue-500");
  expect(separator).not.toHaveClass("bg-red-500");
});
