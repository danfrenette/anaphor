import type { TourDocument, TourDocumentV2, TourEvidence } from "./document";

export function evidenceApplicability(document: TourDocumentV2, evidence: TourEvidence): "current" | "stale" | "unknown" {
  let unknown = false;
  for (const source of evidence.sources) {
    const current = document.prs.find((pr) => pr.url === source.pr);
    if (!current) { unknown = true; continue; }
    const assessments = evidence.assessments.filter((assessment) => assessment.pr === source.pr && assessment.head === current.head);
    if ((source.patchAssetId || source.untrackedAssetIds?.length) && !assessments.some((assessment) => assessment.retainedChangesIncluded === true)) unknown = true;
    if (current.head !== source.head && !assessments.length) return "stale";
  }
  return unknown ? "unknown" : "current";
}

export function mergeConcerns(document: TourDocument): string[] {
  if (document.version === 1) return ["This text tour has no structured verification evidence."];
  const concerns: string[] = [];
  const superseded = new Set(document.evidence.map((record) => record.supersedes).filter(Boolean));
  const required = document.evidence.filter((record) => record.required && !superseded.has(record.id));
  if (!required.length) concerns.push("No required verification evidence is recorded.");
  for (const section of document.sections) {
    const linkedIds = [...section.evidenceIds, ...(section.review?.steps.flatMap((step) => step.evidenceIds) ?? [])];
    if (!linkedIds.some((id) => required.some((record) => record.id === id))) concerns.push(`${section.title}: no required evidence is linked.`);
    for (const spec of section.specs) if (!required.some((record) => linkedIds.includes(record.id) && record.criterion === spec.id)) concerns.push(`${section.title}: criterion ${spec.id} has no required evidence.`);
    for (const step of section.review?.steps ?? []) {
      for (const criterion of step.criterionIds) if (!required.some((record) => step.evidenceIds.includes(record.id) && record.criterion === criterion)) concerns.push(`${step.title}: criterion ${criterion} has no required evidence.`);
    }
  }
  for (const record of required) {
    if (record.result !== "pass") concerns.push(`${record.criterion}: ${record.result}.`);
    const applicability = evidenceApplicability(document, record);
    if (applicability !== "current") concerns.push(`${record.criterion}: ${applicability} evidence.`);
  }
  return concerns;
}
