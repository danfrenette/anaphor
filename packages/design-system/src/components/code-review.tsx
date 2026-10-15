"use client";

import type { FileDiff as DiffInstance } from "@pierre/diffs";
import { flushSync } from "react-dom";
import { File, MultiFileDiff, type SelectedLineRange } from "@pierre/diffs/react";
import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { cn } from "../lib/utils";

type CodeReviewSource = { path: string; revision: string; content: string; href?: string };
type CodeReviewRange = { side: "before" | "after"; startLine: number; endLine: number };
type CodeReviewRegion = CodeReviewRange & { id: string; label: string };
type CodeReviewNote = CodeReviewRange & { id: string; children: ReactNode };
type CodeReviewProps = Omit<ComponentProps<"figure">, "children"> & {
  regions: readonly CodeReviewRegion[];
  notes: readonly CodeReviewNote[];
  theme: "light" | "dark";
} & ({ before: CodeReviewSource; after: CodeReviewSource | null } | { before: null; after: CodeReviewSource });

const surfaceCSS = `
:host { --diffs-font-family: var(--font-mono); --diffs-header-font-family: var(--font-sans); --diffs-font-size: 12px; --diffs-line-height: 20px; --diffs-bg: var(--color-background); --diffs-fg: var(--color-foreground); --diffs-selection-base: var(--color-primary); }
[data-code] { font-family: var(--font-mono); }
[data-authored-range] { box-shadow: inset 3px 0 var(--color-primary); }
`;

function rangeLabel(range: CodeReviewRange) {
  return `${range.side === "before" ? "Before" : "After"} lines ${range.startLine}–${range.endLine}`;
}

