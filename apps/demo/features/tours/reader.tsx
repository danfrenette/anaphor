"use client";

import { useState } from "react";
import { CodeReview, ContentSections, Prose, RequirementSummary, Section, Text, VerificationSummary, useContentSections, useTheme } from "@anaphor/system";
import type { TourDocument, TourDocumentV2, TourEvidence } from "./document";
import { evidenceApplicability, mergeConcerns } from "./evidence";
import { EvidenceMedia } from "./evidence-media";
import { SliceMap } from "./slice-map";

export function TourReader({ document, revision, assetBaseUrl }: {
  document: TourDocument; revision: number; assetBaseUrl?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const concerns = [...new Set([...mergeConcerns(document), ...unavailable.map((id) => `Required evidence asset ${id} is unavailable. Restore it and refresh the tour.`)])];
  function assetUnavailable(id: string) { setUnavailable((previous) => previous.includes(id) ? previous : [...previous, id]); }
  return <ContentSections className="space-y-12">
    <header className="space-y-6">
      <Text as="h1" variant="display" className="break-words">{document.title}</Text>
      <Text as="p" variant="caption">Tour revision {revision}</Text>
      <Text as="p" variant="body">{document.overview}</Text>
      <details>
        <summary className="cursor-pointer text-ui">Participating pull requests</summary>
        <ul className="mt-4 space-y-4">
          {document.prs.map((pr) => <li key={pr.url} className="break-all">
            <a href={pr.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{pr.url}</a>
            <Text as="p" variant="caption">Base <code>{pr.base}</code><br />Head <code>{pr.head}</code></Text>
          </li>)}
        </ul>
      </details>
    </header>
    <TourNavigation sections={document.sections} />
    {document.sections.map((section) => <Section key={section.id} id={`tour-section:${section.id}`} aria-labelledby={`tour-heading:${section.id}`} className="space-y-6 scroll-mt-6">
      <Text as="h2" variant="heading" id={`tour-heading:${section.id}`} className="break-words">{section.title}</Text>
      <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>)}</Prose>
      {"review" in section && section.review && document.version === 2 && <>
        <RequirementSummary problem={section.review.problem} outcome={section.review.outcome} acceptance={section.review.acceptance} />
        <SliceMap sectionId={section.id} steps={section.review.steps} />
        {section.review.steps.map((step) => <article key={step.id} id={`tour-step:${section.id}:${step.id}`} className="min-w-0 space-y-5 scroll-mt-24 border-t-[length:var(--anaphor-border-hairline)] border-input-border pt-8">
          <Text as="h3" variant="heading">{step.title}</Text>
          <Text as="p" variant="body">{step.explanation}</Text>
          {!!step.criterionIds.length && <p className="text-ui">Criteria: {step.criterionIds.map((id, index) => <span key={id}>{index > 0 && " · "}<a className="underline underline-offset-4" href={section.specs.find((spec) => spec.id === id)?.url}>{section.specs.find((spec) => spec.id === id)?.label}</a></span>)}</p>}
          {step.code && <ReviewCode code={step.code} theme={resolvedTheme === "dark" ? "dark" : "light"} />}
          {step.media.map((media) => {
            const asset = document.assets.find((asset) => asset.id === media.assetId);
            return asset ? <EvidenceMedia key={asset.sha256} asset={asset} annotations={media} url={assetBaseUrl ? `${assetBaseUrl}/${asset.id}` : undefined}
              onUnavailable={() => { if (document.evidence.some((record) => record.required && record.assetIds.includes(asset.id) && !document.evidence.some((next) => next.supersedes === record.id))) assetUnavailable(asset.id); }} /> : null;
          })}
          <EvidenceReferences ids={step.evidenceIds} document={document} />
        </article>)}
      </>}
      {"specs" in section && <>
        {!!section.specs.length && <ReferenceLinks title="Specification" links={section.specs} />}
        {!!section.sources.length && <ReferenceLinks title="Implementation" links={section.sources} />}
        {!!section.decisions.length && <div className="space-y-3"><Text as="h3" variant="subheading">Decisions and risks</Text>
          <ul className="list-disc space-y-2 pl-5 text-body">{section.decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul></div>}
        {document.version === 2 && <EvidenceReferences ids={section.evidenceIds} document={document} />}
      </>}
      <SectionMovement sections={document.sections} id={section.id} />
    </Section>)}
    <aside id="merge-concerns" aria-label="Merge concerns" className="space-y-3 border-y-[length:var(--anaphor-border-hairline)] border-input-border py-6">
      <Text as="h2" variant="heading">Merge concerns</Text>
      {concerns.length ? <ul className="list-disc space-y-2 pl-5 text-ui">{concerns.map((concern) => <li key={concern}>{concern}</li>)}</ul>
        : <Text as="p" variant="body">Required checks have current passing evidence. Review the results and risks before deciding to merge.</Text>}
    </aside>
    {document.version === 2 && <section aria-label="Verification records" className="min-w-0 space-y-4">
      <Text as="h2" variant="heading">Verification records</Text>
      <p className="text-ui">Each run appears once. Recorded results, source applicability, and supersession describe separate facts.</p>
      {document.evidence.filter((record) => !document.evidence.some((next) => next.supersedes === record.id)).map((record) => <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} onUnavailable={assetUnavailable} />)}
      <details><summary className="min-h-11 cursor-pointer py-3 text-ui">Full verification history</summary>
        {document.evidence.filter((record) => document.evidence.some((next) => next.supersedes === record.id)).map((record) => <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} onUnavailable={assetUnavailable} />)}
      </details>
    </section>}
  </ContentSections>;
}

