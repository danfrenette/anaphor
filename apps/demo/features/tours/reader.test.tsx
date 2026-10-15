import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { tourDocument } from "./document";
import { TourReader } from "./reader";

const pr = "https://github.com/example/project/pull/1";
const document = tourDocument.parse({
  version: 2, title: "Save drafts reliably", overview: "A draft survives closing the editor.",
  prs: [{ url: pr, base: "a".repeat(40), head: "c".repeat(40) }],
  sections: [{ id: "save-draft", title: "Saving a draft", paragraphs: ["The editor writes before closing."],
    specs: [{ id: "save", label: "Draft persistence criterion", url: "https://example.com/spec#save" }],
    sources: [{ id: "editor", label: "Editor save boundary", url: "https://github.com/example/project/blob/" + "c".repeat(40) + "/editor.ts#L12" }],
    decisions: ["Keep persistence with the editor."], evidenceIds: ["reload"] }],
  evidence: [{ id: "reload", criterion: "save", expected: "The draft survives reload.", observed: "Saved text returned after reload.",
    action: "Save, close, reopen", result: "pass", target: "Chromium local build", context: "Owner with a new draft", testedAt: "2026-10-14T12:00:00Z",
    sources: [{ pr, head: "b".repeat(40) }], required: true, assetIds: ["screenshot", "recording"] }],
  assets: [
    { id: "screenshot", mediaType: "image/png", sha256: "a".repeat(64), bytes: 12, description: "Saved draft after reload", caption: "Draft restored", provenance: "agent-browser observed flow" },
    { id: "recording", mediaType: "video/webm", sha256: "b".repeat(64), bytes: 25, description: "Saving and reopening the draft restores the same text.", caption: "Save and reopen", provenance: "agent-browser recording" },
  ],
});

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => vi.unstubAllGlobals());

