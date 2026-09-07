import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@design-language/system";
import { createRef, useState } from "react";
import { expect, test, vi } from "vitest";

test("edits controlled values and submits native form data", async () => {
  const user = userEvent.setup();
  const submit = vi.fn();
  const ref = createRef<HTMLInputElement>();
  function Form() {
    const [value, setValue] = useState("");
    return (
      <form onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget).get("email")); }}>
        <label htmlFor="email">Email</label>
        <Input ref={ref} id="email" name="email" type="email" value={value} onValueChange={setValue} />
        <button type="submit">Send</button>
      </form>
    );
  }
  render(<Form />);
  const input = screen.getByRole("textbox", { name: "Email" });
  await user.click(screen.getByText("Email", { selector: "label" }));
  expect(input).toHaveFocus();
  expect(ref.current).toBe(input);
  await user.type(input, "you@example.com{Enter}");
  expect(submit).toHaveBeenCalledWith("you@example.com");
});

test("read-only stays focusable while disabled is skipped", async () => {
  const user = userEvent.setup();
  render(<>
    <Input aria-label="Unavailable" disabled />
    <Input aria-label="Identifier" readOnly defaultValue="workspace-001" />
  </>);
  await user.tab();
  const input = screen.getByRole("textbox", { name: "Identifier" });
  expect(input).toHaveFocus();
  await user.type(input, "changed");
  expect(input).toHaveValue("workspace-001");
  expect(screen.getByRole("textbox", { name: "Unavailable" })).toBeDisabled();
});
