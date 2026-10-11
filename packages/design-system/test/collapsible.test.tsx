import { createRef, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@anaphor/system";

describe("Collapsible", () => {
  it("keeps closed content searchable and opens controlled ancestors on a browser match", () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return <Collapsible open={open} onOpenChange={setOpen}><CollapsibleTrigger>Search parent</CollapsibleTrigger><CollapsibleContent data-testid="search-parent"><Collapsible><CollapsibleTrigger>Search child</CollapsibleTrigger><CollapsibleContent data-testid="search-child"><button>Hidden field note</button></CollapsibleContent></Collapsible></CollapsibleContent></Collapsible>;
    }
    render(<Example />);
    const parent = screen.getByTestId("search-parent");
    const child = screen.getByTestId("search-child");
    expect(parent).toHaveAttribute("hidden", "until-found");
    expect(child).toHaveAttribute("hidden", "until-found");
    expect(parent).not.toHaveAttribute("inert");
    expect(child).not.toHaveAttribute("inert");
    expect(screen.queryByRole("button", { name: "Hidden field note" })).not.toBeInTheDocument();
    act(() => { child.dispatchEvent(new Event("beforematch", { bubbles: true })); });
    expect(screen.getByRole("button", { name: "Search parent" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Search child" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Hidden field note" })).toBeVisible();
  });

  it("clears the consumer panel ref when closed content unmounts", async () => {
    const user = userEvent.setup();
    const panelRef = createRef<HTMLDivElement>();
    render(<Collapsible defaultOpen><CollapsibleTrigger>Ref chapter</CollapsibleTrigger><CollapsibleContent hiddenUntilFound={false} ref={panelRef}>Ref content</CollapsibleContent></Collapsible>);
    expect(panelRef.current).toBe(screen.getByText("Ref content"));
    await user.click(screen.getByRole("button", { name: "Ref chapter" }));
    await waitFor(() => expect(screen.queryByText("Ref content")).not.toBeInTheDocument());
    expect(panelRef.current).toBeNull();
  });
  it("runs callback ref cleanup when the panel unmounts", async () => {
    const user = userEvent.setup();
    let attached = false;
    render(<Collapsible defaultOpen><CollapsibleTrigger>Observed chapter</CollapsibleTrigger><CollapsibleContent hiddenUntilFound={false} ref={node => {
      attached = node !== null;
      return () => { attached = false; };
    }}>Observed content</CollapsibleContent></Collapsible>);
    expect(attached).toBe(true);
    await user.click(screen.getByRole("button", { name: "Observed chapter" }));
    await waitFor(() => expect(screen.queryByText("Observed content")).not.toBeInTheDocument());
    expect(attached).toBe(false);
  });
  it("leaves outside focus alone when a controlled panel closes", () => {
    const example = (open: boolean) => <><button>Outside</button><Collapsible open={open}><CollapsibleTrigger>Section trigger</CollapsibleTrigger><CollapsibleContent><button>Inside</button></CollapsibleContent></Collapsible></>;
    const { rerender } = render(example(true));
    screen.getByRole("button", { name: "Inside" }).focus();
    screen.getByRole("button", { name: "Outside" }).focus();
    rerender(example(false));
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });
  it("supports controlled state, cancellation, initial state and disabled triggers", async () => {
    const user = userEvent.setup();
    function Example() {
      const [open, setOpen] = useState(false);
      return <>
        <Collapsible open={open} onOpenChange={setOpen}><CollapsibleTrigger>Controlled</CollapsibleTrigger><CollapsibleContent>Controlled content</CollapsibleContent></Collapsible>
        <Collapsible defaultOpen><CollapsibleTrigger disabled>Disabled</CollapsibleTrigger><CollapsibleContent>Initial content</CollapsibleContent></Collapsible>
        <Collapsible onOpenChange={(_, details) => details.cancel()}><CollapsibleTrigger>Canceled</CollapsibleTrigger><CollapsibleContent>Canceled content</CollapsibleContent></Collapsible>
      </>;
    }
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Controlled" }));
    expect(screen.getByText("Controlled content")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(screen.getByRole("button", { name: "Disabled" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Canceled" }));
    expect(screen.getByRole("button", { name: "Canceled" })).toHaveAttribute("aria-expanded", "false");
  });
  it("returns focus from a descendant when its controlled ancestor closes", () => {
    const content = <><CollapsibleTrigger>Ancestor</CollapsibleTrigger><CollapsibleContent keepMounted><Collapsible defaultOpen><CollapsibleTrigger>Nested</CollapsibleTrigger><CollapsibleContent><button>Deep section</button></CollapsibleContent></Collapsible></CollapsibleContent></>;
    const { rerender } = render(<Collapsible open>{content}</Collapsible>);
    screen.getByRole("button", { name: "Deep section" }).focus();
    rerender(<Collapsible open={false}>{content}</Collapsible>);
    expect(screen.getByRole("button", { name: "Ancestor" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Deep section" })).not.toBeInTheDocument();
  });
  it("opens custom content with a pointer and closes with Space", async () => {
    const user = userEvent.setup();
    render(<Collapsible><CollapsibleTrigger>Chapter</CollapsibleTrigger><CollapsibleContent><button>Section</button></CollapsibleContent></Collapsible>);
    const trigger = screen.getByRole("button", { name: "Chapter" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Section" })).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Section" })).toBeVisible();
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
