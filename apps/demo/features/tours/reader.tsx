"use client";

import { flushSync } from "react-dom";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useRef, useState, type ReactNode } from "react";
import { CodeReview, Collapsible, CollapsibleContent, CollapsibleTrigger, ContentSections, Prose, RequirementSummary, Section, Text, VerificationSummary, useTheme } from "@anaphor/system";
import type { TourDocument, TourDocumentV2, TourEvidence } from "./document";
import { evidenceApplicability, mergeConcerns } from "./evidence";
import { EvidenceMedia, type CheckEvidenceAsset } from "./evidence-media";

export function TourReader({ document, revision, assetBaseUrl, checkAsset }: {
  document: TourDocument; revision: number; assetBaseUrl?: string; checkAsset?: CheckEvidenceAsset;
}) {
  const { resolvedTheme } = useTheme();
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const evidenceTarget = useRef<string | null>(null);
  function positionEvidence() {
    if (!evidenceTarget.current) return;
    const target = globalThis.document.getElementById(`tour-evidence:${evidenceTarget.current}`);
    target?.scrollIntoView?.({ block: "start" });
    target?.focus({ preventScroll: true });
  }
  function revealEvidence(history: boolean, id: string) {
    evidenceTarget.current = id;
    setRecordsOpen(true);
    if (history) setHistoryOpen(true);
    requestAnimationFrame(positionEvidence);
  }
  function evidenceSettled() {
    requestAnimationFrame(() => { positionEvidence(); evidenceTarget.current = null; });
  }
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const concerns = [...new Set([...mergeConcerns(document), ...unavailable.map((id) => `Required evidence asset ${id} is unavailable. Restore it and refresh the tour.`)])];
  function assetUnavailable(id: string) { setUnavailable((previous) => previous.includes(id) ? previous : [...previous, id]); }
  return <ContentSections className="space-y-12">
    <header className="space-y-6">
      <Text as="h1" variant="display" className="break-words">{document.title}</Text>
      <Text as="p" variant="caption">Tour revision {revision}</Text>
      <Text as="p" variant="body">{document.overview}</Text>
      <SupportingDetails label="Contents and pull requests">
        <TourNavigation sections={document.sections} />
        <ul className="mt-4 space-y-4">
          {document.prs.map((pr) => <li key={pr.url} className="break-all">
            <a href={pr.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{pr.url}</a>
            <Text as="p" variant="caption">Base <code>{pr.base}</code><br />Head <code>{pr.head}</code></Text>
          </li>)}
        </ul>
      </SupportingDetails>
    </header>
    {document.sections.map((section) => <Section key={section.id} id={`tour-section:${section.id}`} aria-labelledby={`tour-heading:${section.id}`} className="space-y-6 scroll-mt-6">
      <Text as="h2" variant="heading" id={`tour-heading:${section.id}`} className="break-words">{section.title}</Text>
      {!("review" in section && section.review) && <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>)}</Prose>}
      {"review" in section && section.review && document.version === 2 && <>
        <RequirementSummary problem={section.review.problem} outcome={section.review.outcome} acceptance={section.review.acceptance} />
        {section.review.steps.map((step, index) => <article key={step.id} id={`tour-step:${section.id}:${step.id}`} className="min-w-0 space-y-5 scroll-mt-24 border-t-[length:var(--anaphor-border-hairline)] border-input-border pt-8">
          <Text as="h3" variant="heading">{index + 1}. {step.title}</Text>
          {step.code && <ReviewCode code={step.code} theme={resolvedTheme === "dark" ? "dark" : "light"} />}
          {step.media.filter((media) => !historicalAsset(document, media.assetId)).map((media) => {
            const asset = document.assets.find((asset) => asset.id === media.assetId);
            return asset ? <EvidenceMedia checkAsset={checkAsset} key={asset.sha256} asset={asset} annotations={media} url={assetBaseUrl ? `${assetBaseUrl}/${asset.id}` : undefined}
              onUnavailable={() => { if (document.evidence.some((record) => record.required && record.assetIds.includes(asset.id) && !document.evidence.some((next) => next.supersedes === record.id))) assetUnavailable(asset.id); }} /> : null;
          })}
          {(!step.code || !step.code.notes.length) && <Text as="p" variant="body">{step.explanation}</Text>}
          <SupportingDetails label="Supporting checks" name={`Supporting checks for ${step.title.toLowerCase()}`}>
            {step.code && step.code.notes.length > 0 && <Text as="p" variant="body">{step.explanation}</Text>}
            <EvidenceReferences ids={step.evidenceIds} document={document} onReveal={revealEvidence} />
          </SupportingDetails>
        </article>)}
      </>}
      {"specs" in section && <SupportingDetails label="Sources and decisions" name={`Sources and decisions for ${section.title.toLowerCase()}`}>
        {"review" in section && section.review && <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</Prose>}
        {!!section.specs.length && <ReferenceLinks title="Specification" links={section.specs} />}
        {!!section.sources.length && <ReferenceLinks title="Implementation" links={section.sources} />}
        {!!section.decisions.length && <div className="space-y-3"><Text as="h3" variant="subheading">Decisions and risks</Text>
          <ul className="list-disc space-y-2 pl-5 text-body">{section.decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul></div>}
        {document.version === 2 && <EvidenceReferences ids={section.evidenceIds} document={document} onReveal={revealEvidence} />}
      </SupportingDetails>}
    </Section>)}
    <aside id="merge-concerns" aria-label="Merge concerns" className="space-y-3 border-y-[length:var(--anaphor-border-hairline)] border-input-border py-6">
      <Text as="h2" variant="heading">Merge concerns</Text>
      {concerns.length ? <ul className="list-disc space-y-2 pl-5 text-ui">{concerns.map((concern) => <li key={concern}>{concern}</li>)}</ul>
        : <Text as="p" variant="body">Required checks have current passing evidence. Review the results and risks before deciding to merge.</Text>}
    </aside>
    {document.version === 2 && <section aria-label="Verification records" className="min-w-0 space-y-4">
      <Text as="h2" variant="heading">Verification records</Text>
      <SupportingDetails label="Current checks and receipts" open={recordsOpen} onOpenChange={open => { evidenceTarget.current = null; setRecordsOpen(open); }} onSettled={evidenceSettled}>
      {document.evidence.filter((record) => !document.evidence.some((next) => next.supersedes === record.id)).map((record) => <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} checkAsset={checkAsset} onUnavailable={assetUnavailable} />)}
      <SupportingDetails label="Full verification history" open={historyOpen} onOpenChange={open => { evidenceTarget.current = null; setHistoryOpen(open); }} onSettled={evidenceSettled}>
        {document.evidence.filter((record) => document.evidence.some((next) => next.supersedes === record.id)).map((record) => <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} checkAsset={checkAsset} onUnavailable={assetUnavailable} />)}
      </SupportingDetails>
      </SupportingDetails>
    </section>}
  </ContentSections>;
}

