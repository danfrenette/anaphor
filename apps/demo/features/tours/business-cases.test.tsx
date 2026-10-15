import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { tourDocument } from "./document";
import { TourReader } from "./reader";
import userEvent from "@testing-library/user-event";

beforeEach(() => { vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }); vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} })); });
afterEach(() => vi.unstubAllGlobals());
const pr = "https://github.com/example/project/pull/1";
const head = "b".repeat(40);
const source = { version: 2, title: "Keep work safe", overview: "Review saved work.", prs: [{ url: pr, base: "a".repeat(40), head }],
  sections: [{ id: "save", title: "Keep drafts after closing", paragraphs: ["Old detailed context."],
    specs: [{ id: "save", label: "Drafts survive reopening", url: "https://example.com/spec" }], evidenceIds: ["saved"],
    review: { summary: "Writers keep their draft when they close the editor.", problem: "Closing can lose draft text.", outcome: "Reopening restores the saved draft.",
      acceptance: ["Restore the saved text."], concerns: ["Offline saving still needs verification."],
      steps: [{ id: "write", title: "Store the draft", explanation: "Write before closing.", criterionIds: ["save"], evidenceIds: ["saved"] },
        { id: "reopen", title: "Restore the draft", explanation: "Load the saved text.", criterionIds: ["save"], evidenceIds: ["saved"] }] } }],
  evidence: [{ id: "saved", criterion: "save", expected: "The draft returns.", observed: "The saved draft returned.", action: "Save and reopen.", result: "pass", target: "Chromium", context: "Writer", testedAt: "2026-10-23T12:00:00Z", required: true, sources: [{ pr, head }] }], assets: [] };

test("case cards expose step counts and explain receipt icons independently of navigation", async () => {
  render(<TourReader document={tourDocument.parse(source)} revision={1} />);
  const contents = screen.getByRole("navigation", { name: "Business cases" });
  expect(within(contents).getByText("2 steps")).toBeVisible();
  const receipt = within(contents).getByRole("button", { name: "Verification receipts for Keep drafts after closing" });
  expect(receipt.closest("a")).toBeNull();
  await userEvent.setup().click(receipt);
  expect(screen.getByRole("dialog")).toHaveTextContent("Recorded checks are available. Inspect their result and source before merging.");
});

test("a verification story explains the goal, method and conclusion before supporting records", () => {
  const original = source.sections[0]!;
  const document = tourDocument.parse({ ...source, sections: [{ ...original, review: {
    ...original.review, verification: { purpose: "The draft must survive closing.", method: "The test saved and reopened a draft.", conclusion: "The saved draft returned. Offline saving remains untested." },
  } }] });
  render(<TourReader document={document} revision={2} />);
  const verification = screen.getByRole("region", { name: "Evidence for Keep drafts after closing" });
  expect(within(verification).getByText("The draft must survive closing.")).toBeVisible();
  expect(within(verification).getByText("The test saved and reopened a draft.")).toBeVisible();
  expect(within(verification).getByText("The saved draft returned. Offline saving remains untested.")).toBeVisible();
  expect(within(verification).getByRole("button", { name: "Verification details for keep drafts after closing" })).toHaveAttribute("aria-expanded", "false");
});

test("evidence explanations open when a pointer hovers over the icon", async () => {
  render(<TourReader document={tourDocument.parse(source)} revision={1} />);
  await userEvent.setup().hover(screen.getByRole("button", { name: "Verification receipts for Keep drafts after closing" }));
  expect(await screen.findByRole("dialog")).toHaveTextContent("Recorded checks are available.");
});

test("one flat verification panel names the requirement and exposes its run, source and environment", async () => {
  const original = source.sections[0]!;
  const document = tourDocument.parse({ ...source,
    sections: [{ ...original, specs: [{ ...original.specs[0], id: "t1", label: "T1: Drafts survive reopening" }], review: { ...original.review, steps: original.review.steps.map(step => ({ ...step, criterionIds: ["t1"] })) } }],
    evidence: [{ ...source.evidence[0], criterion: "t1" }],
  });
  render(<TourReader document={document} revision={3} />);
  const verification = screen.getByRole("region", { name: "Evidence for Keep drafts after closing" });
  await userEvent.setup().click(within(verification).getByRole("button", { name: "Verification details for keep drafts after closing" }));
  expect(within(verification).getByRole("link", { name: "Spec requirement T1" })).toHaveAttribute("href", "https://example.com/spec");
  expect(within(within(verification).getByRole("region", { name: "Recorded check: Drafts survive reopening" })).getByRole("heading", { name: "Drafts survive reopening" })).toBeVisible();
  expect(within(verification).getByText("The draft returns.")).toBeVisible();
  expect(within(verification).getByText(head.slice(0, 8))).toBeVisible();
  expect(within(verification).queryByRole("button", { name: "Run context and source" })).not.toBeInTheDocument();
  await userEvent.setup().hover(within(verification).getByRole("button", { name: "Chromium environment" }));
  expect(await screen.findByRole("dialog")).toHaveTextContent("Chromium");
});

