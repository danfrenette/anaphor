import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox, Field, FieldDescription, FieldLabel } from "@anaphor/system";
import { expect, test } from "vitest";

test("label activation updates the native form value and connects its description", async () => {
  const user = userEvent.setup();
  render(<form aria-label="Preferences"><Field>
    <FieldLabel><Checkbox name="updates" value="yes" />Send updates</FieldLabel>
    <FieldDescription>Only occasional news.</FieldDescription>
  </Field></form>);
  const checkbox = screen.getByRole("checkbox", { name: "Send updates" });
  const form = screen.getByRole("form", { name: "Preferences" });
  if (!(form instanceof HTMLFormElement)) throw new Error("Expected a form");
  expect(new FormData(form).get("updates")).toBeNull();
  expect(checkbox).toHaveAccessibleDescription("Only occasional news.");
  await user.click(screen.getByText("Send updates"));
  expect(checkbox).toBeChecked();
  expect(new FormData(form).get("updates")).toBe("yes");
  await user.keyboard(" ");
  expect(checkbox).not.toBeChecked();
  expect(new FormData(form).get("updates")).toBeNull();
});

test("read-only remains focusable while disabled is skipped", async () => {
  const user = userEvent.setup();
  render(<>
    <Checkbox aria-label="Fixed preference" defaultChecked readOnly />
    <Field disabled><FieldLabel><Checkbox />Unavailable preference</FieldLabel></Field>
    <button>Continue</button>
  </>);
  const readOnly = screen.getByRole("checkbox", { name: "Fixed preference" });
  await user.tab();
  expect(readOnly).toHaveFocus();
  await user.keyboard(" ");
  await user.click(readOnly);
  expect(readOnly).toBeChecked();
  await user.tab();
  expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
  await user.click(screen.getByText("Unavailable preference"));
  expect(screen.getByRole("checkbox", { name: "Unavailable preference" })).not.toBeChecked();
});
