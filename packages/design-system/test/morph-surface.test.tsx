import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MorphSurface } from "@anaphor/system";
import { useState } from "react";
import { createPortal } from "react-dom";
import { expect, test } from "vitest";

function Consumer({ portal = false, claimEscape = false }: { portal?: boolean; claimEscape?: boolean }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [interacting, setInteracting] = useState(false);
  const controls = <input aria-label="Setting" onKeyDown={event => { if (claimEscape && event.key === "Escape") event.preventDefault(); }} />;
  return <>
    <button>Outside</button>
    <output>{interacting ? "Pinned" : "Free"}</output>
    <MorphSurface open={open} onOpenChange={setOpen} onInteractionChange={setInteracting} title="Example" icon={<span>+</span>}>
      {portal ? <div ref={setTarget} /> : controls}
    </MorphSurface>
    {portal && target && createPortal(controls, target)}
  </>;
}

for (const portal of [false, true]) {
  const adapter = portal ? "portaled" : "inline";
  test(`${adapter} controls close on Escape, return focus, and can reopen`, async () => {
    const user = userEvent.setup();
    render(<Consumer portal={portal} />);
    const trigger = screen.getByRole("button", { name: "Open Example" });
    await user.click(trigger);
    expect(screen.getByRole("region", { name: "Example" })).toHaveFocus();
    await user.click(screen.getByRole("textbox", { name: "Setting" }));
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("region", { hidden: true })).toHaveAttribute("inert");
    expect(screen.getByText("Free")).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("region", { name: "Example" })).toHaveFocus();
  });

  test(`${adapter} focus pins only while inside the content`, async () => {
    const user = userEvent.setup();
    render(<Consumer portal={portal} />);
    await user.click(screen.getByRole("button", { name: "Open Example" }));
    await user.click(screen.getByRole("textbox", { name: "Setting" }));
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.getByText("Free")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("region", { name: "Example" })).toBeInTheDocument();
  });

  test(`${adapter} controls can handle Escape themselves`, async () => {
    const user = userEvent.setup();
    render(<Consumer portal={portal} claimEscape />);
    await user.click(screen.getByRole("button", { name: "Open Example" }));
    await user.click(screen.getByRole("textbox", { name: "Setting" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("region", { name: "Example" })).toBeInTheDocument();
  });
}

test("a held pointer pins until release outside the surface", async () => {
  const user = userEvent.setup();
  render(<Consumer portal />);
  await user.click(screen.getByRole("button", { name: "Open Example" }));
  await user.pointer({ target: screen.getByRole("heading", { name: "Example" }), keys: "[MouseLeft>]" });
  act(() => screen.getByRole("button", { name: "Outside" }).focus());
  expect(screen.getByText("Pinned")).toBeInTheDocument();
  await user.pointer({ target: screen.getByRole("button", { name: "Outside" }), keys: "[/MouseLeft]" });
  expect(screen.getByText("Free")).toBeInTheDocument();
});
