import { expect, test } from "vitest";
import { tourDocument } from "./document";

const base = { version: 2, title: "Review local import", overview: "Keep PR evidence together.", prs: [{ url: "https://github.com/example/app/pull/1", base: "a".repeat(40), head: "b".repeat(40) }], sections: [{ id: "import", title: "Import", paragraphs: ["Read a stable local tour."], review: { problem: "Evidence is scattered.", outcome: "Read one local tour.", acceptance: ["The tour opens without sign-in."], steps: [{ id: "validate", title: "Validate", explanation: "Reject invalid content before storing it.", evidenceIds: ["missing"] }] } }] };

test("review steps cannot silently refer to missing proof", () => {
  const result = tourDocument.safeParse(base);
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.message).toContain("missing evidence missing");
});

test("a declarative review survives document validation without losing its stable step anchor", () => {
  const parsed = tourDocument.parse({ ...base, sections: [{ ...base.sections[0], review: { ...base.sections[0]!.review, steps: [{ ...base.sections[0]!.review.steps[0], evidenceIds: [] }] } }] });
  expect(parsed.sections[0]).toHaveProperty("review.steps.0.id", "validate");
});

const review = { problem: "Evidence is scattered.", outcome: "Read one tour.", acceptance: ["Keep source pinned."], steps: [{ id: "read", title: "Read", explanation: "Inspect the captured source.", code: { before: null, after: { path: "file.ts", revision: "b".repeat(40), content: "export const saved = true;", href: `https://github.com/example/app/blob/${"b".repeat(40)}/file.ts` }, regions: [{ id: "write", label: "Save", side: "after", startLine: 1, endLine: 8 }], notes: [] } }] };
test("code annotations cannot point past the captured file", () => {
  const result = tourDocument.safeParse({ ...base, sections: [{ ...base.sections[0], review }] });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.message).toContain("outside its captured source");
});
test("annotations remain bound to the exact immutable asset bytes", () => {
  const result = tourDocument.safeParse({ ...base, sections: [{ ...base.sections[0], review: { ...review, steps: [{ id: "read", title: "Read", explanation: "Inspect proof.", media: [{ assetId: "missing", sha256: "a".repeat(64), width: 1200, height: 800 }] }] } }] });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.message).toContain("exact asset missing");
});

test("duplicate authored code IDs cannot redirect a region jump to another range", () => {
  const step = review.steps[0]!;
  const region = { id: "same", label: "Line", side: "after", startLine: 1, endLine: 1 };
  const result = tourDocument.safeParse({ ...base, sections: [{ ...base.sections[0], review: { ...review, steps: [{ ...step, code: { ...step.code, regions: [region, region] } }] } }] });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.message).toContain("Code annotation IDs must be unique");
});