function CodeReview({ before, after, regions, notes, theme, className, ref, ...props }: CodeReviewProps) {
  const prefix = useId();
  const container = useRef<HTMLDivElement>(null);
  const positionedSource = useRef("");
  const sourceResize = useRef<ResizeObserver | null>(null);
  const observedSource = useRef<Element | null>(null);
  const readerPositioned = useRef(false);
  const annotationElements = useRef(new Map<string, HTMLDivElement>());
  const [wide, setWide] = useState(false);
  const [selection, setSelection] = useState<SelectedLineRange | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => () => sourceResize.current?.disconnect(), []);
  useEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => { const entry = entries[0]; if (entry) setWide(entry.contentRect.width >= 760); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const sources = useMemo(() => [
    ...(before ? [{ label: "Before", source: before }] : []),
    ...(after ? [{ label: "After", source: after }] : []),
  ], [before, after]);
  const oldFile = useMemo(() => before ? { name: before.path, contents: before.content } : null, [before]);
  const newFile = useMemo(() => after ? { name: after.path, contents: after.content } : null, [after]);
  const unchanged = before !== null && after !== null && before.content === after.content;
  const annotations = useMemo(() => [
    ...regions.map(region => ({ side: region.side === "before" ? "deletions" as const : "additions" as const, lineNumber: region.startLine,
      metadata: { id: `${prefix}-region-${region.id}`, label: `${region.label} · ${rangeLabel(region)}`, children: null } })),
    ...notes.map(note => ({ side: note.side === "before" ? "deletions" as const : "additions" as const, lineNumber: note.startLine,
      metadata: { id: `${prefix}-note-${note.id}`, label: rangeLabel(note), children: note.children } })),
  ], [regions, notes, prefix]);
  function markAuthoredRanges(node: HTMLElement, instance?: Pick<DiffInstance<never, never>, "getLineIndex">) {
    const root = node.shadowRoot;
    if (!root) return;
    root.querySelectorAll("[data-authored-range]").forEach(element => element.removeAttribute("data-authored-range"));
    for (const region of regions) {
      const source = region.side === "before" ? before : after;
      if (!source || !Number.isInteger(region.startLine) || !Number.isInteger(region.endLine)) continue;
      const last = Math.min(region.endLine, source.content.split("\n").length);
      for (let line = Math.max(1, region.startLine); line <= last; line++) {
        if (instance) {
          const side = region.side === "before" ? "deletions" : "additions";
          const index = instance.getLineIndex(line, side);
          if (!index) continue;
          root.querySelectorAll(`[data-code][data-${side}] [data-line-index="${index.join(",")}"], [data-code][data-unified] [data-line-index="${index.join(",")}"]`).forEach(element => element.setAttribute("data-authored-range", ""));
        } else {
          root.querySelectorAll(`[data-line="${line}"]`).forEach(element => element.setAttribute("data-authored-range", ""));
        }
      }
    }
    const viewport = container.current;
    const sourceKey = `${before?.path}:${before?.revision}:${after?.path}:${after?.revision}:${regions[0]?.startLine}`;
    const sourceElement = root.querySelector("pre") ?? node;
    const positionRange = () => {
      const first = root.querySelector<HTMLElement>("[data-authored-range]");
      if (!first || !viewport || readerPositioned.current) return;
      viewport.scrollTop += first.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 80;
    };
    if (viewport && (positionedSource.current !== sourceKey || observedSource.current !== sourceElement)) {
      if (positionedSource.current !== sourceKey) readerPositioned.current = false;
      sourceResize.current?.disconnect();
      if (typeof ResizeObserver !== "undefined") {
        sourceResize.current = new ResizeObserver(positionRange);
        sourceResize.current.observe(sourceElement);
      }
      observedSource.current = sourceElement;
      positionedSource.current = sourceKey;
    }
    positionRange();
  }
  function jumpToRegion(region: CodeReviewRegion) {
    readerPositioned.current = true;
    flushSync(() => setExpanded(true));
    const element = annotationElements.current.get(`${prefix}-region-${region.id}`);
    element?.scrollIntoView?.({ block: "nearest" });
    element?.focus({ preventScroll: true });
  }
  const options = {
    themeType: theme,
    theme: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    disableFileHeader: true,
    disableBackground: true,
    diffIndicators: "classic" as const,
    overflow: "wrap" as const,
    enableLineSelection: true,
    onLineSelectionEnd: setSelection,
    unsafeCSS: surfaceCSS,
  };
  const renderAnnotation = ({ metadata }: { metadata: { id: string; label: string; children: ReactNode } }) => <div id={metadata.id} tabIndex={-1} ref={element => { if (element) annotationElements.current.set(metadata.id, element); else annotationElements.current.delete(metadata.id); }} role="note" aria-label={metadata.label} className="border-l-2 border-primary bg-muted px-3 py-2 font-sans text-ui text-foreground focus-visible:outline-2 focus-visible:outline-ring">
    <p className="text-small text-muted-foreground">{metadata.label}</p>{metadata.children}
  </div>;

  return <figure {...props} ref={ref} className={cn("min-w-0 space-y-3", className)}>
    <figcaption className="break-words font-mono text-small text-muted-foreground">{after?.path ?? before?.path}{unchanged ? " · unchanged" : ""}</figcaption>
    {regions.length > 0 && <div role="group" aria-label="Authored code regions" className="flex flex-wrap gap-x-4 gap-y-2 text-ui">
      {regions.map(region => <button type="button" key={region.id} onClick={() => jumpToRegion(region)} className="inline-flex min-h-11 items-center rounded-md px-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">{region.label}</button>)}
    </div>}
    <div ref={container} tabIndex={0} role="group" aria-label="Scrollable captured source"
      onWheelCapture={() => { readerPositioned.current = true; }} onPointerDownCapture={() => { readerPositioned.current = true; }} onKeyDownCapture={() => { readerPositioned.current = true; }}
      className={cn("min-w-0 overflow-auto focus-visible:outline-2 focus-visible:outline-ring border-y-[length:var(--anaphor-border-hairline)] border-border", !expanded && "max-h-96")}>
      {unchanged && newFile ? <File file={newFile} options={{ ...options, onPostRender: node => markAuthoredRanges(node) }} selectedLines={selection}
        lineAnnotations={annotations.map(annotation => ({ lineNumber: annotation.lineNumber, metadata: annotation.metadata }))} renderAnnotation={renderAnnotation} />
        : oldFile && newFile ? <MultiFileDiff oldFile={oldFile} newFile={newFile} options={{ ...options, onPostRender: markAuthoredRanges, diffStyle: wide ? "split" : "unified", expandUnchanged: expanded, hunkSeparators: "line-info" }} selectedLines={selection} lineAnnotations={annotations} renderAnnotation={renderAnnotation} />
        : newFile ? <MultiFileDiff oldFile={null} newFile={newFile} options={{ ...options, onPostRender: markAuthoredRanges, diffStyle: "unified", expandUnchanged: expanded }} selectedLines={selection} lineAnnotations={annotations} renderAnnotation={renderAnnotation} />
        : oldFile ? <MultiFileDiff oldFile={oldFile} newFile={null} options={{ ...options, onPostRender: markAuthoredRanges, diffStyle: "unified", expandUnchanged: expanded }} selectedLines={selection} lineAnnotations={annotations} renderAnnotation={renderAnnotation} /> : null}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-small text-muted-foreground">
      <span role="status">Reader selection: {selection ? `${selection.side === "deletions" ? "before" : "after"} lines ${selection.start}–${selection.end}` : "none"}</span>
      {selection && <button type="button" onClick={() => setSelection(null)} className="min-h-11 px-2 text-ui underline focus-visible:outline-2 focus-visible:outline-ring">Clear reader selection</button>}
    </div>
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger><CaretRightIcon aria-hidden="true" />Source and full context</CollapsibleTrigger>
      <CollapsibleContent keepMounted>
      <div className="space-y-4">
        {sources.map(({ label, source }) => <section key={label} aria-label={`${label} captured source`} className="min-w-0">
          <p className="mb-2 break-words text-small text-muted-foreground">{source.href ? <a href={source.href} className="underline underline-offset-4">{label}: {source.path} at {source.revision}</a> : <span>{label}: {source.path} at {source.revision}</span>}</p>
          <pre tabIndex={0} aria-label={`${label} full source`} className="overflow-x-auto bg-muted p-3 font-mono text-small">{source.content}</pre>
        </section>)}
      </div>
      </CollapsibleContent>
    </Collapsible>
  </figure>;
}

export { CodeReview, type CodeReviewProps, type CodeReviewSource, type CodeReviewRegion, type CodeReviewNote, type CodeReviewRange };
