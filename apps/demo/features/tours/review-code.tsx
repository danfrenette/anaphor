"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  Button, ButtonLabel, Collapsible, CollapsibleContent, CollapsibleTrigger, Diff, Text,
  type DiffNote, type DiffProps, type DiffSource,
} from "@anaphor/system";
import type { TourDocumentV2 } from "./document";

type TourCode = NonNullable<NonNullable<TourDocumentV2["sections"][number]["review"]>["steps"][number]["code"]>;
type CodeRange = TourCode["regions"][number];

function location(range: CodeRange) {
  return `${range.side === "before" ? "Before" : "After"} · L${range.startLine}${range.endLine === range.startLine ? "" : `–${range.endLine}`}`;
}

function available(code: TourCode, range: CodeRange) {
  const source = code[range.side];
  return source !== null && range.startLine >= 1 && range.endLine >= range.startLine
    && range.endLine <= source.content.split("\n").length;
}

export function ReviewCode({ code }: { code: TourCode }) {
  // A different capture or explanation starts a new inspection. Reading controls
  // within the same capture keep source and authored-note identities stable.
  return <CapturedCode key={JSON.stringify(code)} code={code} />;
}

function CapturedCode({ code }: { code: TourCode }) {
  const [layout, setLayout] = useState<"unified" | "split">("unified");
  const [wrap, setWrap] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteReveal, setNoteReveal] = useState(0);
  const [regionReveal, setRegionReveal] = useState(0);
  const [region, setRegion] = useState<CodeRange>();
  const source = useMemo<DiffSource>(() => {
    const before = code.before && { name: code.before.path, contents: code.before.content };
    const after = code.after && { name: code.after.path, contents: code.after.content };
    if (!before && !after) return { kind: "unavailable", path: "Captured source", reason: "Source was not captured." };
    if (before && after && before.name === after.name && before.contents === after.contents) {
      const excerpts = [...code.regions, ...code.notes].filter(range => available(code, range))
        .map(range => ({ start: range.startLine, end: range.endLine }));
      return { kind: "unchanged", file: after, excerpts: excerpts.length ? excerpts : [{ start: 1, end: after.contents.split("\n").length }] };
    }
    return { kind: "files", before, after };
  }, [code]);
  const notes = useMemo<DiffNote[]>(() => code.notes.map(note => ({
    id: note.id, title: note.label, body: <Text as="p" variant="body" className="whitespace-pre-wrap">{note.explanation}</Text>,
    presentation: "inline", range: { side: note.side, start: note.startLine, end: note.endLine },
  })), [code]);
  const highlightedLines = useMemo<DiffProps["highlightedLines"]>(() => region && ({
    side: region.side === "after" ? "additions" : "deletions", start: region.startLine, end: region.endLine,
  }), [region]);
  function locateNote(id: string) {
    setRegion(undefined);
    setActiveNoteId(id);
    setNoteReveal(value => value + 1);
  }
  function locateRegion(next: CodeRange) {
    setActiveNoteId(null);
    setRegion(next);
    setRegionReveal(value => value + 1);
  }
  return <div className="min-w-0 space-y-4">
    {(code.regions.length > 0 || code.notes.length > 0) && <nav aria-label="Code locations">
      <ul className="space-y-2">
        {code.regions.filter(range => !code.notes.some(note => note.label === range.label && note.side === range.side && note.startLine === range.startLine && note.endLine === range.endLine)).map(range => <li key={`region:${range.id}`}>
          {available(code, range) ? <Button type="button" nativeButton size="sm" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false}
            className="h-auto min-w-0 max-w-full whitespace-normal text-start" onClick={() => locateRegion(range)}>
            <ButtonLabel>{range.label} · {location(range)}</ButtonLabel>
          </Button> : <Text as="p" variant="caption">{range.label} · Source unavailable</Text>}
        </li>)}
        {code.notes.map(note => <li key={`note:${note.id}`}>
          {available(code, note) ? <Button type="button" nativeButton size="sm" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false}
            className="h-auto min-w-0 max-w-full whitespace-normal text-start" onClick={() => locateNote(note.id)}>
            <ButtonLabel>{note.label} · {location(note)}</ButtonLabel>
          </Button> : <Text as="p" variant="caption">{note.label} · Source unavailable</Text>}
        </li>)}
      </ul>
    </nav>}
    <Diff source={source} layout={layout} wrap={wrap} controls context={region ? "expanded" : "collapsed"} maxHeight={480}
      onLayoutChange={setLayout} onWrapChange={setWrap}
      highlightedLines={highlightedLines} revealKey={regionReveal}
      annotations={{ notes, activeNoteId, onActiveNoteChange: id => { setRegion(undefined); setActiveNoteId(id); }, revealKey: noteReveal }} />
    {(code.before || code.after) && <Collapsible defaultOpen={false}>
      <CollapsibleTrigger><CaretRightIcon aria-hidden="true" />Full source and revisions</CollapsibleTrigger>
      <CollapsibleContent><ul className="space-y-3 py-3">
        {(["before", "after"] as const).map(side => {
          const captured = code[side];
          const range = [region, code.notes.find(note => note.id === activeNoteId), ...code.regions, ...code.notes].find(range => range?.side === side);
          const href = captured && range ? `${captured.href.split("#")[0]}#L${range.startLine}${range.endLine === range.startLine ? "" : `-L${range.endLine}`}` : captured?.href;
          return captured ? <li key={side} className="break-words">
            <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4">{side === "before" ? "Before" : "After"}: {captured.path}</a>
            <Text as="p" variant="caption" className="break-all">Revision {captured.revision}</Text>
          </li> : null;
        })}
      </ul></CollapsibleContent>
    </Collapsible>}
  </div>;
}
