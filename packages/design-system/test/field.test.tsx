import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Checkbox, Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, Input } from "@anaphor/system";

test("a sibling label toggles a horizontal checkbox and associates its description", async () => {
  const user = userEvent.setup();
  render(<Field orientation="horizontal">
    <Checkbox />
    <FieldContent><FieldLabel>Updates</FieldLabel><FieldDescription>Product news.</FieldDescription></FieldContent>
  </Field>);
  const checkbox = screen.getByRole("checkbox", { name: "Updates" });
  expect(checkbox).toHaveAccessibleDescription("Product news.");
  await user.click(screen.getByText("Updates"));
  expect(checkbox).toBeChecked();
  checkbox.focus();
  await user.keyboard(" ");
  expect(checkbox).not.toBeChecked();
});

test("horizontal composition preserves disabled field behavior and state-aware classes", async () => {
  const user = userEvent.setup();
  render(<Field orientation="horizontal" disabled className={state => state.disabled ? "disabled-field" : ""}>
    <Checkbox />
    <FieldLabel>Unavailable</FieldLabel>
  </Field>);
  const checkbox = screen.getByRole("checkbox", { name: "Unavailable" });
  expect(checkbox).toHaveAttribute("aria-disabled", "true");
  expect(checkbox.closest('[data-slot="field"]')).toHaveClass("disabled-field");
  await user.click(screen.getByText("Unavailable"));
  expect(checkbox).not.toBeChecked();
});

test("group and content forward refs while field associations stay independent", () => {
  const group = createRef<HTMLDivElement>();
  const content = createRef<HTMLDivElement>();
  render(<FieldGroup ref={group} role="group" aria-label="Contact">
    <Field><FieldLabel>Name</FieldLabel><Input /></Field>
    <Field><FieldContent ref={content}><FieldLabel>Email</FieldLabel><FieldDescription>For replies.</FieldDescription></FieldContent><Input type="email" /></Field>
  </FieldGroup>);
  expect(group.current).toBe(screen.getByRole("group", { name: "Contact" }));
  expect(content.current).toContainElement(screen.getByText("Email"));
  expect(screen.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("For replies.");
  expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAccessibleDescription();
});

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