describe("tour review", () => {
  it("keeps the journey readable and reveals supporting sources and stale evidence on request", async () => {
    render(<TourReader document={document} revision={2} assetBaseUrl="/api/assets" checkAsset={async () => {}} />);
    const user = userEvent.setup();
    expect(screen.queryByRole("link", { name: "Draft persistence criterion" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sources and decisions for saving a draft" }));
    await user.click(screen.getByRole("button", { name: "Current checks and receipts" }));
    expect(screen.getByRole("link", { name: "Draft persistence criterion" })).toHaveAttribute("href", "https://example.com/spec#save");
    expect(screen.getByRole("link", { name: "Editor save boundary" })).toBeVisible();
    expect(screen.getByText("Saved text returned after reload.")).toBeVisible();
    expect(screen.getByText("save: stale evidence.", { exact: true })).toBeVisible();
    expect(screen.getByText(/merge concerns/i)).toBeVisible();
    expect(screen.getByRole("img", { name: "Saved draft after reload" })).toBeVisible();
    expect(screen.getByText("Saving and reopening the draft restores the same text.")).toBeVisible();
  });
});

it("keeps an unavailable required capture visible as a merge concern", () => {
  render(<TourReader document={document} revision={2} assetBaseUrl="/api/assets" />);
  fireEvent.error(screen.getByRole("img", { name: "Saved draft after reload", hidden: true }));
  expect(screen.getByText(/Required evidence asset screenshot is unavailable/)).toBeVisible();
});

it("shows one concern when separate checks for the same criterion both become stale", () => {
  if (document.version !== 2) throw new Error("Expected version 2 fixture");
  const duplicate = tourDocument.parse({ ...document,
    evidence: [...document.evidence, { ...document.evidence[0], id: "another-check" }],
    sections: [{ ...document.sections[0], evidenceIds: ["reload", "another-check"] }],
  });
  render(<TourReader document={duplicate} revision={3} assetBaseUrl="/api/assets" />);
  const concerns = screen.getByRole("complementary", { name: "Merge concerns" });
  expect(within(concerns).getAllByText("save: stale evidence.", { exact: true })).toHaveLength(1);
});

it("reveals a shared execution from each slice without duplicating its record", async () => {
  const repeated = tourDocument.parse({ ...document, sections: [document.sections[0], { ...document.sections[0], id: "reopen", title: "Reopen" }] });
  render(<TourReader document={repeated} revision={2} assetBaseUrl="/api/assets" />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Sources and decisions for saving a draft" }));
  await user.click(screen.getByRole("button", { name: "Sources and decisions for reopen" }));
  await user.click(screen.getAllByRole("link", { name: "Draft persistence criterion · pass · stale" })[0]!);
  expect(screen.getAllByRole("article", { name: "Verification: save" })).toHaveLength(1);
  expect(screen.getAllByRole("link", { name: "Draft persistence criterion · pass · stale" })).toHaveLength(2);
});

it("recognizes required checks linked at review steps and keeps an unproved step visible", () => {
  const reviewed = tourDocument.parse({ ...document, sections: [{ ...document.sections[0], evidenceIds: [], review: {
    problem: "A draft may disappear.", outcome: "The draft survives reopening.", acceptance: ["Save before closing."],
    steps: [{ id: "save", title: "Save", explanation: "Write the draft.", criterionIds: ["save"], evidenceIds: ["reload"] },
      { id: "recover", title: "Recover", explanation: "Report failed writes.", criterionIds: ["save"], evidenceIds: [] }],
  } }] });
  render(<TourReader document={reviewed} revision={2} assetBaseUrl="/api/assets" />);
  const concerns = screen.getByRole("complementary", { name: "Merge concerns" });
  expect(within(concerns).queryByText("Saving a draft: no required evidence is linked.")).not.toBeInTheDocument();
  expect(within(concerns).getByText("Recover: criterion save has no required evidence.")).toBeVisible();
});

it("keeps annotated historical captures in history after a rerun supersedes their proof", async () => {
  if (document.version !== 2) throw new Error("Expected version 2 fixture");
  const reviewed = tourDocument.parse({ ...document,
    sections: [{ ...document.sections[0], evidenceIds: ["rerun"], review: {
      problem: "A draft may disappear.", outcome: "Keep it.", acceptance: ["Save it."], steps: [{ id: "read", title: "Read", explanation: "Inspect proof.", evidenceIds: ["rerun"], media: [{ assetId: "screenshot", sha256: "a".repeat(64), width: 1600, height: 1000, callouts: [{ id: "original", label: "The original restored draft.", x: 0.5, y: 0.5 }] }] }],
    } }], evidence: [...document.evidence, { ...document.evidence[0], id: "rerun", supersedes: "reload", assetIds: [], sources: [{ pr, head: "c".repeat(40) }] }],
  });
  render(<TourReader document={reviewed} revision={3} assetBaseUrl="/api/assets" checkAsset={async () => {}} />);
  expect(screen.getByRole("img", { name: "Saved draft after reload", hidden: true })).not.toBeVisible();
  const user = (await import("@testing-library/user-event")).default.setup();
  await user.click(screen.getByRole("button", { name: "Current checks and receipts" }));
  await user.click(screen.getByRole("button", { name: "Full verification history" }));
  expect(screen.getByRole("img", { name: "Saved draft after reload" })).toBeVisible();
  expect(screen.getByText("The original restored draft.", { exact: true })).toBeVisible();
});

it("keeps an unannotated code step understandable and retains older section context on request", async () => {
  const reviewed = tourDocument.parse({ ...document, sections: [{ ...document.sections[0], review: {
    problem: "A draft may disappear.", outcome: "Keep it.", acceptance: ["Save before closing."], steps: [{
      id: "save", title: "Save", explanation: "Write the draft before closing.", evidenceIds: ["reload"],
      code: { before: null, after: { path: "editor.ts", revision: "c".repeat(40), href: `https://github.com/example/project/blob/${"c".repeat(40)}/editor.ts`, content: "save();" }, regions: [], notes: [] },
    }],
  } }] });
  render(<TourReader document={reviewed} revision={3} checkAsset={async () => {}} />);
  expect(screen.getByText("Write the draft before closing.")).toBeVisible();
  expect(screen.getByText("The editor writes before closing.")).not.toBeVisible();
  await userEvent.setup().click(screen.getByRole("button", { name: "Sources and decisions for saving a draft" }));
  expect(screen.getByText("The editor writes before closing.")).toBeVisible();
});
