import { render, screen } from "@testing-library/react";
import { Separator } from "@design-language/system";
import { expect, test } from "vitest";

test("exposes separator semantics through the public package API", () => {
  render(<Separator aria-label="Section break" orientation="vertical" />);

  expect(
    screen.getByRole("separator", { name: "Section break" }),
  ).toHaveAttribute("aria-orientation", "vertical");
});
