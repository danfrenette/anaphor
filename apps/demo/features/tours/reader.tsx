"use client";

import { useState } from "react";
import { ContentSections, Prose, Section, Text } from "@anaphor/system";
import type { TourDocument, TourDocumentV2, TourEvidence } from "./document";
import { evidenceApplicability, mergeConcerns } from "./evidence";
import { EvidenceMedia } from "./evidence-media";

export function TourReader({ document, revision, assetBaseUrl }: {
  document: TourDocument; revision: number; assetBaseUrl?: string;
}) {
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
    <aside aria-label="Merge concerns" className="space-y-3 border-y border-input-border py-6">
      <Text as="h2" variant="heading">Merge concerns</Text>
      {concerns.length ? <ul className="list-disc space-y-2 pl-5 text-ui">
        {concerns.map((concern) => <li key={concern}>{concern}</li>)}
      </ul> : <Text as="p" variant="body">Required checks have current passing evidence. Review the results and risks before deciding to merge.</Text>}
    </aside>
    <nav aria-label="Tour sections" className="border-b border-input-border pb-6">
      <ul className="flex flex-wrap gap-x-6 gap-y-3">
        {document.sections.map((section) => <li key={section.id} className="min-w-0 max-w-full"><a href={`#tour-section:${section.id}`} className="inline-block py-2 underline underline-offset-4 [overflow-wrap:anywhere]">{section.title}</a></li>)}
      </ul>
    </nav>
    {document.sections.map((section) => <Section key={section.id} id={`tour-section:${section.id}`} aria-labelledby={`tour-heading:${section.id}`} className="space-y-6 scroll-mt-6">
      <Text as="h2" variant="heading" id={`tour-heading:${section.id}`} className="break-words">{section.title}</Text>
      <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>)}</Prose>
      {"specs" in section && <>
        {!!section.specs.length && <ReferenceLinks title="Specification" links={section.specs} />}
        {!!section.sources.length && <ReferenceLinks title="Implementation" links={section.sources} />}
        {!!section.decisions.length && <div className="space-y-3"><Text as="h3" variant="subheading">Decisions and risks</Text>
          <ul className="list-disc space-y-2 pl-5 text-body">{section.decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul></div>}
        {document.version === 2 && section.evidenceIds.map((id) => {
          const record = document.evidence.find((item) => item.id === id);
          return record ? <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} onUnavailable={assetUnavailable} /> : null;
        })}
      </>}
    </Section>)}
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
  return <article aria-label={`Verification: ${record.criterion}`} className="space-y-4 border-t border-input-border pt-6">
    <Text as="h3" variant="subheading">Verification: {record.criterion}</Text>
    <p className="text-ui">Recorded result: <strong>{record.result}</strong> · {applicability} evidence{successor ? " · superseded" : ""}{record.required ? " · required" : ""}</p>
    <dl className="space-y-3 text-ui">
      {[["Action", record.action], ["Expected", record.expected], ["Observed", record.observed], ["Target", record.target], ["Context", record.context], ["Tested", record.testedAt]].map(([label, value]) =>
        <div key={label}><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
      <div><dt className="font-medium">Tested source</dt><dd className="space-y-2">{record.sources.map((source) => <p key={source.pr} className="break-all"><a className="underline underline-offset-4" href={source.pr}>{source.pr}</a><br /><code>{source.head}</code>{source.patchAssetId || source.untrackedAssetIds?.length ? " with retained uncommitted changes" : ""}</p>)}</dd></div>
    </dl>
    {record.assessments.map((assessment) => <p key={`${assessment.pr}:${assessment.head}`} className="break-words text-ui">Applicability reviewed at <code>{assessment.head}</code> on {assessment.assessedAt}: {assessment.rationale}</p>)}
    {[...new Set([...record.assetIds, ...record.sources.flatMap((source) => [source.patchAssetId, ...(source.untrackedAssetIds ?? [])].filter((id): id is string => !!id))])].map((id) => {
      const asset = document.assets.find((item) => item.id === id);
      return asset ? <EvidenceMedia key={asset.sha256} onUnavailable={() => { if (record.required && !successor) onUnavailable(asset.id); }} asset={asset} url={assetBaseUrl ? `${assetBaseUrl}/${asset.id}` : undefined} /> : null;
    })}
  </article>;
}
