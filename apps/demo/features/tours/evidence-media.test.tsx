import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { TourAsset } from "./document";
import { EvidenceMedia } from "./evidence-media";

const asset: TourAsset = {
  id: "capture", mediaType: "image/png", sha256: "a".repeat(64), bytes: 12,
  caption: "Saved draft", description: "The draft returns after reload.", provenance: "Chromium, tested revision abc",
};
const checkAsset = async () => {};
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test("screenshot selection and provenance remain available through shared viewer tabs and focus return", async () => {
  const user = userEvent.setup();
  render(<EvidenceMedia asset={asset} url="/capture.png" checkAsset={checkAsset} annotations={{
    assetId: asset.id, sha256: asset.sha256, width: 1600, height: 1000,
    callouts: [{ id: "saved", label: "The saved text returned.", x: 0.4, y: 0.6 }], moments: [],
  }} />);
  await user.click(screen.getByRole("button", { name: "The saved text returned." }));
  const opener = screen.getByRole("button", { name: "Enlarge Saved draft" });
  await user.click(opener);
  const viewer = await screen.findByRole("dialog", { name: "Saved draft" });
  expect(within(viewer).getByRole("button", { name: "The saved text returned." })).toHaveAttribute("aria-pressed", "true");
  await user.click(within(viewer).getByRole("button", { name: "Actual size" }));
  await user.click(within(viewer).getByRole("button", { name: "The saved text returned." }));
  await user.click(within(viewer).getByRole("tab", { name: "Evidence" }));
  expect(await within(viewer).findByText(asset.provenance)).toBeVisible();
  await user.click(within(viewer).getByRole("tab", { name: "Annotations" }));
  expect(await within(viewer).findByRole("button", { name: "The saved text returned." })).toHaveAttribute("aria-pressed", "true");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(opener).toHaveFocus());
  expect(screen.getByRole("button", { name: "The saved text returned." })).toHaveAttribute("aria-pressed", "true");
});

test("missing receipt reports required evidence failure and a refreshed source can recover", async () => {
  const unavailable = vi.fn();
  const reject = async () => { throw new Error("Missing receipt"); };
  const receipt: TourAsset = { ...asset, mediaType: "text/plain" };
  const view = render(<EvidenceMedia asset={receipt} url="/revision/1/receipt.txt" checkAsset={reject} onUnavailable={unavailable} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Evidence unavailable: Saved draft");
  expect(unavailable).toHaveBeenCalledOnce();
  expect(screen.getByText(asset.provenance)).toBeVisible();
  view.rerender(<EvidenceMedia asset={receipt} url="/revision/2/receipt.txt" checkAsset={checkAsset} onUnavailable={unavailable} />);
  expect(screen.getByRole("link", { name: "Open Saved draft" })).toHaveAttribute("href", "/revision/2/receipt.txt");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("cancelled checks do not report old media failures after a source replacement", async () => {
  const unavailable = vi.fn();
  let reject: ((reason: Error) => void) | undefined;
  const pending = (_url: string, signal: AbortSignal) => new Promise<void>((_resolve, fail) => {
    reject = fail;
    signal.addEventListener("abort", () => fail(new Error("Aborted")));
  });
  const view = render(<EvidenceMedia asset={asset} url="/old.png" checkAsset={pending} onUnavailable={unavailable} />);
  view.rerender(<EvidenceMedia asset={asset} url="/new.png" checkAsset={checkAsset} onUnavailable={unavailable} />);
  reject?.(new Error("Old failure"));
  await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringMatching(/\/new\.png$/)));
  expect(unavailable).not.toHaveBeenCalled();
});

test("decode failure retains authored explanation and disables enlargement", () => {
  const unavailable = vi.fn();
  render(<EvidenceMedia asset={asset} url="/capture.png" checkAsset={checkAsset} onUnavailable={unavailable} />);
  fireEvent.error(screen.getByRole("img"));
  expect(unavailable).toHaveBeenCalledOnce();
  expect(screen.getByRole("alert")).toHaveTextContent("Restore the asset and refresh the tour.");
  expect(screen.getByText(asset.description)).toBeVisible();
  expect(screen.getByRole("button", { name: "Enlarge Saved draft" })).toBeDisabled();
});

test("recording moments seek inline playback without autoplay or a lossy playback handoff", async () => {
  const videoAsset: TourAsset = { ...asset, mediaType: "video/webm" };
  const view = render(<EvidenceMedia asset={videoAsset} url="/capture.webm" checkAsset={checkAsset} annotations={{
    assetId: asset.id, sha256: asset.sha256, callouts: [],
    moments: [{ id: "reloaded", label: "Reload completes", seconds: 2.5 }],
  }} />);
  const video = view.container.querySelector("video");
  expect(video).not.toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "0:02.5 — Reload completes" }));
  expect(video?.currentTime).toBe(2.5);
  expect(video).toHaveFocus();
  expect(video).not.toHaveAttribute("autoplay");
  expect(screen.queryByRole("button", { name: "Enlarge Saved draft" })).not.toBeInTheDocument();
});