function ReferenceLinks({ title, links }: { title: string; links: { id: string; label: string; url: string }[] }) {
  return <div className="space-y-3"><Text as="h3" variant="subheading">{title}</Text>
    <ul className="space-y-2">{links.map((link) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 [overflow-wrap:anywhere]">{link.label}</a></li>)}</ul>
  </div>;
}

function EvidenceRecord({ record, document, assetBaseUrl, onUnavailable, checkAsset }: { record: TourEvidence; document: TourDocumentV2; assetBaseUrl?: string; onUnavailable: (id: string) => void; checkAsset?: CheckEvidenceAsset }) {
  const applicability = evidenceApplicability(document, record);
  const successor = document.evidence.find((item) => item.supersedes === record.id);
  const assetIds = [...new Set([...record.assetIds, ...record.sources.flatMap((source) => [source.patchAssetId, ...(source.untrackedAssetIds ?? [])].filter((id): id is string => !!id))])];
  const assets = document.assets.filter((asset) => assetIds.includes(asset.id));
  function renderAsset(asset: TourDocumentV2["assets"][number]) {
    const annotations = document.sections.flatMap((section) => section.review?.steps.flatMap((step) => step.media) ?? []).find((media) => media.assetId === asset.id);
    return <EvidenceMedia annotations={annotations} checkAsset={checkAsset} key={asset.sha256} onUnavailable={() => { if (record.required && !successor) onUnavailable(asset.id); }} asset={asset} url={assetBaseUrl ? `${assetBaseUrl}/${asset.id}` : undefined} />;
  }
  return <div id={`tour-evidence:${record.id}`} tabIndex={-1} className="min-w-0 scroll-mt-24 focus-visible:outline-2 focus-visible:outline-ring">
    <VerificationSummary aria-label={`Verification: ${record.criterion}`} criterion={document.sections.flatMap((section) => section.specs).find((spec) => spec.id === record.criterion)?.label ?? record.criterion}
      result={record.result} applicability={applicability} superseded={!!successor} required={record.required} observed={record.observed} detailsLabel="Execution details, source, and receipts">
    <dl className="space-y-3 text-ui">
      {[["Action", record.action], ["Expected", record.expected], ["Target", record.target], ["Context", record.context], ["Tested", record.testedAt]].map(([label, value]) =>
        <div key={label}><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
      <div><dt className="font-medium">Tested source</dt><dd className="space-y-2">{record.sources.map((source) => <p key={source.pr} className="break-all"><a className="underline underline-offset-4" href={source.pr}>{source.pr}</a><br /><code>{source.head}</code>{source.patchAssetId || source.untrackedAssetIds?.length ? " with retained uncommitted changes" : ""}</p>)}</dd></div>
    </dl>
    {record.assessments.map((assessment) => <p key={`${assessment.pr}:${assessment.head}`} className="break-words text-ui">Applicability reviewed at <code>{assessment.head}</code> on {assessment.assessedAt}: {assessment.rationale}</p>)}
    {assets.filter((asset) => asset.mediaType === "text/plain").map(renderAsset)}
    </VerificationSummary>
    {assets.filter((asset) => asset.mediaType !== "text/plain" && (historicalAsset(document, asset.id) || !document.sections.some((section) => section.review?.steps.some((step) => step.media.some((media) => media.assetId === asset.id))))).map(renderAsset)}
  </div>;
}

function EvidenceReferences({ ids, document, onReveal }: { ids: string[]; document: TourDocumentV2; onReveal: (history: boolean, id: string) => void }) {
  if (!ids.length) return null;
  return <ul aria-label="Supporting checks" className="space-y-2 text-ui">{ids.map((id) => {
    const record = document.evidence.find((record) => record.id === id);
    if (!record) return null;
    const label = document.sections.flatMap((section) => section.specs).find((spec) => spec.id === record.criterion)?.label ?? record.criterion;
    const superseded = document.evidence.some((next) => next.supersedes === id);
    return <li key={id}><a className="inline-block min-h-11 py-3 underline underline-offset-4" href={`#tour-evidence:${id}`} onClick={() => {
      flushSync(() => onReveal(superseded, id));
    }}>{label} · {record.result} · {evidenceApplicability(document, record)}{superseded ? " · superseded (history)" : ""}</a></li>;
  })}</ul>;
}

function TourNavigation({ sections }: { sections: TourDocument["sections"] }) {
  return <nav aria-label="Tour sections" className="border-y-[length:var(--anaphor-border-hairline)] border-input-border py-3">
    <Text as="p" variant="label">Reading sequence</Text>
      <ol className="grid gap-x-6 sm:grid-cols-2">{sections.map((section, index) => <li key={section.id} className="min-w-0"><a href={`#tour-section:${section.id}`} className="block min-h-11 py-3 underline underline-offset-4 [overflow-wrap:anywhere]"><span aria-hidden="true">{index + 1}. </span>{section.title}</a></li>)}</ol>
    <a href="#merge-concerns" className="inline-block min-h-11 py-3 text-ui underline underline-offset-4">Review unresolved checks</a>
  </nav>;
}

function ReviewCode({ code, theme }: { code: NonNullable<NonNullable<TourDocumentV2["sections"][number]["review"]>["steps"][number]["code"]>; theme: "light" | "dark" }) {
  const props = { theme, regions: code.regions, notes: code.notes.map((note) => ({ ...note, children: note.explanation })) };
  if (code.before) return <CodeReview before={code.before} after={code.after} {...props} />;
  if (code.after) return <CodeReview before={null} after={code.after} {...props} />;
  return null;
}

function historicalAsset(document: TourDocumentV2, assetId: string) {
  const references = document.evidence.filter((record) => record.assetIds.includes(assetId));
  return references.length > 0 && references.every((record) => document.evidence.some((next) => next.supersedes === record.id));
}

function SupportingDetails({ label, name, children, open, onOpenChange, onSettled }: { label: string; name?: string; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; onSettled?: () => void }) {
  return <Collapsible open={open} onOpenChange={onOpenChange}>
    <CollapsibleTrigger aria-label={name}><CaretRightIcon aria-hidden="true" />{label}</CollapsibleTrigger>
    <CollapsibleContent keepMounted onTransitionEnd={event => { if (event.target === event.currentTarget) onSettled?.(); }}><div className="min-w-0 space-y-4 py-3">{children}</div></CollapsibleContent>
  </Collapsible>;
}
