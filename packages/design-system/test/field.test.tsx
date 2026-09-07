import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, FieldDescription, FieldError, FieldLabel, Input } from "@anaphor/system";
import { expect, test } from "vitest";

test("connects each field's label and messages without manual IDs", async () => {
  const user = userEvent.setup();
  render(<>
    <Field invalid>
      <FieldLabel>Email</FieldLabel>
      <Input type="email" />
      <FieldDescription>Used for receipts.</FieldDescription>
      <FieldError match>Please enter a complete address.</FieldError>
    </Field>
    <Field disabled>
      <FieldLabel>Workspace</FieldLabel>
      <Input defaultValue="Personal" />
      <FieldDescription>Assigned automatically.</FieldDescription>
    </Field>
  </>);
  const email = screen.getByRole("textbox", { name: "Email" });
  await user.click(screen.getByText("Email", { selector: "label" }));
  expect(email).toHaveFocus();
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(email).toHaveAccessibleDescription("Used for receipts. Please enter a complete address.");
  const workspace = screen.getByRole("textbox", { name: "Workspace" });
  expect(workspace).toBeDisabled();
  expect(workspace).toHaveAccessibleDescription("Assigned automatically.");
});
