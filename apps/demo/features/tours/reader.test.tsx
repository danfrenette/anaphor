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
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => vi.unstubAllGlobals());

describe("tour review", () => {
  it("connects a slice to its spec, code and stale evidence without calling an old pass current", () => {
    render(<TourReader document={document} revision={2} assetBaseUrl="/api/assets" />);
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
  fireEvent.error(screen.getByRole("img", { name: "Saved draft after reload" }));
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

it("shows a shared execution once and links each slice to its canonical record", () => {
  const repeated = tourDocument.parse({ ...document, sections: [document.sections[0], { ...document.sections[0], id: "reopen", title: "Reopen" }] });
  render(<TourReader document={repeated} revision={2} assetBaseUrl="/api/assets" />);
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
