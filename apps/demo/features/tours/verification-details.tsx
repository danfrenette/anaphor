"use client";

import type { ReactNode } from "react";
import { BrowserIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { Popover, PopoverBody, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger, Text } from "@anaphor/system";
import type { TourDocument, TourDocumentV2, TourEvidence } from "./document";

export function evidenceTitle(document: TourDocumentV2, record: Pick<TourEvidence, "criterion">) {
  const spec = document.sections.flatMap(section => section.specs).find(spec => spec.id === record.criterion);
  return spec?.label.replace(/^T\d+:\s*/i, "") ?? record.criterion.replace(/[-_]/g, " ");
}

export function describeConcern(document: TourDocument, concern: string) {
  if (document.version !== 2) return concern;
  const explained = new Set<string>();
  for (const spec of document.sections.flatMap(section => section.specs)) {
    if (explained.has(spec.id.toLowerCase())) continue;
    explained.add(spec.id.toLowerCase());
    if (/^t\d+$/i.test(spec.id)) concern = concern.replace(new RegExp(`\\b${spec.id}\\b`, "gi"), `${spec.label.replace(/^T\d+:\s*/i, "")} (spec requirement ${spec.id.toUpperCase()})`);
  }
  return concern;
}

export function VerificationDetails({ record, document, showTitle = true }: { record: TourEvidence; document: TourDocumentV2; showTitle?: boolean }) {
  const spec = document.sections.flatMap(section => section.specs).find(spec => spec.id === record.criterion);
  return <section aria-label={`Recorded check: ${evidenceTitle(document, record)}`} className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      {showTitle && <Text as="h4" variant="ui" className="font-medium">{evidenceTitle(document, record)}</Text>}
      {spec && <a href={spec.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-ui underline underline-offset-4">Spec requirement {spec.id.toUpperCase()}</a>}
      {!spec && <Text as="span" variant="caption">No specification link recorded</Text>}
    </div>
    <dl className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
      <Detail label="Expected behavior">{record.expected}</Detail>
      <Detail label={record.result === "not run" ? "Why this check has no result" : "Action performed"}>{record.action}</Detail>
      <Detail label="Observed result">{record.observed}</Detail>
      <Detail label="Environment"><EnvironmentFactors target={record.target} /></Detail>
      <Detail label="Run context">{record.context}</Detail>
      <Detail label="Recorded"><time dateTime={record.testedAt}>{record.testedAt.slice(0, 16).replace("T", " · ")} UTC</time></Detail>
    </dl>
    <div className="space-y-2">
      <Text as="p" variant="label">Tested source</Text>
      <ul className="flex flex-wrap gap-x-8 gap-y-4 text-ui">{record.sources.map(source => {
        const [, owner, repo, , number] = new URL(source.pr).pathname.split("/");
        return <li key={source.pr} className="min-w-0">
          <a href={source.pr} className="inline-flex min-h-11 items-center underline underline-offset-4">{owner}/{repo} #{number}</a>
          <a href={source.pr.replace(/\/pull\/\d+$/, `/commit/${source.head}`)} title={source.head} className="ms-4 inline-flex min-h-11 items-center font-mono underline underline-offset-4">{source.head.slice(0, 8)}</a>
          {(source.patchAssetId || source.untrackedAssetIds?.length) && <Text as="p" variant="caption">Includes retained local changes</Text>}
        </li>;
      })}</ul>
    </div>
    {record.assessments.length > 0 && <div className="space-y-3">
      <Text as="p" variant="label">Source assessments</Text>
      <ul className="space-y-4">{record.assessments.map(assessment => <li key={`${assessment.pr}:${assessment.head}`} className="grid gap-3 border-t-[length:var(--anaphor-border-hairline)] border-input-border pt-4 md:grid-cols-[8rem_minmax(0,1fr)]">
        <div><Text as="p" variant="code" title={assessment.head}>{assessment.head.slice(0, 8)}</Text><Text as="p" variant="caption">{assessment.assessedAt.slice(0, 10)}</Text></div>
        <Text as="p" variant="ui" className="max-w-reading text-pretty">{assessment.rationale}</Text>
      </li>)}</ul>
    </div>}
  </section>;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-2"><dt className="text-ui font-medium">{label}</dt><dd className="text-ui text-pretty [overflow-wrap:anywhere]">{children}</dd></div>;
}

function EnvironmentFactors({ target }: { target: string }) {
  const browsers = ["Chromium", "Chrome", "WebKit", "Firefox", "Safari", "Edge"].filter(name => new RegExp(`\\b${name}\\b`, "i").test(target));
  const factors = browsers.length ? browsers : ["Recorded environment"];
  return <div className="space-y-2"><div className="flex flex-wrap gap-2">{factors.map(name => <Popover key={name}>
    <PopoverTrigger openOnHover delay={150} closeDelay={100} aria-label={`${name} environment`} className="flex min-h-11 items-center gap-2 rounded-control px-3 text-ui hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
      {browsers.length ? <BrowserIcon className="size-5" aria-hidden="true" /> : <TerminalWindowIcon className="size-5" aria-hidden="true" />}{name}
    </PopoverTrigger>
    <PopoverPopup align="start" side="top" sideOffset={8}><PopoverBody><PopoverTitle>{name}</PopoverTitle><PopoverDescription className="text-ui">{target}</PopoverDescription></PopoverBody></PopoverPopup>
  </Popover>)}</div></div>;
}
