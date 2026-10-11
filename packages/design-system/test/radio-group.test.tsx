import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, FieldDescription, FieldError, FieldItem, FieldLabel, Radio, RadioGroup } from "@anaphor/system";
import { createRef, useState } from "react";
import { expect, test } from "vitest";

test("each labeled choice has its own description and submits one exclusive form value", async () => {
  const user = userEvent.setup();
  render(<form aria-label="Notification preferences"><Field orientation="vertical" name="frequency">
    <FieldLabel>Notification frequency</FieldLabel>
    <RadioGroup defaultValue="daily">
      <FieldItem orientation="horizontal"><Radio value="every" /><div><FieldLabel>Every update</FieldLabel><FieldDescription>Receive each update as it arrives.</FieldDescription></div></FieldItem>
      <FieldItem orientation="horizontal"><Radio value="daily" /><div><FieldLabel>Daily digest</FieldLabel><FieldDescription>A summary once a day.</FieldDescription></div></FieldItem>
      <FieldItem orientation="horizontal"><Radio value="weekly" /><div><FieldLabel>Weekly digest</FieldLabel><FieldDescription>A summary once a week.</FieldDescription></div></FieldItem>
    </RadioGroup>
  </Field></form>);
  const group = screen.getByRole("radiogroup", { name: "Notification frequency" });
  expect(group).toBeInTheDocument();
  const every = screen.getByRole("radio", { name: "Every update" });
  const daily = screen.getByRole("radio", { name: "Daily digest" });
  const weekly = screen.getByRole("radio", { name: "Weekly digest" });
  expect(every).toHaveAccessibleDescription("Receive each update as it arrives.");
  expect(daily).toHaveAccessibleDescription("A summary once a day.");
  expect(weekly).toHaveAccessibleDescription("A summary once a week.");
  const form = screen.getByRole("form", { name: "Notification preferences" });
  if (!(form instanceof HTMLFormElement)) throw new Error("Expected a form");
  expect(new FormData(form).getAll("frequency")).toEqual(["daily"]);
  await user.click(screen.getByText("Weekly digest"));
  expect(weekly).toBeChecked();
  expect(daily).not.toBeChecked();
  expect(every).not.toBeChecked();
  expect(new FormData(form).getAll("frequency")).toEqual(["weekly"]);
});

test("arrow keys select enabled choices and Tab leaves the group", async () => {
  const user = userEvent.setup();
  render(<><RadioGroup aria-label="Frequency" defaultValue="daily">
    <label><Radio value="every" />Every update</label>
    <label><Radio value="daily" />Daily digest</label>
    <label><Radio value="unavailable" disabled />Unavailable</label>
    <label><Radio value="weekly" />Weekly digest</label>
  </RadioGroup><button>Continue</button></>);
  const daily = screen.getByRole("radio", { name: "Daily digest" });
  const weekly = screen.getByRole("radio", { name: "Weekly digest" });
  await user.tab();
  expect(daily).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(weekly).toHaveFocus();
  expect(weekly).toBeChecked();
  expect(daily).not.toBeChecked();
  await user.keyboard("{ArrowUp}");
  expect(daily).toHaveFocus();
  expect(daily).toBeChecked();
  await user.tab();
  expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
});

