"use client";

import { flushSync } from "react-dom";
import { ArrowRightIcon, CaretRightIcon, ClipboardTextIcon, FileCodeIcon, ImageIcon, VideoCameraIcon } from "@phosphor-icons/react";
import { useRef, useState, type ReactNode } from "react";
import { Card, Popover, PopoverTrigger, PopoverPopup, PopoverBody, PopoverTitle, PopoverDescription, Collapsible, CollapsibleContent, CollapsibleTrigger, ContentSections, Prose, Section, Text, Badge } from "@anaphor/system";
import type { TourDocument, TourDocumentV2, TourEvidence } from "./document";
import { evidenceApplicability, mergeConcerns, sectionConcerns } from "./evidence";
import { VerificationDetails, evidenceTitle, describeConcern } from "./verification-details";
import { TourNavigation } from "./tour-navigation";
import { ReviewCode } from "./review-code";
import { EvidenceMedia, type CheckEvidenceAsset } from "./evidence-media";

export function TourReader({ document, revision, assetBaseUrl, checkAsset }: {
  document: TourDocument; revision: number; assetBaseUrl?: string; checkAsset?: CheckEvidenceAsset;
}) {
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const evidenceTarget = useRef<string | null>(null);
  function positionEvidence() {
    if (!evidenceTarget.current) return false;
    const target = globalThis.document.getElementById(`tour-evidence:${evidenceTarget.current}`);
    target?.scrollIntoView?.({ block: "start" });
    target?.focus({ preventScroll: true });
    return target !== null && globalThis.document.activeElement === target;
  }
  function revealEvidence(history: boolean, id: string) {
    evidenceTarget.current = id;
    setRecordsOpen(true);
    if (history) setHistoryOpen(true);
    requestAnimationFrame(positionEvidence);
  }
  function evidenceSettled() {
    requestAnimationFrame(() => { if (positionEvidence()) evidenceTarget.current = null; });
  }
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const concerns = [...new Set([...mergeConcerns(document), ...unavailable.map((id) => `Required evidence asset ${id} is unavailable. Restore it and refresh the tour.`)])];
  function assetUnavailable(id: string) { setUnavailable((previous) => previous.includes(id) ? previous : [...previous, id]); }
  return <ContentSections className="space-y-12">
    <header className="space-y-6">
      <Text as="h1" variant="display" className="break-words">{document.title}</Text>
      <Text as="p" variant="caption">Tour revision {revision}</Text>
      <Text as="p" variant="body">{document.overview}</Text>
      <section aria-label="Pull requests" className="space-y-4">
        <Text as="h2" variant="heading">Pull requests</Text>
        <div className="grid gap-4 md:grid-cols-2">{document.prs.map(pr => <Card key={pr.url} variant="default" className="space-y-4 bg-background p-6">
          <a href={pr.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-4 text-body font-medium underline-offset-4 hover:underline">
            {prLabel(pr.url)}<ArrowRightIcon size={20} aria-hidden="true" />
          </a>
          <Text as="p" variant="caption">Source pinned for this tour</Text>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-ui">{(["base", "head"] as const).map(side => <div key={side} className="flex items-center gap-3">
            <dt className="text-muted-foreground">{side === "base" ? "Base" : "Head"}</dt>
            <dd><a title={pr[side]} href={pr.url.replace(/\/pull\/\d+$/, `/commit/${pr[side]}`)} className="inline-flex min-h-11 items-center font-mono underline underline-offset-4">{pr[side].slice(0, 8)}</a></dd>
          </div>)}</dl>
        </Card>)}</div>
      </section>
    </header>
    <BusinessCases sections={document.sections} />
    <div className="grid items-start gap-8 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-12">
    <TourNavigation sections={document.sections} concernIds={document.version === 2 ? document.sections.filter(section => sectionConcerns(document, section).length > 0).map(section => section.id) : []} />
    <div className="min-w-0 space-y-24">
    {document.sections.map((section, caseIndex) => <Section key={section.id} id={`tour-section:${section.id}`} aria-labelledby={`tour-heading:${section.id}`} className="min-w-0 space-y-12 scroll-mt-40 lg:scroll-mt-6">
      <header className="space-y-4">
      <Text as="p" variant="label" className="text-muted-foreground">Business case {String(caseIndex + 1).padStart(2, "0")}</Text>
      <Text as="h2" variant="display" id={`tour-heading:${section.id}`} className="break-words text-[length:var(--text-title-small)] leading-[1.1] lg:text-[40px] lg:leading-[44px]">{section.title}</Text>
      {"review" in section && section.review?.summary && <Text as="p" variant="description">{section.review.summary}</Text>}
      </header>
      {!("review" in section && section.review) && <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>)}</Prose>}
      {"review" in section && section.review && document.version === 2 && <>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2"><Text as="h3" variant="label">Before</Text><Text as="p" variant="body">{section.review.problem}</Text></div>
          <div className="space-y-2"><Text as="h3" variant="label">After</Text><Text as="p" variant="body">{section.review.outcome}</Text></div>
          <div className="md:col-span-2"><SupportingDetails label="Acceptance conditions"><ul className="list-disc space-y-2 pl-5 text-body">{section.review.acceptance.map((condition) => <li key={condition}>{condition}</li>)}</ul></SupportingDetails></div>
        </div>
        {section.review.steps.map((step, index) => <article key={step.id} id={`tour-step:${section.id}:${step.id}`} tabIndex={-1} className="min-w-0 space-y-6 scroll-mt-40 lg:scroll-mt-6 border-t-[length:var(--anaphor-border-hairline)] border-input-border pt-8 focus-visible:outline-2 focus-visible:outline-ring">
          <Text as="h3" variant="heading">{index + 1}. {step.title}</Text>
          {step.code && <ReviewCode code={step.code} />}
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
      {document.version === 2 && "specs" in section && <section id={`tour-verification:${section.id}`} tabIndex={-1} aria-label={`Evidence for ${section.title}`} className="min-w-0 space-y-6 scroll-mt-40 lg:scroll-mt-6 focus-visible:outline-2 focus-visible:outline-ring">
        <Text as="h3" variant="heading">Verification</Text>
        {section.review?.verification && <div className="max-w-reading space-y-6">
          <VerificationPoint number="01" title="What we needed to prove" text={section.review.verification.purpose} />
          <VerificationPoint number="02" title="How we checked" text={section.review.verification.method} />
          <VerificationPoint number="03" title="What the evidence supports" text={section.review.verification.conclusion} />
        </div>}
        {!section.review?.verification && <EvidenceReferences ids={[...new Set([...section.evidenceIds, ...(section.review?.steps.flatMap((step) => step.evidenceIds) ?? [])])].filter((id) => !document.evidence.some((record) => record.supersedes === id))} document={document} onReveal={revealEvidence} assetBaseUrl={assetBaseUrl} summaryOnly />}
        <SupportingDetails label="Verification details" name={`Verification details for ${section.title.toLowerCase()}`}>
          <Text as="p" variant="ui">A requirement is a statement from the linked specification. Each run below shows its recorded result, environment, and source.</Text>
          <EvidenceReferences ids={[...new Set([...section.evidenceIds, ...(section.review?.steps.flatMap((step) => step.evidenceIds) ?? [])])].filter((id) => !document.evidence.some((record) => record.supersedes === id))} document={document} onReveal={revealEvidence} assetBaseUrl={assetBaseUrl} showObserved />
        </SupportingDetails>

      {document.version === 2 && "specs" in section && sectionConcerns(document, section).length > 0 && <aside id={`tour-concerns:${section.id}`} tabIndex={-1} aria-label={`Open concerns for ${section.title}`} className="space-y-2 scroll-mt-40 text-ui lg:scroll-mt-6">
        <Text as="h4" variant="ui" className="font-medium">Open concerns</Text>
        <ul className="list-disc space-y-2 ps-5 text-ui">{sectionConcerns(document, section).map((concern) => <li key={concern}>{describeConcern(document, concern)}</li>)}</ul>
      </aside>}
      </section>}
      {"specs" in section && <SupportingDetails label="Sources and decisions" name={`Sources and decisions for ${section.title.toLowerCase()}`}>
        {"review" in section && section.review && <Prose as="div">{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</Prose>}
        {!!section.specs.length && <ReferenceLinks title="Specification" links={section.specs} />}
        {!!section.sources.length && <ReferenceLinks title="Implementation" links={section.sources} />}
        {!!section.decisions.length && <div className="space-y-3"><Text as="h3" variant="subheading">Decisions and risks</Text>
          <ul className="list-disc space-y-2 pl-5 text-body">{section.decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul></div>}
        {document.version === 2 && <EvidenceReferences ids={section.evidenceIds} document={document} onReveal={revealEvidence} />}
      </SupportingDetails>}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-b-[length:var(--anaphor-border-hairline)] border-input-border py-6">
        <Text as="p" variant="caption">End of case {String(caseIndex + 1).padStart(2, "0")}</Text>
        <a href="#tour-contents" className="inline-flex min-h-11 items-center text-ui underline underline-offset-4">All cases ↑</a>
      </footer>
    </Section>)}
    <aside id="merge-concerns" tabIndex={-1} aria-label="Merge concerns" className="scroll-mt-40 lg:scroll-mt-6 space-y-3 border-y-[length:var(--anaphor-border-hairline)] border-input-border py-6">
      <Text as="h2" variant="heading">Merge concerns</Text>
      {concerns.length ? <ul className="list-disc space-y-2 pl-5 text-ui">{concerns.map((concern) => <li key={concern}>{describeConcern(document, concern)}</li>)}</ul>
        : <Text as="p" variant="body">Required checks have current passing evidence. Review the results and risks before deciding to merge.</Text>}
      {document.version === 2 && document.consequences && <div className="space-y-4">
        {document.consequences.concerns.length > 0 && <div><Text as="h3" variant="subheading">PR-wide concerns</Text><ul className="list-disc space-y-2 ps-5 text-ui">{document.consequences.concerns.map((concern) => <li key={concern}>{describeConcern(document, concern)}</li>)}</ul></div>}
        {document.consequences.dependencies.length > 0 && <div><Text as="h3" variant="subheading">Dependencies</Text><ul className="list-disc space-y-2 ps-5 text-ui">{document.consequences.dependencies.map((dependency) => <li key={dependency}>{dependency}</li>)}</ul></div>}
        {document.consequences.rollout && <div><Text as="h3" variant="subheading">Rollout</Text><Text as="p" variant="body">{document.consequences.rollout}</Text></div>}
        <div><Text as="h3" variant="subheading">Rollback</Text><Text as="p" variant="body">{document.consequences.rollback}</Text></div>
      </div>}
    </aside>
    {document.version === 2 && <section aria-label="Verification records" className="min-w-0 space-y-4">
      <Text as="h2" variant="heading">Verification records</Text>
      <SupportingDetails label="Current checks and receipts" open={recordsOpen} onOpenChange={open => { evidenceTarget.current = null; setRecordsOpen(open); }} onSettled={evidenceSettled}>
      {document.evidence.filter((record) => !document.evidence.some((next) => next.supersedes === record.id)).map((record) => <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} checkAsset={checkAsset} onUnavailable={assetUnavailable} />)}
      </SupportingDetails>
      <SupportingDetails label="Full verification history" open={historyOpen} onOpenChange={open => { evidenceTarget.current = null; setHistoryOpen(open); }} onSettled={evidenceSettled}>
        {document.evidence.filter((record) => document.evidence.some((next) => next.supersedes === record.id)).map((record) => <EvidenceRecord key={record.id} record={record} document={document} assetBaseUrl={assetBaseUrl} checkAsset={checkAsset} onUnavailable={assetUnavailable} />)}
      </SupportingDetails>
    </section>}
    </div>
    </div>
  </ContentSections>;
}

function ReferenceLinks({ title, links }: { title: string; links: { id: string; label: string; url: string }[] }) {
  return <div className="space-y-3"><Text as="h3" variant="subheading">{title}</Text>
    <ul className="space-y-2">{links.map((link) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 [overflow-wrap:anywhere]">{link.label.replace(/^T\d+:\s*/i, "")}</a></li>)}</ul>
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
  return <div id={`tour-evidence:${record.id}`} tabIndex={-1} className="min-w-0 scroll-mt-40 lg:scroll-mt-24 focus-visible:outline-2 focus-visible:outline-ring">
    <article aria-label={`Verification: ${record.criterion}`} className="space-y-3 border-t border-border py-5">
      <Text as="h3" variant="subheading">{evidenceTitle(document, record)}</Text>
      <div className="flex flex-wrap gap-2 text-ui">
        <Badge size="sm" variant="soft" shape="square">Recorded result: {record.result}</Badge>
        <span>{applicability} evidence{record.required ? " · required" : ""}{successor ? " · superseded" : ""}</span>
      </div>
    <VerificationDetails record={record} document={document} showTitle={false} />
    {assets.filter((asset) => asset.mediaType === "text/plain").map(renderAsset)}
    </article>
    {assets.filter((asset) => asset.mediaType !== "text/plain" && (historicalAsset(document, asset.id) || !document.sections.some((section) => section.review?.steps.some((step) => step.media.some((media) => media.assetId === asset.id))))).map(renderAsset)}
  </div>;
}

function VerificationPoint({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
    <Text as="span" variant="code" className="pt-0.5 text-muted-foreground">{number}</Text>
    <div className="min-w-0 space-y-2"><Text as="h4" variant="ui" className="font-medium">{title}</Text>
      <Text as="p" variant="body" className="whitespace-pre-line text-pretty">{text}</Text>
    </div>
  </div>;
}

function prLabel(url: string) {
  const [, owner, repo, , number] = new URL(url).pathname.split("/");
  return `${owner}/${repo} #${number}`;
}

function EvidenceReferences({ ids, document, onReveal, assetBaseUrl, showObserved = false, summaryOnly = false }: { ids: string[]; document: TourDocumentV2; onReveal: (history: boolean, id: string) => void; assetBaseUrl?: string; showObserved?: boolean; summaryOnly?: boolean }) {
  if (!ids.length) return null;
  return <ul aria-label="Supporting checks" className={showObserved ? "space-y-8 text-ui" : "space-y-2 text-ui"}>{ids.map((id) => {
    const record = document.evidence.find((record) => record.id === id);
    if (!record) return null;
    const label = evidenceTitle(document, record);
    const superseded = document.evidence.some((next) => next.supersedes === id);
    const receipt = <a className="inline-block min-h-11 py-3 underline underline-offset-4" href={`#tour-evidence:${id}`} onClick={event => {
      event.preventDefault();
      flushSync(() => onReveal(superseded, id));
    }}>{showObserved ? "Original record and source history" : <>{label} · {record.result} · {evidenceApplicability(document, record)}{superseded ? " · superseded (history)" : ""}</>}</a>;
    return <li key={id} className={showObserved ? "space-y-4 border-t-[length:var(--anaphor-border-hairline)] border-input-border pt-6" : "space-y-2"}>{showObserved || summaryOnly ? <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        {summaryOnly && <Text as="h4" variant="ui" className="font-medium">{label}</Text>}
        <Text as="span" variant="caption" className="shrink-0">{evidenceApplicability(document, record) === "current" ? "Current" : evidenceApplicability(document, record) === "stale" ? "Historical" : "Unknown source"} {record.result}{record.required ? " · required" : ""}</Text>
      </div>
      {summaryOnly ? <Text as="p" variant="body">{record.observed}</Text> : <VerificationDetails record={record} document={document} />}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {showObserved && assetBaseUrl && document.assets.filter(asset => asset.mediaType === "text/plain" && [...record.assetIds, ...record.sources.flatMap(source => [source.patchAssetId, ...(source.untrackedAssetIds ?? [])])].includes(asset.id)).map(asset => <a key={asset.id} href={`${assetBaseUrl}/${asset.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">Open {asset.caption}</a>)}
        {receipt}
      </div>
    </> : receipt}</li>;
  })}</ul>;
}

function BusinessCases({ sections }: { sections: TourDocument["sections"] }) {
  return <nav id="tour-contents" aria-label="Business cases" className="space-y-6 scroll-mt-40 lg:scroll-mt-6">
    <Text as="h2" variant="heading">Business cases</Text>
    <Text as="p" variant="ui" className="text-muted-foreground">{sections.length} cases · any reading order</Text>
    <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{sections.map((section, index) => {
      const review = "review" in section ? section.review : undefined;
      return <li key={section.id} className="min-w-0">
        <Card variant="default" className="relative flex h-full min-w-0 flex-col gap-3 bg-background px-6 py-5">
          <div className="flex items-start gap-3">
            <Text as="span" variant="code" className="w-7 shrink-0 leading-7 text-muted-foreground">{String(index + 1).padStart(2, "0")}</Text>
            <a href={`#tour-section:${section.id}`} className="min-h-11 flex-1 after:absolute after:inset-0 after:rounded-card focus-visible:outline-2 focus-visible:outline-ring">
              <Text as="h3" variant="heading">{section.title}</Text>
            </a>
            <ArrowRightIcon size={16} aria-hidden="true" className="mt-1 shrink-0" />
          </div>
          {review && <Text as="p" variant="ui" className="ps-10 text-pretty">{review.summary ?? review.outcome}</Text>}
          {review && <div className="mt-auto flex flex-wrap items-center justify-between gap-2 ps-10">
            <Text as="span" variant="caption">{review.steps.length} {review.steps.length === 1 ? "step" : "steps"}</Text>
            <div className="relative z-10 flex">
              {review.steps.some(step => step.code) && <EvidenceIcon label="Captured source" title={section.title} description="Pinned source and highlighted implementation notes are available."><FileCodeIcon className="size-5" /></EvidenceIcon>}
              {review.steps.some(step => step.media.some(media => media.callouts.length)) && <EvidenceIcon label="Annotated images" title={section.title} description="Inspect screenshots and their authored callouts beside the supported claim."><ImageIcon className="size-5" /></EvidenceIcon>}
              {review.steps.some(step => step.media.some(media => media.moments.length)) && <EvidenceIcon label="Recording moments" title={section.title} description="Inspect the inline recording and its labelled moments."><VideoCameraIcon className="size-5" /></EvidenceIcon>}
              {(("evidenceIds" in section && section.evidenceIds.length > 0) || review.steps.some(step => step.evidenceIds.length)) && <EvidenceIcon label="Verification receipts" title={section.title} description="Recorded checks are available. Inspect their result and source before merging."><ClipboardTextIcon className="size-5" /></EvidenceIcon>}
            </div>
          </div>}
        </Card>
      </li>;
    })}</ol>
    <a href="#merge-concerns" className="inline-block min-h-11 py-3 text-ui underline underline-offset-4">Review unresolved checks</a>
  </nav>;
}

function EvidenceIcon({ label, title, description, children }: { label: string; title: string; description: string; children: ReactNode }) {
  return <Popover>
    <PopoverTrigger openOnHover delay={150} closeDelay={100} aria-label={`${label} for ${title}`} className="flex size-11 items-center justify-center rounded-control text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><span aria-hidden="true">{children}</span></PopoverTrigger>
    <PopoverPopup align="end" side="top" sideOffset={8}>
      <PopoverBody><PopoverTitle>{label}</PopoverTitle><PopoverDescription className="text-ui">{description}</PopoverDescription></PopoverBody>
    </PopoverPopup>
  </Popover>;
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
