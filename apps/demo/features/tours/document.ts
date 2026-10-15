import { z } from "zod";

const text = z.string().trim().min(1).max(20_000);
const revision = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/, "Use a complete pinned Git commit SHA.");
export const maxDocumentBytes = 1_048_576;
const versionOne = z.object({
  version: z.literal(1),
  title: text.max(200),
  overview: text,
  prs: z.array(z.object({
    url: z.url().regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/[1-9][0-9]*$/),
    base: revision,
    head: revision,
  }).strict()).min(1).max(30),
  sections: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/),
    title: text.max(200),
    paragraphs: z.array(text).min(1).max(50),
  }).strict()).min(1).max(50),
}).strict();
const id = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const pr = z.object({ url: z.url().regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/[1-9][0-9]*$/), base: revision, head: revision }).strict();
const link = z.object({ id, label: text.max(200), url: z.url().refine((value) => new URL(value).protocol === "https:", "Use an HTTPS source or spec link.") }).strict();
export const tourAsset = z.object({
  id, mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "video/webm", "video/mp4", "text/plain"]),
  sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().int().positive().max(100 * 1024 * 1024),
  description: text, caption: text, provenance: text,
}).strict();
export const tourEvidence = z.object({
  id, criterion: text, expected: text, observed: text, action: text,
  result: z.enum(["pass", "fail", "blocked", "not run"]), target: text, context: text,
  testedAt: z.iso.datetime(), required: z.boolean(), assetIds: z.array(id).max(100).default([]),
  sources: z.array(z.object({ pr: pr.shape.url, head: revision, patchAssetId: id.optional(), untrackedAssetIds: z.array(id).max(100).optional() }).strict()).min(1).max(30),
  supersedes: id.optional(),
  assessments: z.array(z.object({ pr: pr.shape.url, head: revision, rationale: text, assessedAt: z.iso.datetime(), retainedChangesIncluded: z.boolean().optional() }).strict()).max(100).default([]),
}).strict();
export const tourDocumentV2 = z.object({
  version: z.literal(2), title: text.max(200), overview: text, prs: z.array(pr).min(1).max(30),
  sections: z.array(z.object({ id, title: text.max(200), paragraphs: z.array(text).min(1).max(50),
    specs: z.array(link).max(100).default([]), sources: z.array(link).max(100).default([]),
    decisions: z.array(text).max(50).default([]), evidenceIds: z.array(id).max(100).default([]),
  }).strict()).min(1).max(50),
  evidence: z.array(tourEvidence).max(1000).default([]), assets: z.array(tourAsset).max(300).default([]),
}).strict();
export const tourDocument = z.discriminatedUnion("version", [versionOne, tourDocumentV2]).superRefine((document, context) => {
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  if (new TextEncoder().encode(JSON.stringify(document)).length > maxDocumentBytes) issue("Complete document exceeds 1 MiB. Shorten its content.");
  for (const [label, values] of [["Section", document.sections.map((item) => item.id)], ["PR", document.prs.map((item) => item.url)]] as const) {
    if (new Set(values).size !== values.length) issue(`${label} IDs must be unique.`);
  }
  if (document.version !== 2) return;
  for (const [label, values] of [["Evidence", document.evidence.map((item) => item.id)], ["Asset", document.assets.map((item) => item.id)]] as const) {
    if (new Set(values).size !== values.length) issue(`${label} IDs must be unique.`);
  }
  const assets = new Set(document.assets.map((item) => item.id));
  const evidence = new Set(document.evidence.map((item) => item.id));
  const prs = new Set(document.prs.map((item) => item.url));
  for (const section of document.sections) for (const ref of section.evidenceIds) if (!evidence.has(ref)) issue(`Section ${section.id} references missing evidence ${ref}.`);
  for (const record of document.evidence) {
    for (const source of record.sources) {
      if (!prs.has(source.pr)) issue(`Evidence ${record.id} references an unknown PR.`);
      for (const ref of [source.patchAssetId, ...(source.untrackedAssetIds ?? [])]) if (ref && !assets.has(ref)) issue(`Missing source-state asset ${ref}.`);
    }
    for (const ref of record.assetIds) if (!assets.has(ref)) issue(`Evidence ${record.id} references missing asset ${ref}.`);
    if (record.supersedes) {
      const previous = document.evidence.find((item) => item.id === record.supersedes);
      if (!previous) issue(`Missing superseded evidence ${record.supersedes}.`);
      else if (previous.criterion !== record.criterion || (previous.required && !record.required)) issue("Superseding evidence must retain its criterion and required status.");
      const seen = new Set([record.id]);
      let cursor: typeof previous = previous;
      while (cursor) {
        if (seen.has(cursor.id)) { issue("Evidence supersession must not contain cycles."); break; }
        seen.add(cursor.id);
        cursor = document.evidence.find((item) => item.id === cursor?.supersedes);
      }
    }
  }
});
export type TourDocumentV2 = z.infer<typeof tourDocumentV2>;
export type TourAsset = z.infer<typeof tourAsset>;
export type TourEvidence = z.infer<typeof tourEvidence>;
export type TourDocument = z.infer<typeof tourDocument>;
export const publicationResult = z.object({ id: z.uuid(), revision: z.number().int().positive(), url: z.url() });
export const storedTour = publicationResult.extend({ document: tourDocument });
export const deviceClient = (origin: string) => `anaphor-cli:${new URL(origin).origin}`;
export const deviceScope = "tours:read tours:write";
export const sessionLifetime = 24 * 60 * 60;