test("controlled selection belongs to the consumer and follows updated values", async () => {
  const user = userEvent.setup();
  function Preferences() {
    const [value, setValue] = useState("daily");
    return <><RadioGroup aria-label="Frequency" value={value} onValueChange={setValue}>
      <label><Radio value="daily" />Daily digest</label>
      <label><Radio value="weekly" />Weekly digest</label>
    </RadioGroup><output aria-label="Selected frequency">{value}</output><button onClick={() => setValue("daily")}>Restore daily</button></>;
  }
  render(<Preferences />);
  await user.click(screen.getByText("Weekly digest"));
  expect(screen.getByRole("status", { name: "Selected frequency" })).toHaveTextContent("weekly");
  await user.click(screen.getByRole("button", { name: "Restore daily" }));
  expect(screen.getByRole("radio", { name: "Daily digest" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Weekly digest" })).not.toBeChecked();
});

test("read-only groups retain selection and focus while disabled fields are skipped", async () => {
  const user = userEvent.setup();
  render(<>
    <RadioGroup aria-label="Fixed frequency" defaultValue="daily" readOnly>
      <label><Radio value="daily" />Daily digest</label><label><Radio value="weekly" />Weekly digest</label>
    </RadioGroup>
    <Field orientation="vertical" disabled><FieldLabel>Unavailable frequency</FieldLabel><RadioGroup defaultValue="every">
      <FieldItem orientation="horizontal"><Radio value="every" /><FieldLabel>Every update</FieldLabel></FieldItem>
    </RadioGroup></Field>
    <button>Continue</button>
  </>);
  const daily = screen.getByRole("radio", { name: "Daily digest" });
  await user.tab();
  expect(daily).toHaveFocus();
  await user.keyboard("{ArrowDown} ");
  await user.click(screen.getByText("Weekly digest"));
  expect(daily).toBeChecked();
  expect(screen.getByRole("radio", { name: "Weekly digest" })).not.toBeChecked();
  await user.tab();
  expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
  await user.click(screen.getByText("Every update"));
  expect(screen.getByRole("radio", { name: "Every update" })).toHaveAttribute("aria-disabled", "true");
});

test("Field validates the group value without mixing option descriptions", async () => {
  const user = userEvent.setup();
  render(<Field orientation="vertical" name="frequency" validationMode="onChange" validate={value => value === "every" ? "Choose a digest while updates are paused." : null}>
    <FieldLabel>Notification frequency</FieldLabel>
    <RadioGroup defaultValue="daily" required>
      <FieldItem orientation="horizontal"><Radio value="every" /><FieldLabel>Every update</FieldLabel><FieldDescription>Individual notifications.</FieldDescription></FieldItem>
      <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel><FieldDescription>A daily summary.</FieldDescription></FieldItem>
    </RadioGroup>
    <FieldError />
  </Field>);
  expect(screen.queryByText("Choose a digest while updates are paused.")).not.toBeInTheDocument();
  await user.click(screen.getByText("Every update"));
  expect(await screen.findByText("Choose a digest while updates are paused.")).toBeVisible();
  expect(screen.getByRole("radiogroup", { name: "Notification frequency" })).toHaveAttribute("aria-invalid", "true");
  await user.click(screen.getByText("Daily digest"));
  expect(screen.queryByText("Choose a digest while updates are paused.")).not.toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Daily digest" })).toHaveAccessibleDescription("A daily summary.");
});

test("custom rendering preserves consumer refs, handlers, and disabled focus behavior", async () => {
  const user = userEvent.setup();
  const radioRef = createRef<HTMLSpanElement>();
  const inputRef = createRef<HTMLInputElement>();
  function Preferences() {
    const [message, setMessage] = useState("Ready");
    return <>
      <RadioGroup aria-label="Custom frequency" defaultValue="daily">
        <Radio value="daily" aria-label="Daily digest" ref={radioRef} inputRef={inputRef} render={<span />} onClick={() => setMessage("Daily selected")} />
        <Radio value="weekly" aria-label="Weekly digest" nativeButton render={(props, state) => <button {...props} type="button" aria-label={state.checked ? "Weekly digest selected" : "Weekly digest"} />} />
      </RadioGroup>
      <RadioGroup aria-label="Unavailable custom frequency" defaultValue="daily" disabled>
        <Radio value="daily" aria-label="Unavailable daily" nativeButton render={<button type="button" />} />
      </RadioGroup>
      <button>Continue</button><output>{message}</output>
    </>;
  }
  render(<Preferences />);
  expect(radioRef.current).toBe(screen.getByRole("radio", { name: "Daily digest" }));
  expect(inputRef.current).toHaveAttribute("type", "radio");
  await user.tab();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("radio", { name: "Weekly digest selected" })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: "Daily digest" }));
  expect(screen.getByRole("status")).toHaveTextContent("Daily selected");
  await user.tab();
  expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
});

test("a group with a disabled selected choice keeps an enabled keyboard entry point", async () => {
  const user = userEvent.setup();
  render(<><RadioGroup aria-label="Frequency" defaultValue="daily">
    <label><Radio value="daily" disabled />Daily digest</label>
    <label><Radio value="weekly" />Weekly digest</label>
  </RadioGroup><button>Continue</button></>);
  await user.tab();
  expect(screen.getByRole("radio", { name: "Weekly digest" })).toHaveFocus();
  await user.keyboard(" ");
  expect(screen.getByRole("radio", { name: "Weekly digest" })).toBeChecked();
  await user.tab();
  expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
});

test("disabling the selected choice preserves keyboard entry when its rendered group root changes", async () => {
  const user = userEvent.setup();
  function Preferences() {
    const [disabled, setDisabled] = useState(false);
    const [section, setSection] = useState(false);
    return <><button onClick={() => setSection(true)}>Switch group container</button><button onClick={() => setDisabled(current => !current)}>Toggle daily availability</button>
      <RadioGroup aria-label="Frequency" defaultValue="daily" render={props => section ? <section {...props} /> : <div {...props} />}>
        <label><Radio value="daily" disabled={disabled} />Daily digest</label>
        <label><Radio value="weekly" />Weekly digest</label>
      </RadioGroup><button>Continue</button></>;
  }
  render(<Preferences />);
  await user.click(screen.getByRole("button", { name: "Switch group container" }));
  await user.click(screen.getByRole("button", { name: "Toggle daily availability" }));
  await user.tab();
  expect(screen.getByRole("radio", { name: "Weekly digest" })).toHaveFocus();
  await user.keyboard(" ");
  expect(screen.getByRole("radio", { name: "Weekly digest" })).toBeChecked();
});

test("keyboard entry skips hidden choices when the selected choice is disabled", async () => {
  const user = userEvent.setup();
  render(<RadioGroup aria-label="Frequency" defaultValue="daily">
    <label><Radio value="daily" disabled />Daily digest</label>
    <div hidden><label><Radio value="weekly" />Weekly digest</label></div>
    <label><Radio value="monthly" />Monthly digest</label>
  </RadioGroup>);
  await user.tab();
  expect(screen.getByRole("radio", { name: "Monthly digest" })).toHaveFocus();
  await user.keyboard(" ");
  expect(screen.getByRole("radio", { name: "Monthly digest" })).toBeChecked();
});
