import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CodeReview } from "@anaphor/system";

beforeEach(() => { vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }); });
afterEach(() => vi.unstubAllGlobals());

const before = { path: "local.ts", revision: "abc123", content: "const refresh = false;\n", href: "https://example.com/abc123/local.ts" };
const after = { path: "local.ts", revision: "def456", content: "const refresh = true;\n", href: "https://example.com/def456/local.ts" };

test("keeps pinned source links behind the context control", async () => {
  render(<CodeReview before={before} after={after} regions={[]} notes={[]} theme="light" aria-label="Explicit refresh" />);
  expect(screen.getByRole("figure", { name: "Explicit refresh" })).toBeVisible();
  await userEvent.setup().click(screen.getByRole("button", { name: "Source and full context" }));
  expect(screen.getByRole("link", { name: "Before: local.ts at abc123" })).toHaveAttribute("href", before.href);
  expect(screen.getByRole("link", { name: "After: local.ts at def456" })).toHaveAttribute("href", after.href);
});

test("discloses the complete captured sources without requiring remote access", async () => {
  const user = (await import("@testing-library/user-event")).default.setup();
  render(<CodeReview before={before} after={after} regions={[]} notes={[]} theme="light" />);
  await user.click(screen.getByText("Source and full context"));
  expect(screen.getByRole("region", { name: "Before captured source" })).toHaveTextContent("const refresh = false;");
  expect(screen.getByRole("region", { name: "After captured source" })).toHaveTextContent("const refresh = true;");
});

test("keeps authored ranges and explanations separate from the reader selection", () => {
  render(<CodeReview before={before} after={after} theme="light"
    regions={[{ id: "refresh", label: "Explicit refresh", side: "after", startLine: 1, endLine: 1 }]}
    notes={[{ id: "refresh-note", side: "after", startLine: 1, endLine: 1, children: "Refresh is an explicit action." }]} />);
  expect(screen.getByRole("group", { name: "Authored code regions" })).toHaveTextContent("Explicit refresh");
  expect(screen.getByRole("note", { name: "After lines 1–1" })).toHaveTextContent("Refresh is an explicit action.");
  expect(screen.getByRole("status")).toHaveTextContent("Reader selection: none");
});


test("retains an unchanged excerpt with its authored range and complete source", async () => {
  const user = (await import("@testing-library/user-event")).default.setup();
  render(<CodeReview before={before} after={{ ...before, revision: "def456" }} regions={[]}
    notes={[{ id: "kept", side: "before", startLine: 1, endLine: 1, children: "The refresh flag was retained." }]} theme="dark" />);
  expect(screen.getByText("local.ts · unchanged")).toBeVisible();
  expect(screen.getByRole("note", { name: "Before lines 1–1" })).toHaveTextContent("The refresh flag was retained.");
  await user.click(screen.getByText("Source and full context"));
  expect(screen.getByRole("region", { name: "After captured source" })).toHaveTextContent("const refresh = false;");
});

test.each(["added", "deleted"] as const)("reads the captured side of a %s empty file", async kind => {
  const user = (await import("@testing-library/user-event")).default.setup();
  const empty = { path: "empty.ts", revision: "def456", content: "" };
  render(<CodeReview {...(kind === "added" ? { before: null, after: empty } : { before: empty, after: null })} regions={[]} notes={[]} theme="light" />);
  await user.click(screen.getByText("Source and full context"));
  expect(screen.getByRole("region", { name: `${kind === "added" ? "After" : "Before"} captured source` })).toBeVisible();
  expect(screen.queryByRole("region", { name: `${kind === "added" ? "Before" : "After"} captured source` })).not.toBeInTheDocument();
});

test("a region jump focuses its explanation without opening raw source or changing reader selection", async () => {
  const user = (await import("@testing-library/user-event")).default.setup();
  render(<CodeReview before={before} after={after} theme="light" notes={[]}
    regions={[{ id: "refresh", label: "Refresh policy", side: "after", startLine: 1, endLine: 1 }]} />);
  await user.click(screen.getByRole("button", { name: "Refresh policy" }));
  expect(screen.getByText("Refresh policy · After lines 1–1").parentElement).toHaveFocus();
  expect(screen.queryByRole("region", { name: "After captured source" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Source and full context" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("status")).toHaveTextContent("Reader selection: none");
});

test("captured source scrolling is reachable from the keyboard", async () => {
  const user = userEvent.setup();
  render(<CodeReview before={null} after={{ path: "long.ts", revision: "b".repeat(40), content: "export const saved = true;" }} regions={[]} notes={[]} theme="light" />);
  await user.tab();
  expect(screen.getByRole("group", { name: "Scrollable captured source" })).toHaveFocus();
});
