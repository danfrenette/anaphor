import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Diff } from "@anaphor/system";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());

const settings = { layout: "unified", wrap: true, controls: false, context: "collapsed", maxHeight: null } satisfies Pick<React.ComponentProps<typeof Diff>, "layout" | "wrap" | "controls" | "context" | "maxHeight">;

test("unavailable source stays explicit and can be collapsed with a keyboard", async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLElement>();
  render(<Diff {...settings} ref={ref} source={{ kind: "unavailable", path: "image.png", reason: "Binary preview unavailable." }} />);
  expect(ref.current).toBe(screen.getByRole("region", { name: "Diff for image.png" }));
  expect(screen.getByRole("status")).toHaveTextContent("Binary preview unavailable.");
  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "Expand image.png" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("malformed and binary patches are not presented as empty changes", () => {
  const { rerender } = render(<Diff {...settings} source={{ kind: "patch", path: "source.ts", patch: "not a patch" }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Supply a patch for exactly one file.");
  rerender(<Diff {...settings} source={{ kind: "patch", path: "image.png", patch: "diff --git a/image.png b/image.png\nBinary files a/image.png and b/image.png differ\n" }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Binary file changed.");
});

test("pure renames expose both paths and copy the complete new file", async () => {
  const user = userEvent.setup();
  render(<Diff {...settings} controls source={{ kind: "files", before: { name: "old.ts", contents: "const value = 1;\n" }, after: { name: "new.ts", contents: "const value = 1;\n" } }} />);
  expect(screen.getByText("old.ts →")).toBeInTheDocument();
  expect(screen.getByText("File renamed without content changes.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Copy new file" }));
  expect(await navigator.clipboard.readText()).toBe("const value = 1;\n");
  expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard.");
});

test("patch copy preserves the original patch payload", async () => {
  const user = userEvent.setup();
  const patch = "diff --git a/old.ts b/new.ts\nsimilarity index 100%\nrename from old.ts\nrename to new.ts\n";
  render(<Diff {...settings} controls source={{ kind: "patch", path: "new.ts", patch }} />);
  await user.click(screen.getByRole("button", { name: "Copy patch" }));
  expect(await navigator.clipboard.readText()).toBe(patch);
  expect(screen.queryByRole("button", { name: "Copy new file" })).not.toBeInTheDocument();
});

test("authored explanations remain available when their source is unavailable", async () => {
  const user = userEvent.setup();
  render(<Diff {...settings} source={{ kind: "unavailable", path: "guard.ts", reason: "Source was not captured." }}
    annotations={{ notes: [{ id: "guard", title: "Guard missing sections", body: "Unknown sections return no next section.", presentation: "inline", range: { side: "after", start: 20, end: 20 } }], activeNoteId: null, onActiveNoteChange: () => {} }} />);
  const note = screen.getByRole("button", { name: "1. Guard missing sections" });
  expect(note).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText("Code range unavailable in supplied source.")).toBeVisible();
  await user.click(note);
  expect(screen.getByText("Unknown sections return no next section.")).toBeVisible();
});

test("notes on a pure rename expose unchanged code instead of disappearing", async () => {
  const user = userEvent.setup();
  render(<Diff {...settings} source={{ kind: "files", before: { name: "old.ts", contents: "const value = 1;\n" }, after: { name: "new.ts", contents: "const value = 1;\n" } }}
    annotations={{ notes: [{ id: "move", title: "Keep the value", body: "Only the module location changes.", presentation: "inline", range: { side: "after", start: 1, end: 1 } }], activeNoteId: null, onActiveNoteChange: () => {} }} />);
  await user.click(screen.getByRole("button", { name: "1. Keep the value" }));
  expect(screen.getByText("Only the module location changes.")).toBeVisible();
});

test("a partial patch cannot silently relocate a note to supplied lines", async () => {
  const user = userEvent.setup();
  render(<Diff {...settings} source={{ kind: "patch", path: "sample.ts", patch: "--- a/sample.ts\n+++ b/sample.ts\n@@ -8,1 +8,1 @@\n-old\n+new\n" }}
    annotations={{ notes: [{ id: "missing", title: "Inspect the earlier context", body: "This claim refers to source absent from this patch.", presentation: "inline", range: { side: "before", start: 2, end: 4 } }], activeNoteId: "missing", onActiveNoteChange: () => {}, revealKey: 1 }} />);
  expect(screen.getByText("Patch excerpt · Only supplied context is available.")).toBeVisible();
  expect(screen.getByText("Code range unavailable in supplied source.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "1. Inspect the earlier context" }));
  expect(screen.getByText("This claim refers to source absent from this patch.")).toBeVisible();
});

test("invalid unchanged excerpt bounds explain the missing source instead of clamping", () => {
  render(<Diff {...settings} source={{ kind: "unchanged", file: { name: "sample.ts", contents: "one\ntwo\n" }, excerpts: [{ start: 2, end: 5 }] }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Supply at least one valid excerpt within the unchanged file.");
});
