import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Kbd, KbdGroup } from "@anaphor/system";
import { expect, test } from "vitest";

test("renders native keyboard semantics and forwards attributes", () => {
  render(<Kbd className="custom-key" title="Keyboard key">K</Kbd>);
  const key = screen.getByText("K");

  expect(key.tagName).toBe("KBD");
  expect(key).toHaveAttribute("title", "Keyboard key");
  expect(key).toHaveClass("custom-key");
});

test("groups keys under an explicit accessible label without adding a keyboard stop", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button>Before</button>
      <KbdGroup aria-label="Command K">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      <button>After</button>
    </>,
  );

  expect(screen.getByLabelText("Command K")).toHaveTextContent("⌘K");
  await user.tab();
  expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});
