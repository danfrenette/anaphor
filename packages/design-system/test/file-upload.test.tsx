import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ButtonLabel, FileUpload, FileUploadDropzone, FileUploadProgress, FileUploadTrigger } from "@anaphor/system";

const files = [new File(["one"], "one.txt"), new File(["two"], "two.md")];
const transfer = { files, items: files.map(() => ({ kind: "file" })), dropEffect: "none" };

test("picker and drop deliver every candidate, and same-file reselection works", async () => {
  const selected = vi.fn();
  const user = userEvent.setup();
  const ref = createRef<HTMLButtonElement>();
  const { container } = render(<FileUpload multiple={true} onFilesSelected={selected}>
    <FileUploadDropzone data-testid="drop"><span>Drop files</span></FileUploadDropzone>
    <FileUploadTrigger ref={ref} size="md" shape="square" tone="accent" variant="solid" loading={false} iconOnly={false}><ButtonLabel>Choose files</ButtonLabel></FileUploadTrigger>
  </FileUpload>);
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  expect(input.multiple).toBe(true);
  expect(ref.current).toBe(screen.getByRole("button", { name: "Choose files" }));
  await user.upload(input, files);
  expect(selected).toHaveBeenLastCalledWith(files);
  expect(input.value).toBe("");
  await user.upload(input, files);
  expect(selected).toHaveBeenCalledTimes(2);
  fireEvent.drop(screen.getByTestId("drop"), { dataTransfer: transfer });
  expect(selected).toHaveBeenLastCalledWith(files);
  expect(selected).toHaveBeenCalledTimes(3);
  fireEvent(input, new Event("cancel"));
  expect(selected).toHaveBeenCalledTimes(3);
});

test("nested drag hover stays stable; disabled and non-file drops never select or navigate", () => {
  const selected = vi.fn();
  function Example({ disabled }: { disabled: boolean }) {
    return <FileUpload multiple={true} disabled={disabled} onFilesSelected={selected}>
      <FileUploadDropzone data-testid="drop"><span>Nested child</span></FileUploadDropzone>
    </FileUpload>;
  }
  const { rerender } = render(<Example disabled={false} />);
  const drop = screen.getByTestId("drop");
  fireEvent.dragEnter(drop, { dataTransfer: transfer });
  fireEvent.dragEnter(screen.getByText("Nested child"), { dataTransfer: transfer });
  fireEvent.dragLeave(screen.getByText("Nested child"), { dataTransfer: transfer });
  expect(drop).toHaveAttribute("data-dragging");
  fireEvent.dragLeave(drop, { dataTransfer: transfer });
  expect(drop).not.toHaveAttribute("data-dragging");
  fireEvent.dragEnter(drop, { dataTransfer: transfer });
  rerender(<Example disabled={true} />);
  expect(screen.getByTestId("drop")).not.toHaveAttribute("data-dragging");
  fireEvent.drop(screen.getByTestId("drop"), { dataTransfer: transfer });
  expect(selected).not.toHaveBeenCalled();
  rerender(<Example disabled={false} />);
  expect(fireEvent.drop(screen.getByTestId("drop"), { dataTransfer: { files: [], items: [{ kind: "string" }] } })).toBe(false);
  expect(selected).not.toHaveBeenCalled();
});

test("consumer can handle a drop itself without a duplicate selection", () => {
  const selected = vi.fn();
  render(<FileUpload multiple={false} onFilesSelected={selected}>
    <FileUploadDropzone data-testid="drop" onDrop={event => event.preventDefault()} />
  </FileUpload>);
  fireEvent.drop(screen.getByTestId("drop"), { dataTransfer: transfer });
  expect(selected).not.toHaveBeenCalled();
});

test("known progress is bounded and unknown progress omits the numerical value", () => {
  const { rerender } = render(<FileUploadProgress value={150} max={100} label="Uploading one.txt" valueText="100 bytes transferred" />);
  const progress = screen.getByRole("progressbar", { name: "Uploading one.txt" });
  expect(progress).toHaveAttribute("value", "100");
  expect(progress).toHaveAttribute("aria-valuetext", "100 bytes transferred");
  expect(progress).not.toHaveAttribute("aria-live");
  rerender(<FileUploadProgress value={null} max={100} label="Processing one.txt" />);
  expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
  rerender(<FileUploadProgress value={-10} max={100} label="Uploading one.txt" />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
});


test("changing selection availability preserves composed content and focus", async () => {
  const user = userEvent.setup();
  function Example({ disabled }: { disabled: boolean }) {
    return <FileUpload multiple={true} disabled={disabled} onFilesSelected={() => {}}>
      <FileUploadDropzone><input aria-label="Consumer notes" defaultValue="" /></FileUploadDropzone>
    </FileUpload>;
  }
  const { rerender } = render(<Example disabled={false} />);
  const notes = screen.getByRole("textbox", { name: "Consumer notes" });
  await user.type(notes, "Keep my notes");
  rerender(<Example disabled={true} />);
  expect(notes).toHaveValue("Keep my notes");
  expect(notes).toHaveFocus();
  rerender(<Example disabled={false} />);
  expect(screen.getByRole("textbox", { name: "Consumer notes" })).toBe(notes);
  expect(notes).toHaveValue("Keep my notes");
  expect(notes).toHaveFocus();
});