test("case navigation exposes implementation anchors and verification keeps detail behind one disclosure", async () => {
  render(<TourReader document={tourDocument.parse(source)} revision={1} />);
  const navigation = screen.getByRole("navigation", { name: "Tour navigation" });
  expect(within(navigation).getByRole("link", { name: "1. Store the draft" })).toHaveAttribute("href", "#tour-step:save:write");
  expect(within(navigation).getByRole("link", { name: "Verification" })).toHaveAttribute("href", "#tour-verification:save");
  const verification = screen.getByRole("region", { name: "Evidence for Keep drafts after closing" });
  expect(within(verification).getAllByText("The saved draft returned.")[0]!).toBeVisible();
  expect(within(verification).getAllByText("Current pass · required")[0]!).toBeVisible();
  expect(within(verification).getByText("The draft returns.")).not.toBeVisible();
  await userEvent.setup().click(within(verification).getByRole("button", { name: "Verification details for keep drafts after closing" }));
  expect(within(verification).getByText("The draft returns.")).toBeVisible();
  expect(within(verification).queryByRole("button", { name: "Run context and source" })).not.toBeInTheDocument();
  expect(within(verification).getByText(head.slice(0, 8))).toBeVisible();
  expect(within(verification).getByText("2026-10-23 · 12:00 UTC")).toBeVisible();
  expect(screen.getByText("End of case 01")).toBeVisible();
});

test("a business-case summary links to one case with multiple implementation slices and visible concerns", () => {
  const document = tourDocument.parse(source);
  render(<TourReader document={document} revision={1} />);
  const summary = screen.getByRole("navigation", { name: "Business cases" });
  expect(within(summary).getByRole("link", { name: "Keep drafts after closing" })).toHaveAttribute("href", "#tour-section:save");
  expect(within(summary).getByText("Writers keep their draft when they close the editor.")).toBeVisible();
  expect(screen.getByText("Closing can lose draft text.")).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Evidence for Keep drafts after closing" })).getAllByText("The saved draft returned.")[0]!).toBeVisible();
  expect(screen.getByText("Reopening restores the saved draft.")).toBeVisible();
  expect(screen.getByRole("heading", { name: "1. Store the draft" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "2. Restore the draft" })).toBeVisible();
  expect(within(screen.getByRole("complementary", { name: "Open concerns for Keep drafts after closing" })).getByText("Offline saving still needs verification.")).toBeVisible();
  expect(screen.queryByText("Old detailed context.")).not.toBeVisible();
});

test("older version-two and text tours still expose their stable section links", () => {
  const document = tourDocument.parse({ version: 1, title: "Older tour", overview: "An existing explanation.", prs: source.prs,
    sections: [{ id: "old", title: "Existing section", paragraphs: ["Original context."] }] });
  render(<TourReader document={document} revision={1} />);
  expect(screen.getByRole("navigation", { name: "Business cases" })).toContainElement(screen.getByRole("link", { name: "Existing section" }));
  expect(screen.getByText("Original context.")).toBeVisible();
});

test("PR-wide dependencies and rollback remain visible when verification passes", () => {
  const document = tourDocument.parse({ ...source, consequences: { concerns: ["Sharing remains unverified."], dependencies: ["Update the app before installing the skill."], rollout: "Enable local review first.", rollback: "Revert the reader; retain the evidence workspace." } });
  render(<TourReader document={document} revision={1} />);
  const final = screen.getByRole("complementary", { name: "Merge concerns" });
  expect(within(final).getByText("Update the app before installing the skill.")).toBeVisible();
  expect(within(final).getByText("Revert the reader; retain the evidence workspace.")).toBeVisible();
  expect(within(final).getByText("Sharing remains unverified.")).toBeVisible();
});
