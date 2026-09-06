import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@design-language/system";
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
