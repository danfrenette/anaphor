import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { UploadExample } from "../app/uploads/upload-example";
import { useUpload } from "../app/uploads/use-upload";

function Example() {
  return <StrictMode><UploadHarness /></StrictMode>;
}

function UploadHarness() {
  const session = useUpload();
  return <><UploadExample session={session} reducedMotion={true} />
    <button onClick={session.mixed}>Mixed</button>
    <button onClick={() => session.setScenario("Transfer failure")}>Fail transfers</button>
    <button onClick={() => session.setScenario("Processing failure")}>Fail processing</button>
    <button onClick={() => session.preview("selected")}>Inspect ready</button>
    <button onClick={session.reset}>Reset</button>
  </>;
}

function select(container: HTMLElement, files: File[]) {
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files } });
}
const row = (name: string) => within(screen.getByRole("listitem", { name }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("adding a mixed batch keeps prior files and reports rejected candidates", () => {
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt")]);
  select(container, [new File(["b"], "second.md"), new File(["x"], "unsupported.csv")]);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(row("first.txt").getByText("Ready to upload")).toBeVisible();
  expect(row("second.md").getByText("Ready to upload")).toBeVisible();
  expect(screen.getByRole("button", { name: "Add files" })).toHaveAccessibleDescription(/unsupported.csv/);
});

test("canceling one file keeps it selected while siblings and later additions complete", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt"), new File(["b"], "second.md")]);
  await user.click(screen.getByRole("button", { name: "Upload 2 files" }));
  act(() => vi.advanceTimersByTime(500));
  await user.click(row("first.txt").getByRole("button", { name: "Cancel upload" }));
  expect(row("first.txt").getByRole("button", { name: "Upload file" })).toHaveFocus();
  select(container, [new File(["c"], "third.txt")]);
  await user.click(row("third.txt").getByRole("button", { name: "Upload file" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(row("first.txt").getByText("Ready to upload")).toBeVisible();
  expect(row("second.md").getByText("Complete")).toBeVisible();
  expect(row("third.txt").getByText("Complete")).toBeVisible();
});

test("retry and removal affect only the selected file", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Mixed" }));
  const originalRows = screen.getAllByRole("listitem");
  await user.click(within(originalRows[2]!).getByRole("button", { name: "Retry" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(within(originalRows[1]!).getByText("Complete")).toBeVisible();
  expect(within(originalRows[2]!).getByText("Complete")).toBeVisible();
  await user.click(within(originalRows[2]!).getByRole("button", { name: "Remove" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(within(originalRows[1]!).getByRole("button", { name: "Uploaded" })).toHaveFocus();
  expect(within(originalRows[0]!).getByText("Uploading")).toBeVisible();
});


test("focus stays in the file row when transfer cancellation ends at processing", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "notes.txt")]);
  await user.click(row("notes.txt").getByRole("button", { name: "Upload file" }));
  act(() => row("notes.txt").getByRole("button", { name: "Cancel upload" }).focus());
  expect(row("notes.txt").getByRole("button", { name: "Cancel upload" })).toHaveFocus();
  act(() => vi.advanceTimersByTime(4000));
  expect(row("notes.txt").getByText("Processing file")).toBeVisible();
  expect(row("notes.txt").queryByRole("button", { name: "Cancel upload" })).not.toBeInTheDocument();
  expect(row("notes.txt").getByRole("button", { name: "Processing…" })).toHaveFocus();
});


test("removal focuses the next row, then the previous row, then the picker without scrolling", async () => {
  const user = userEvent.setup();
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt"), new File(["b"], "second.txt"), new File(["c"], "third.txt")]);
  const next = row("third.txt").getByRole("button", { name: "Upload file" });
  const nextFocus = vi.spyOn(next, "focus");
  await user.click(row("second.txt").getByRole("button", { name: "Remove" }));
  expect(next).toHaveFocus();
  expect(nextFocus).toHaveBeenCalledWith({ preventScroll: true });
  const previous = row("first.txt").getByRole("button", { name: "Upload file" });
  const previousFocus = vi.spyOn(previous, "focus");
  await user.click(row("third.txt").getByRole("button", { name: "Remove" }));
  expect(previous).toHaveFocus();
  expect(previousFocus).toHaveBeenCalledWith({ preventScroll: true });
  const picker = screen.getByRole("button", { name: "Add files" });
  const pickerFocus = vi.spyOn(picker, "focus");
  await user.click(row("first.txt").getByRole("button", { name: "Remove" }));
  expect(screen.queryByRole("list", { name: "Selected files" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Choose files" })).toHaveFocus();
  expect(pickerFocus).toHaveBeenCalledWith({ preventScroll: true });
});


test("the batch upload action retains keyboard focus through completion", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt"), new File(["b"], "second.txt")]);
  await user.tab();
  await user.tab();
  const batch = screen.getByRole("button", { name: "Upload 2 files" });
  expect(batch).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "Upload files" })).toHaveFocus();
  expect(batch).toHaveAttribute("aria-disabled", "true");
  act(() => vi.advanceTimersByTime(10000));
  expect(batch).toHaveFocus();
  expect(screen.getAllByText("Complete")).toHaveLength(2);
});

test("retrying a processing failure resumes processing without another transfer", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt")]);
  await user.click(screen.getByRole("button", { name: "Fail processing" }));
  await user.click(row("first.txt").getByRole("button", { name: "Upload file" }));
  act(() => vi.advanceTimersByTime(5000));
  expect(row("first.txt").getByText("Processing interrupted")).toBeVisible();
  await user.click(row("first.txt").getByRole("button", { name: "Retry" }));
  expect(row("first.txt").getByText("Processing file")).toBeVisible();
  expect(row("first.txt").getByRole("progressbar")).not.toHaveAttribute("value");
  act(() => vi.advanceTimersByTime(2500));
  expect(row("first.txt").getByText("Complete")).toBeVisible();
});

test("inspecting one file stops its simulation while siblings continue", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt"), new File(["b"], "second.txt")]);
  await user.click(screen.getByRole("button", { name: "Upload 2 files" }));
  await user.click(screen.getByRole("button", { name: "Inspect ready" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(row("first.txt").getByText("Ready to upload")).toBeVisible();
  expect(row("second.txt").getByText("Complete")).toBeVisible();
});

test("resetting an active batch clears it and a later upload starts normally", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt")]);
  await user.click(row("first.txt").getByRole("button", { name: "Upload file" }));
  act(() => vi.advanceTimersByTime(500));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.queryByRole("list", { name: "Selected files" })).not.toBeInTheDocument();
  select(container, [new File(["b"], "second.txt")]);
  await user.click(row("second.txt").getByRole("button", { name: "Upload file" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(row("second.txt").getByText("Complete")).toBeVisible();
});

test("a delayed clock tick still reports the simulated transfer failure", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { container } = render(<Example />);
  select(container, [new File(["a"], "first.txt")]);
  await user.click(screen.getByRole("button", { name: "Fail transfers" }));
  await user.click(row("first.txt").getByRole("button", { name: "Upload file" }));
  vi.spyOn(performance, "now").mockReturnValue(10000);
  act(() => vi.advanceTimersByTime(100));
  expect(row("first.txt").getByText("Transfer interrupted")).toBeVisible();
  expect(row("first.txt").getByRole("button", { name: "Retry" })).toBeEnabled();
});
