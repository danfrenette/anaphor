import { z } from "zod";

const text = z.string().trim().min(1).max(20_000);
const revision = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/, "Use a complete pinned Git commit SHA.");
export const maxDocumentBytes = 1_048_576;
export const tourDocument = z.object({
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
}).strict().superRefine((document, context) => {
  if (new TextEncoder().encode(JSON.stringify(document)).length > maxDocumentBytes) {
    context.addIssue({ code: "custom", message: "Complete document exceeds 1 MiB. Shorten the content before publication." });
  }
  if (new Set(document.sections.map((section) => section.id)).size !== document.sections.length) {
    context.addIssue({ code: "custom", path: ["sections"], message: "Section IDs must be unique." });
  }
  if (new Set(document.prs.map((pr) => pr.url)).size !== document.prs.length) {
    context.addIssue({ code: "custom", path: ["prs"], message: "Participating PR URLs must be unique." });
  }
});

export type TourDocument = z.infer<typeof tourDocument>;
export const publicationResult = z.object({ id: z.uuid(), revision: z.number().int().positive(), url: z.url() });
export const storedTour = publicationResult.extend({ document: tourDocument });
export const deviceClient = (origin: string) => `anaphor-cli:${new URL(origin).origin}`;
export const deviceScope = "tours:read tours:write";
export const sessionLifetime = 24 * 60 * 60;