function ReferenceLinks({ title, links }: { title: string; links: { id: string; label: string; url: string }[] }) {
  return <div className="space-y-3"><Text as="h3" variant="subheading">{title}</Text>
    <ul className="space-y-2">{links.map((link) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 [overflow-wrap:anywhere]">{link.label}</a></li>)}</ul>
  </div>;
}

function EvidenceRecord({ record, document, assetBaseUrl, onUnavailable }: { record: TourEvidence; document: TourDocumentV2; assetBaseUrl?: string; onUnavailable: (id: string) => void }) {
  const applicability = evidenceApplicability(document, record);
  const successor = document.evidence.find((item) => item.supersedes === record.id);
  return <div id={`tour-evidence:${record.id}`} className="min-w-0 scroll-mt-24">
    <VerificationSummary aria-label={`Verification: ${record.criterion}`} criterion={document.sections.flatMap((section) => section.specs).find((spec) => spec.id === record.criterion)?.label ?? record.criterion}
      result={record.result} applicability={applicability} superseded={!!successor} required={record.required} observed={record.observed} detailsLabel="Execution details, source, and receipts">
    <dl className="space-y-3 text-ui">
      {[["Action", record.action], ["Expected", record.expected], ["Target", record.target], ["Context", record.context], ["Tested", record.testedAt]].map(([label, value]) =>
        <div key={label}><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
      <div><dt className="font-medium">Tested source</dt><dd className="space-y-2">{record.sources.map((source) => <p key={source.pr} className="break-all"><a className="underline underline-offset-4" href={source.pr}>{source.pr}</a><br /><code>{source.head}</code>{source.patchAssetId || source.untrackedAssetIds?.length ? " with retained uncommitted changes" : ""}</p>)}</dd></div>
    </dl>
    {record.assessments.map((assessment) => <p key={`${assessment.pr}:${assessment.head}`} className="break-words text-ui">Applicability reviewed at <code>{assessment.head}</code> on {assessment.assessedAt}: {assessment.rationale}</p>)}
    </VerificationSummary>
    {[...new Set([...record.assetIds, ...record.sources.flatMap((source) => [source.patchAssetId, ...(source.untrackedAssetIds ?? [])].filter((id): id is string => !!id))])].map((id) => {
      const asset = document.assets.find((item) => item.id === id);
      return asset ? <EvidenceMedia key={asset.sha256} onUnavailable={() => { if (record.required && !successor) onUnavailable(asset.id); }} asset={asset} url={assetBaseUrl ? `${assetBaseUrl}/${asset.id}` : undefined} /> : null;
    })}
  </div>;
}

function EvidenceReferences({ ids, document }: { ids: string[]; document: TourDocumentV2 }) {
  if (!ids.length) return null;
  return <ul aria-label="Supporting checks" className="space-y-2 text-ui">{ids.map((id) => {
    const record = document.evidence.find((record) => record.id === id);
    if (!record) return null;
    const label = document.sections.flatMap((section) => section.specs).find((spec) => spec.id === record.criterion)?.label ?? record.criterion;
    const superseded = document.evidence.some((next) => next.supersedes === id);
    return <li key={id}><a className="inline-block min-h-11 py-3 underline underline-offset-4" href={`#tour-evidence:${id}`} onClick={() => {
      const target = globalThis.document.getElementById(`tour-evidence:${id}`);
      const disclosure = target?.closest("details");
      if (disclosure) disclosure.open = true;
    }}>{label} · {record.result} · {evidenceApplicability(document, record)}{superseded ? " · superseded (history)" : ""}</a></li>;
  })}</ul>;
}

function TourNavigation({ sections }: { sections: TourDocument["sections"] }) {
  const { activeId } = useContentSections();
  return <nav aria-label="Tour sections" className="border-y-[length:var(--anaphor-border-hairline)] border-input-border py-3">
    <Text as="p" variant="label">Reading sequence</Text>
      <ol className="grid gap-x-6 sm:grid-cols-2">{sections.map((section, index) => <li key={section.id} className="min-w-0"><a aria-current={activeId === `tour-section:${section.id}` ? "location" : undefined} href={`#tour-section:${section.id}`} className="block min-h-11 py-3 underline underline-offset-4 [overflow-wrap:anywhere]"><span aria-hidden="true">{index + 1}. </span>{section.title}</a></li>)}</ol>
    <a href="#merge-concerns" className="inline-block min-h-11 py-3 text-ui underline underline-offset-4">Review unresolved checks</a>
  </nav>;
}

function SectionMovement({ sections, id }: { sections: TourDocument["sections"]; id: string }) {
  const index = sections.findIndex((section) => section.id === id);
  const before = sections[index - 1];
  const after = sections[index + 1];
  return <nav aria-label={`Continue from ${sections[index]?.title}`} className="flex flex-wrap justify-between gap-4 border-t-[length:var(--anaphor-border-hairline)] border-input-border pt-4 text-ui">
    {before && <a href={`#tour-section:${before.id}`} className="min-h-11 py-3 underline underline-offset-4">Previous: {before.title}</a>}
    {after && <a href={`#tour-section:${after.id}`} className="min-h-11 py-3 underline underline-offset-4">Next: {after.title}</a>}
  </nav>;
}

function ReviewCode({ code, theme }: { code: NonNullable<NonNullable<TourDocumentV2["sections"][number]["review"]>["steps"][number]["code"]>; theme: "light" | "dark" }) {
  const props = { theme, regions: code.regions, notes: code.notes.map((note) => ({ ...note, children: note.explanation })) };
  if (code.before) return <CodeReview before={code.before} after={code.after} {...props} />;
  if (code.after) return <CodeReview before={null} after={code.after} {...props} />;
  return null;
}
