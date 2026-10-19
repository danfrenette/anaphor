import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Diff } from "../src/components/diff";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
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
