import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Kbd, KbdGroup } from "@anaphor/system";
import { expect, test } from "vitest";

test("renders native keyboard semantics and forwards attributes", () => {
  const { container } = render(<Kbd className="custom-key" title="Keyboard key">K</Kbd>);
  const key = container.querySelector("kbd");

  expect(key).toHaveTextContent("K");
  expect(key).toHaveAttribute("data-slot", "kbd");
  expect(key).toHaveAttribute("title", "Keyboard key");
  expect(key).toHaveClass("custom-key", "font-mono");
});

test("groups keys under an explicit accessible label without adding a keyboard stop", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <>
      <button>Before</button>
      <KbdGroup aria-label="Command K">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      <button>After</button>
    </>,
  );

  expect(container.querySelector('[data-slot="kbd-group"]')).toHaveAccessibleName("Command K");
  expect(container.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
  await user.tab();
  expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});
