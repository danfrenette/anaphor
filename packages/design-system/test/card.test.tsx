import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card, CardCopyButton, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@design-language/system";
import { expect, test, vi } from "vitest";

test("composes a passive card with accessible headings and independent controls", async () => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  render(
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Your current projects.</CardDescription>
        <CardAction><button onClick={onEdit}>Edit workspace</button></CardAction>
      </CardHeader>
      <CardContent>Three projects</CardContent>
      <CardFooter><a href="/projects">View projects</a></CardFooter>
    </Card>,
  );
  expect(screen.getByRole("heading", { name: "Workspace", level: 3 })).toBeVisible();
  await user.click(screen.getByText("Three projects"));
  expect(onEdit).not.toHaveBeenCalled();
  await user.tab();
  expect(screen.getByRole("button", { name: "Edit workspace" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onEdit).toHaveBeenCalledOnce();
  await user.tab();
  expect(screen.getByRole("link", { name: "View projects" })).toHaveFocus();
});

test("allows a page-appropriate heading and content without other sections", () => {
  render(
    <Card>
      <CardContent>
        <CardTitle as="h2">Notes</CardTitle>
        <p>Everything you need for today.</p>
      </CardContent>
    </Card>,
  );
  expect(screen.getByRole("heading", { name: "Notes", level: 2 })).toBeVisible();
  expect(screen.getByText("Everything you need for today.")).toBeVisible();
});

test("copies the supplied value and announces success after clipboard confirmation", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(<Card><CardHeader><CardTitle>Tokens</CardTitle><CardAction><CardCopyButton value="--space-1: 4px;" aria-label="Copy tokens" /></CardAction></CardHeader></Card>);
  await user.tab();
  await user.keyboard("{Enter}");
  expect(write).toHaveBeenCalledWith("--space-1: 4px;");
  expect(await screen.findByRole("status")).toHaveTextContent("Copied to clipboard.");
  expect(screen.getByRole("button", { name: "Copy tokens" })).toHaveFocus();
});

test("reports clipboard failure and allows retry", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("Denied")).mockResolvedValue();
  render(<CardCopyButton value="A note" />);
  await user.click(screen.getByRole("button"));
  expect(screen.getByRole("status")).toHaveTextContent("Could not copy.");
  await user.click(screen.getByRole("button"));
  expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard.");
  expect(write).toHaveBeenCalledTimes(2);
});

test("disabled copy controls do not write to the clipboard", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText");
  render(<CardCopyButton value="A note" disabled />);
  await user.click(screen.getByRole("button"));
  expect(write).not.toHaveBeenCalled();
});
