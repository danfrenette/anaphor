import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox, CheckboxGroup, Field, FieldDescription, FieldLabel, useCheckboxPaint } from "@anaphor/system";
import { createRef } from "react";
import { expect, test } from "vitest";

test("label activation updates the native form value and connects its description", async () => {
  const user = userEvent.setup();
  render(<form aria-label="Preferences"><Field orientation="vertical">
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
    <Field orientation="vertical" disabled><FieldLabel><Checkbox />Unavailable preference</FieldLabel></Field>
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


function PaintableChoices({ label }: { label: string }) {
  const paint = useCheckboxPaint();
  return <ol aria-label={label} {...paint}>
    <li><Field orientation="horizontal"><Checkbox /><FieldLabel>Send updates</FieldLabel></Field></li>
    <li><Field orientation="horizontal"><Checkbox /><FieldLabel>Send reminders</FieldLabel></Field></li>
  </ol>;
}

test("a paintable ordered list keeps native checkbox keyboard activation", async () => {
  const user = userEvent.setup();
  render(<PaintableChoices label="Preferences" />);
  const updates = screen.getByRole("checkbox", { name: "Send updates" });
  await user.tab();
  expect(updates).toHaveFocus();
  await user.keyboard(" ");
  expect(updates).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Send reminders" })).not.toBeChecked();
});


test("the checkbox group forwards its root ref and lets a caller prevent painting", async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLDivElement>();
  const { unmount } = render(<CheckboxGroup role="group" aria-label="Preferences" ref={ref} onPointerDown={event => event.preventDefault()}>
    <Field orientation="horizontal"><Checkbox /><FieldLabel>Send updates</FieldLabel></Field>
    <Field orientation="horizontal"><Checkbox /><FieldLabel>Send reminders</FieldLabel></Field>
  </CheckboxGroup>);
  expect(ref.current).toBe(screen.getByRole("group", { name: "Preferences" }));
  const updates = screen.getByRole("checkbox", { name: "Send updates" });
  const reminders = screen.getByRole("checkbox", { name: "Send reminders" });

  await user.pointer([
    { keys: "[MouseLeft>]", target: updates },
    { target: reminders, coords: { x: 0, y: 20 } },
    { keys: "[/MouseLeft]", target: reminders },
  ]);
  expect(updates).not.toBeChecked();
  expect(reminders).not.toBeChecked();
  unmount();
  expect(ref.current).toBeNull();
});
