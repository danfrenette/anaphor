import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { AnnotatedScreenshot, VideoEvidence } from "@anaphor/system";

const screenshot = {
  src: "/reader.png",
  alt: "Imported tour reader",
  width: 1200,
  height: 800,
  title: "Local tour",
  description: "The imported tour opens without sign-in.",
  callouts: [{ id: "refresh", label: "Refresh loads the new revision.", x: 0.8, y: 0.1 }],
  enlargeLabel: "Enlarge screenshot",
  closeLabel: "Close screenshot",
  unavailableLabel: "Screenshot unavailable",
};

test("opens the annotated image by keyboard and returns focus after dismissal", async () => {
  const user = userEvent.setup();
  render(<AnnotatedScreenshot {...screenshot} />);
  expect(screen.getByRole("figure", { name: "Local tour" })).toHaveTextContent("The imported tour opens without sign-in.");
  expect(screen.getByRole("img", { name: "Imported tour reader" })).toBeVisible();
  expect(screen.getByRole("list")).toHaveTextContent("Refresh loads the new revision.");
  await user.tab();
  await user.keyboard("{Enter}");
  const dialog = screen.getByRole("dialog", { name: "Local tour" });
  expect(within(dialog).getByRole("img", { name: "Imported tour reader" })).toBeVisible();
  expect(within(dialog).getByRole("button", { name: "Close screenshot" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enlarge screenshot" })).toHaveFocus();
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("button", { name: "Close screenshot" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enlarge screenshot" })).toHaveFocus();
});


test("seeks labelled video moments without starting playback and keeps native controls", async () => {
  const user = userEvent.setup();
  render(<VideoEvidence src="/reader.webm" title="Refresh demonstration" description="The tour stays fixed until Refresh is selected."
    moments={[{ id: "refresh", label: "Select Refresh", seconds: 12.5 }]}
    unavailableLabel="Video unavailable" captions={{ src: "/reader.vtt", srcLang: "en", label: "English" }} />);
  const video = within(screen.getByRole("figure", { name: "Refresh demonstration" })).getByLabelText<HTMLVideoElement>("Refresh demonstration");
  expect(video.controls).toBe(true);
  expect(video.autoplay).toBe(false);
  expect(video.paused).toBe(true);
  await user.click(screen.getByRole("button", { name: "0:12 — Select Refresh" }));
  expect(video.currentTime).toBe(12.5);
  expect(video.paused).toBe(true);
  expect(video).toHaveFocus();
  expect(screen.getByText("The tour stays fixed until Refresh is selected.")).toBeVisible();
});

test("keeps screenshot explanations after a load failure and accepts a replacement asset", () => {
  const onMediaError = vi.fn();
  const { rerender } = render(<AnnotatedScreenshot {...screenshot} onMediaError={onMediaError} />);
  fireEvent.error(screen.getByRole("img", { name: "Imported tour reader" }));
  expect(screen.getByRole("status")).toHaveTextContent("Screenshot unavailable");
  expect(screen.getByText("The imported tour opens without sign-in.")).toBeVisible();
  expect(screen.getByRole("list")).toHaveTextContent("Refresh loads the new revision.");
  expect(screen.queryByRole("button", { name: "Enlarge screenshot" })).not.toBeInTheDocument();
  expect(onMediaError).toHaveBeenCalledOnce();
  rerender(<AnnotatedScreenshot {...screenshot} src="/new-reader.png" onMediaError={onMediaError} />);
  expect(screen.getByRole("img", { name: "Imported tour reader" })).toHaveAttribute("src", "/new-reader.png");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("retains video account and moments when a file fails or has no source", () => {
  const onMediaError = vi.fn();
  const videoProps = { title: "Local refresh", description: "The reader changes only after refresh.",
    moments: [{ id: "updated", seconds: 64, label: "Updated content appears" }], unavailableLabel: "Video unavailable", onMediaError };
  const { rerender } = render(<VideoEvidence {...videoProps} src="/reader.webm" />);
  const figure = screen.getByRole("figure", { name: "Local refresh" });
  fireEvent.error(within(figure).getByLabelText("Local refresh"));
  expect(screen.getByRole("status")).toHaveTextContent("Video unavailable");
  expect(screen.getByText("The reader changes only after refresh.")).toBeVisible();
  expect(screen.getByRole("button", { name: "1:04 — Updated content appears" })).toBeDisabled();
  expect(onMediaError).toHaveBeenCalledOnce();
  rerender(<VideoEvidence {...videoProps} src={null} />);
  expect(screen.getByRole("status")).toHaveTextContent("Video unavailable");
  expect(screen.getByText("The reader changes only after refresh.")).toBeVisible();
  expect(onMediaError).toHaveBeenCalledOnce();
});
