import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ButtonLabel, TagButton } from "@anaphor/system";
import { createRef, type FormEvent } from "react";
import { expect, test, vi } from "vitest";

test("tag actions forward refs and activate without submitting a surrounding form", async () => {
  const user = userEvent.setup();
  const activate = vi.fn();
  const submit = vi.fn((event: FormEvent) => event.preventDefault());
  const ref = createRef<HTMLButtonElement>();
  render(<form onSubmit={submit}>
    <TagButton ref={ref} size="xs" tone="neutral" variant="soft" loading={false} aria-label="Remove Research" onClick={activate}>
      <ButtonLabel>Research <span>from Chapter one</span></ButtonLabel><svg aria-hidden="true" />
    </TagButton>
  </form>);
  const tag = screen.getByRole("button", { name: "Remove Research" });
  expect(ref.current).toBe(tag);
  await user.tab();
  expect(tag).toHaveFocus();
  await user.keyboard("{Enter} ");
  await user.click(tag);
  expect(activate).toHaveBeenCalledTimes(3);
  expect(submit).not.toHaveBeenCalled();
});

test("tag pills retain Button loading focus and disabled activation behavior", async () => {
  const user = userEvent.setup();
  const activate = vi.fn();
  const action = (loading: boolean, disabled = false) => <TagButton size="xs" tone="neutral" variant="outline" loading={loading} disabled={disabled} onClick={activate}>
    <ButtonLabel>Add Analysis</ButtonLabel>
  </TagButton>;
  const { rerender } = render(action(false));
  const tag = screen.getByRole("button", { name: "Add Analysis" });
  await user.tab();
  rerender(action(true));
  expect(tag).toHaveFocus();
  expect(tag).toHaveAttribute("aria-busy", "true");
  await user.keyboard("{Enter} ");
  await user.click(tag);
  expect(activate).not.toHaveBeenCalled();
  rerender(action(false, true));
  expect(tag).toBeDisabled();
  await user.click(tag);
  expect(activate).not.toHaveBeenCalled();
  rerender(action(false));
  await user.click(tag);
  expect(activate).toHaveBeenCalledOnce();
});
