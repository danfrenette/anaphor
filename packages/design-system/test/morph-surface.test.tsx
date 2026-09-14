import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MorphSurface } from "@anaphor/system";
import { useState } from "react";
import { createPortal } from "react-dom";
import { expect, test, vi } from "vitest";

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

  test(`${adapter} focus pins while inside and an outside press closes`, async () => {
    const user = userEvent.setup();
    render(<Consumer portal={portal} />);
    const trigger = screen.getByRole("button", { name: "Open Example" });
    await user.click(trigger);
    await user.click(screen.getByRole("textbox", { name: "Setting" }));
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    const outside = screen.getByRole("button", { name: "Outside" });
    await user.click(outside);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(outside).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("region", { hidden: true })).toHaveAttribute("inert");
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

test("uses a nonmodal dialog drawer on narrow screens", async () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(max-width: 47.999rem)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  const user = userEvent.setup();
  render(<Consumer />);

  const trigger = screen.getByRole("button", { name: "Open Example" });
  expect(trigger).toHaveClass("shadow-card", "md:shadow-none");
  await user.click(trigger);
  const drawer = screen.getByRole("dialog", { name: "Example" });
  expect(drawer).toHaveAttribute("data-slot", "morph-surface");
  expect(drawer).toHaveClass("inset-x-[var(--anaphor-page-gutter)]", "bottom-[var(--anaphor-page-gutter)]", "rounded-card", "shadow-card", "w-auto");
  expect(screen.getByRole("heading", { name: "Example" })).toHaveAttribute("data-variant", "heading");
  expect(screen.getByRole("button", { name: "Outside" })).not.toHaveAttribute("inert");
  await user.click(screen.getByRole("button", { name: "Close controls" }));
  expect(trigger).toHaveFocus();
  await user.click(trigger);
  const outside = screen.getByRole("button", { name: "Outside" });
  await user.click(outside);
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});
