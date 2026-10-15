import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ReviewCode } from "./review-code";
import type { TourDocumentV2 } from "./document";

type TourCode = NonNullable<NonNullable<TourDocumentV2["sections"][number]["review"]>["steps"][number]["code"]>;
const capture = { path: "save.ts", revision: "b".repeat(40), content: "export const saved = true;\n", href: `https://github.com/example/project/blob/${"b".repeat(40)}/save.ts` };
const note = { id: "guard", label: "Keep the saved draft", side: "after" as const, startLine: 1, endLine: 1, explanation: "The draft remains available after closing the editor." };
const code: TourCode = { before: null, after: capture, regions: [], notes: [note] };

test("one location action serves a matching region and note and links to its exact source lines", async () => {
  render(<ReviewCode code={{ ...code, regions: [{ ...note, id: "same-region" }] }} />);
  expect(screen.getAllByRole("button", { name: "Keep the saved draft · After · L1" })).toHaveLength(1);
  await userEvent.setup().click(screen.getByRole("button", { name: "Full source and revisions" }));
  expect(screen.getByRole("link", { name: "After: save.ts" })).toHaveAttribute("href", capture.href + "#L1");
});

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => vi.unstubAllGlobals());

test("the note location names its behavior, source side and original range without opening full-source details", async () => {
  const user = userEvent.setup();
  render(<ReviewCode code={code} />);
  expect(screen.queryByRole("link", { name: "After: save.ts" })).not.toBeInTheDocument();
  const locate = screen.getByRole("button", { name: "Keep the saved draft · After · L1" });
  await user.click(locate);
  expect(locate).toHaveFocus();
  await user.click(locate);
  expect(locate).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Full source and revisions" }));
  expect(screen.getByRole("link", { name: "After: save.ts" })).toHaveAttribute("href", capture.href + "#L1");
  expect(screen.getByText(`Revision ${capture.revision}`)).toBeVisible();
});

test("missing source keeps the explanation but offers no misleading location action", async () => {
  const user = userEvent.setup();
  render(<ReviewCode code={{ ...code, before: null, after: null }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Source was not captured.");
  expect(screen.getByText("Keep the saved draft · Source unavailable")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Keep the saved draft · After · L1" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "1. Keep the saved draft" }));
  expect(screen.getByText(note.explanation)).toBeVisible();
});

test("unchanged captures remain inspectable and retain distinct before and after source links", async () => {
  const user = userEvent.setup();
  render(<ReviewCode code={{ ...code, before: { ...capture, revision: "a".repeat(40), href: `https://github.com/example/project/blob/${"a".repeat(40)}/save.ts` }, regions: [{ ...note, id: "context", label: "Read the save result", startLine: 1, endLine: 1 }] }} />);
  expect(screen.getByRole("region", { name: "Diff for save.ts" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Read the save result · After · L1" }));
  await user.click(screen.getByRole("button", { name: "Full source and revisions" }));
  expect(screen.getByRole("link", { name: "Before: save.ts" })).toHaveAttribute("href", `https://github.com/example/project/blob/${"a".repeat(40)}/save.ts`);
  expect(screen.getByRole("link", { name: "After: save.ts" })).toHaveAttribute("href", capture.href + "#L1");
});

test("a replacement capture starts with its source disclosure closed and exposes only the new revision", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<ReviewCode code={code} />);
  await user.click(screen.getByRole("button", { name: "Full source and revisions" }));
  expect(screen.getByText(`Revision ${capture.revision}`)).toBeVisible();
  const replacement = { ...capture, revision: "c".repeat(40), href: `https://github.com/example/project/blob/${"c".repeat(40)}/save.ts` };
  rerender(<ReviewCode code={{ ...code, after: replacement }} />);
  expect(screen.getByRole("button", { name: "Full source and revisions" })).toHaveAttribute("aria-expanded", "false");
  await user.click(screen.getByRole("button", { name: "Full source and revisions" }));
  expect(screen.getByRole("link", { name: "After: save.ts" })).toHaveAttribute("href", replacement.href + "#L1");
  expect(screen.queryByText(`Revision ${capture.revision}`)).not.toBeInTheDocument();
});
