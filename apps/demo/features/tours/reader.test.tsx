import { render, screen } from "@testing-library/react";
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
