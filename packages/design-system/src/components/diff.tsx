"use client";

import { SVGSpriteSheet, parseDiffFromFile, parsePatchFiles, type FileContents, type FileDiffMetadata, type SelectedLineRange, type DiffLineAnnotation } from "@pierre/diffs";
import { CopyIcon, UnwrapIcon, WrapIcon } from "@primer/octicons-react";
import { FileDiff, type FileDiffOptions } from "@pierre/diffs/react";
import { CaretRight, FileCode, Info } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Popover, PopoverBody, PopoverPopup, PopoverTitle, PopoverTrigger } from "./popover";
import { Button, ButtonLabel } from "./button";
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { CardCopyButton } from "./card-copy-button";
import { useTheme } from "./theme";
import { cn } from "../lib/utils";

type DiffSource =
  | { kind: "patch"; patch: string; path: string }
  | { kind: "unchanged"; file: FileContents; excerpts: readonly { start: number; end: number }[] }
  | { kind: "files"; before: FileContents | null; after: FileContents | null }
  | { kind: "unavailable"; path: string; reason: string };

type DiffNote = {
  id: string;
  title: string;
  body: ReactNode;
  presentation: "inline" | "popover";
  range: { side: "before" | "after"; start: number; end: number };
};

type DiffAnnotations = {
  notes: readonly DiffNote[];
  activeNoteId: string | null;
  onActiveNoteChange: (id: string) => void;
  /** Change the key to reveal a note, including a repeated request for the same note. */
  revealKey?: string | number;
};

function Note({ note, number, active, unavailable, onActivate }: {
  note: DiffNote; number: number; active: boolean; unavailable: boolean; onActivate: () => void;
}) {
  const title = <><span className="shrink-0 whitespace-nowrap font-mono tabular-nums">{number}.</span>{" "}<span className="min-w-0">{note.title}</span></>;
  return <div className={cn("min-w-0 border-l-2 px-3 py-2 font-sans text-ui [overflow-wrap:anywhere]", active ? "border-[var(--anaphor-brand)] bg-muted/60" : "border-transparent")}>
    {note.presentation === "inline" ? <Collapsible defaultOpen={false} onOpenChange={open => { if (open) onActivate(); }}>
      <CollapsibleTrigger className="min-h-10"><CaretRight aria-hidden="true" />{title}</CollapsibleTrigger>
      <CollapsibleContent hiddenUntilFound={false}><div className="max-w-reading px-2 pb-2 text-ui">{note.body}</div></CollapsibleContent>
    </Collapsible> : <Popover onOpenChange={open => { if (open) onActivate(); }}>
      <PopoverTrigger render={<Button type="button" nativeButton size="md" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false} className="h-auto min-h-10 min-w-0 max-w-full whitespace-normal text-start" />}><Info aria-hidden="true" /><ButtonLabel>{title}</ButtonLabel></PopoverTrigger>
      <PopoverPopup side="bottom" align="start" sideOffset={8}><PopoverBody><PopoverTitle>{note.title}</PopoverTitle><div className="mt-2 text-ui">{note.body}</div></PopoverBody></PopoverPopup>
    </Popover>}
    <p className="px-2 text-small text-muted-foreground">{unavailable ? "Source unavailable · Code range unavailable in supplied source." : <span className="font-mono">{note.range.side === "after" ? "After" : "Before"} · L{note.range.start}{note.range.end !== note.range.start && `–${note.range.end}`}</span>}</p>
  </div>;
}

type DiffProps = Omit<ComponentProps<"section">, "children"> & {
  source: DiffSource;
  layout: "unified" | "split";
  wrap: boolean;
  controls: boolean;
  context: "collapsed" | "expanded";
  maxHeight: number | null;
  highlightedLines?: SelectedLineRange;
  /** Change this value to request scrolling to the highlighted range. */
  revealKey?: string | number;
  notice?: string;
  annotations?: DiffAnnotations;
  onLayoutChange?: (layout: "unified" | "split") => void;
  onWrapChange?: (wrap: boolean) => void;
};

function hasRange(file: FileDiffMetadata | undefined, range: DiffNote["range"]) {
  if (!file || !Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 1 || range.end < range.start) return false;
  const side = range.side === "after" ? "addition" : "deletion";
  if (!file.isPartial) return range.end <= file[`${side}Lines`].length;
  let next = range.start;
  for (const hunk of file.hunks) {
    if (hunk[`${side}Start`] > next) break;
    if (hunk[`${side}Start`] + hunk[`${side}Count`] > next) next = hunk[`${side}Start`] + hunk[`${side}Count`];
    if (next > range.end) return true;
  }
  return false;
}

// Context-only hunks use Pierre's public metadata format. Both source arrays remain
// complete, so original numbers and Pierre's context-expansion controls stay intact.
function excerptFile(file: FileDiffMetadata, excerpts: readonly { start: number; end: number }[]): FileDiffMetadata {
  const ranges: { start: number; end: number }[] = [];
  for (const range of [...excerpts].sort((a, b) => a.start - b.start)) {
    const previous = ranges.at(-1);
    if (previous && range.start <= previous.end + 1) previous.end = Math.max(previous.end, range.end);
    else ranges.push({ ...range });
  }
  return { ...file, splitLineCount: file.additionLines.length, unifiedLineCount: file.additionLines.length,
    hunks: ranges.map((range, index) => {
      const start = range.start - 1;
      const count = range.end - range.start + 1;
      return {
        collapsedBefore: start - (ranges[index - 1]?.end ?? 0),
        additionStart: range.start, deletionStart: range.start,
        additionCount: count, deletionCount: count, additionLines: 0, deletionLines: 0,
        additionLineIndex: start, deletionLineIndex: start,
        splitLineStart: start, unifiedLineStart: start, splitLineCount: count, unifiedLineCount: count,
        noEOFCRAdditions: false, noEOFCRDeletions: false,
        hunkContent: [{ type: "context", lines: count, additionLineIndex: start, deletionLineIndex: start }],
      };
    }),
  };
}

function readSource(source: DiffSource, notes: readonly DiffNote[] | undefined): { file?: FileDiffMetadata; message?: string } {
  if (source.kind === "unavailable") return { message: source.reason };
  try {
    if (source.kind === "unchanged") {
      const file = parseDiffFromFile(source.file, source.file, { context: 3 }, true);
      if (!source.excerpts.length || source.excerpts.some(range => !hasRange(file, { ...range, side: "after" }))) {
        return { message: "Supply at least one valid excerpt within the unchanged file." };
      }
      return { file: excerptFile(file, source.excerpts) };
    }
    if (source.kind === "files") {
      if (!source.before && !source.after) return { message: "No file contents supplied." };
      const file = parseDiffFromFile(source.before, source.after, { context: 3 }, true);
      const ranges = notes?.filter(note => hasRange(file, note.range)).map(note => note.range);
      return { file: file.hunks.length === 0 && ranges?.length ? excerptFile(file, ranges) : file };
    }
    if (/^(Binary files |GIT binary patch)/m.test(source.patch)) return { message: "Binary file changed. A text diff is not available." };
    const files = parsePatchFiles(source.patch, undefined, true).flatMap(patch => patch.files);
    if (files.length !== 1) return { message: "Supply a patch for exactly one file." };
    return { file: files[0] };
  } catch {
    return { message: "This diff could not be read. Check the supplied patch or file contents." };
  }
}

// Pierre renders inside a shadow root. Only this component-owned stylesheet crosses
// that boundary; source code and consumer content are never interpolated into CSS.
const diffCSS = `
:host {
  --diffs-font-family: var(--font-mono);
  --diffs-font-size: 13px;
  --diffs-line-height: 22px;
  --diffs-light-bg: var(--anaphor-background);
  --diffs-dark-bg: var(--anaphor-background);
  --diffs-bg-context-override: var(--anaphor-background);
  --diffs-bg-context-gutter-override: var(--anaphor-background);
  --diffs-bg-separator-override: var(--anaphor-foreground);
  --diffs-fg-number-override: var(--anaphor-font-tertiary);
  --diffs-addition-color-override: light-dark(#176b35, #7ee29a);
  --diffs-deletion-color-override: var(--anaphor-danger-text);
  --diffs-selection-color-override: var(--anaphor-brand);
  --diffs-bg-selection-override: color-mix(in oklch, var(--anaphor-brand) 12%, var(--anaphor-background));
  --diffs-bg-selection-number-override: color-mix(in oklch, var(--anaphor-brand) 18%, var(--anaphor-background));
}
[data-line], [data-line] span { font-weight: 400; font-style: normal; }
[data-line][data-selected-line] { box-shadow: inset 2px 0 var(--anaphor-brand); }
button:focus-visible, [role="button"]:focus-visible, code[data-code]:focus-visible { outline: 2px solid var(--anaphor-focus); outline-offset: -2px; }
@media (pointer: coarse) { button, [role="button"] { min-height: 44px; min-width: 44px; } }
`;

const changeLabels = { change: "Modified", "rename-pure": "Renamed", "rename-changed": "Renamed", new: "Added", deleted: "Deleted" };

// Read the original glyphs from Pierre's public sprite export. Inline their
// contents so multiple Diff instances do not introduce duplicate SVG symbol IDs.
function pierreGlyph(layout: "unified" | "split") {
  const symbol = SVGSpriteSheet.match(new RegExp(`<symbol id="diffs-icon-diff-${layout}"[^>]*>([\\s\\S]*?)</symbol>`));
  if (!symbol?.[1]) throw new Error(`Pierre diff icon missing: ${layout}`);
  return symbol[1];
}

const pierreGlyphs = { unified: pierreGlyph("unified"), split: pierreGlyph("split") };

function PierreDiffIcon({ layout }: { layout: "unified" | "split" }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: pierreGlyphs[layout] }} />;
}

function ReadingControl({ label, description, disabled, onClick, children }: {
  label: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return <Tooltip>
    <TooltipTrigger render={<Button type="button" nativeButton size="sm" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly aria-label={label} disabled={disabled} onClick={onClick} />}>
      {children}
    </TooltipTrigger>
    <TooltipPopup side="top" align="center" sideOffset={8}>{description}</TooltipPopup>
  </Tooltip>;
}

function Diff({ source, layout, wrap, controls, context, maxHeight, highlightedLines, revealKey, notice, annotations, onLayoutChange, onWrapChange, className, ref, ...props }: DiffProps) {
  const { file, message } = useMemo(() => readSource(source, annotations?.notes), [source, annotations?.notes]);
  const noteGroups = useMemo(() => {
    const groups: DiffLineAnnotation<{ note: DiffNote; number: number }[]>[] = [];
    annotations?.notes.forEach((note, index) => {
      if (!hasRange(file, note.range)) return;
      const side = note.range.side === "after" ? "additions" : "deletions";
      let group = groups.find(item => item.lineNumber === note.range.end && item.side === side);
      if (!group) { group = { side, lineNumber: note.range.end, metadata: [] }; groups.push(group); }
      group.metadata.push({ note, number: index + 1 });
    });
    return groups;
  }, [annotations?.notes, file]);
  const activeNote = annotations?.notes.find(note => note.id === annotations.activeNoteId);
  const selectedLines = useMemo<SelectedLineRange | undefined>(() => {
    if (!activeNote) return highlightedLines;
    if (!hasRange(file, activeNote.range)) return undefined;
    return { start: activeNote.range.start, end: activeNote.range.end, side: activeNote.range.side === "after" ? "additions" : "deletions" };
  }, [activeNote, file, highlightedLines]);
  const [collapsed, setCollapsed] = useState(false);
  const requestedKey = annotations?.revealKey;
  const requestedNoteId = annotations?.activeNoteId;
  const [lastRequest, setLastRequest] = useState<{ key: string | number | undefined; file: FileDiffMetadata | undefined; noteId: string | null | undefined }>({ key: undefined, file, noteId: requestedNoteId });
  const [revealRequest, setRevealRequest] = useState<{ key: string | number; noteId: string; file: FileDiffMetadata | undefined }>();
  const [expandedSource, setExpandedSource] = useState<FileDiffMetadata>();
  if (lastRequest.key !== requestedKey || lastRequest.file !== file || lastRequest.noteId !== requestedNoteId) {
    setLastRequest({ key: requestedKey, file, noteId: requestedNoteId });
    // A source replacement invalidates inspection state. Only a new key requests
    // navigation; changing active emphasis or opening an inline note does not.
    if (requestedKey !== undefined && lastRequest.key !== requestedKey && activeNote) {
      setCollapsed(false);
      if (hasRange(file, activeNote.range)) {
        setRevealRequest({ key: requestedKey, noteId: activeNote.id, file });
        setExpandedSource(file);
      } else {
        setRevealRequest(undefined);
      }
    } else {
      setRevealRequest(undefined);
    }
  }
  const viewport = useRef<HTMLDivElement>(null);
  const readingPosition = useRef({ file, top: 0 });
  const revealedNote = useRef<typeof revealRequest>(undefined);
  const [wide, setWide] = useState(false);
  const root = useRef<HTMLElement>(null);
  const revealed = useRef<string | number | undefined>(undefined);
  const revealFrame = useRef<number | undefined>(undefined);
  useEffect(() => () => cancelAnimationFrame(revealFrame.current ?? 0), []);
  const effectiveLayout = wide ? layout : "unified";
  const nextLayout = effectiveLayout === "unified" ? "split" : "unified";
  const { resolvedTheme } = useTheme();
  const path = file?.name ?? (source.kind === "files" ? source.after?.name ?? source.before?.name ?? "Unknown file" : source.kind === "unchanged" ? source.file.name : source.path);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWide((entry?.contentRect.width ?? 0) >= 640));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const options = useMemo<FileDiffOptions<{ note: DiffNote; number: number }[], undefined>>(() => ({
    theme: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    themeType: resolvedTheme === "dark" ? "dark" : "light",
    diffStyle: wide ? layout : "unified",
    overflow: wrap ? "wrap" : "scroll",
    disableFileHeader: true,
    diffIndicators: "classic",
    lineDiffType: "word-alt",
    hunkSeparators: "line-info",
    expandUnchanged: context === "expanded" || (file !== undefined && expandedSource === file),
    expansionLineCount: 20,
    enableLineSelection: false,
    unsafeCSS: diffCSS,
    onPostRender(node, instance) {
      cancelAnimationFrame(revealFrame.current ?? 0);
      // The React wrapper applies a row selection to both split columns. The public
      // instance API also accepts the source side, which authored notes require.
      instance.setSelectedLines(selectedLines ?? null, { activeLineSide: activeNote ? selectedLines?.side : undefined });
      // Pierre owns the horizontal scroller inside its shadow root.
      for (const code of node.shadowRoot?.querySelectorAll<HTMLElement>("code[data-code]") ?? []) {
        code.tabIndex = wrap ? -1 : 0;
      }
      for (const button of node.shadowRoot?.querySelectorAll<HTMLElement>('button, [data-expand-button][role="button"]') ?? []) {
        if (!button.textContent?.trim() && !button.hasAttribute("aria-label")) {
          button.setAttribute("aria-label", "Expand unchanged lines");
        }
        // Pierre's expansion controls are divs; supply their keyboard behavior.
        if (button.tagName !== "BUTTON") {
          button.tabIndex = 0;
          button.onkeydown = event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            button.click();
          };
        }
      }
      const previousTop = readingPosition.current.file === file ? readingPosition.current.top : 0;
      const notePending = revealRequest !== undefined && revealRequest.file === file && revealRequest.noteId === activeNote?.id && revealedNote.current !== revealRequest;
      const legacyPending = revealKey !== undefined && revealed.current !== revealKey && highlightedLines;

      cancelAnimationFrame(revealFrame.current ?? 0);
      // Selection is applied after Pierre renders; reveal once that update reaches layout.
      revealFrame.current = requestAnimationFrame(() => {
        if (!node.isConnected) return;
        // Unified selection is a rendered-row interval, including interleaved
        // changes from the other source. Keep authored emphasis on its own side.
        // Both gutter and content cells carry the same source-type attribute.
        if (activeNote) {
          const opposite = activeNote.range.side === "after" ? "change-deletion" : "change-addition";
          for (const row of node.shadowRoot?.querySelectorAll(`[data-line-type="${opposite}"][data-selected-line]`) ?? []) {
            row.removeAttribute("data-selected-line");
            const annotation = row.nextElementSibling;
            if (annotation?.hasAttribute("data-line-annotation")) annotation.removeAttribute("data-selected-line");
          }
        }
        if (!notePending && !legacyPending) {
          // WebKit can reset the outer scroller while Pierre replaces its rows.
          // Emphasis changes preserve the reader’s position without a reveal key.
          if (viewport.current && maxHeight !== null) viewport.current.scrollTop = previousTop;
          return;
        }
        const line = node.shadowRoot?.querySelector("[data-line][data-selected-line]");
        if (line) {
          revealed.current = revealKey;
          revealedNote.current = revealRequest;
          const scroller = viewport.current;
          if (scroller && maxHeight !== null) {
            const bounds = scroller.getBoundingClientRect();
            const target = line.getBoundingClientRect();
            scroller.scrollTop += target.top - bounds.top - (scroller.clientHeight - target.height) / 2;
          } else if (!notePending) {
            line.scrollIntoView({ block: "center", behavior: "instant" });
          }
        }
      });
    },
  }), [resolvedTheme, wide, layout, wrap, context, revealKey, highlightedLines, selectedLines, activeNote, revealRequest, expandedSource, file, maxHeight]);

  const additions = file?.hunks.reduce((sum, hunk) => sum + hunk.additionLines, 0) ?? 0;
  const deletions = file?.hunks.reduce((sum, hunk) => sum + hunk.deletionLines, 0) ?? 0;

  return <section {...props} ref={node => {
    root.current = node;
    if (typeof ref === "function") return ref(node);
    if (ref) ref.current = node;
  }} aria-label={props["aria-label"] ?? `Diff for ${path}`} className={cn("@container min-w-0 [overflow-anchor:none] overflow-hidden rounded border border-border bg-background", className)}>
    <Collapsible open={!collapsed} onOpenChange={open => setCollapsed(!open)}>
    <header className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 bg-muted/60 px-3 py-2">
      <div className="flex min-w-[min(100%,16rem)] flex-1 items-center gap-2">
        <CollapsibleTrigger className="w-8 min-h-8 shrink-0 justify-center p-0 pointer-coarse:min-w-11" aria-label={`${collapsed ? "Expand" : "Collapse"} ${path}`}>
          <CaretRight aria-hidden="true" />
        </CollapsibleTrigger>
        <FileCode aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 font-mono text-small [overflow-wrap:anywhere]">
          {file?.prevName && <span className="text-muted-foreground">{file.prevName} → </span>}{path}
        </div>
      </div>
      {file && <div className="flex items-center gap-3 text-small">
        <span className="sr-only text-muted-foreground @sm:not-sr-only">{source.kind === "unchanged" ? "Unchanged" : changeLabels[file.type]}</span>
        <span className="font-mono tabular-nums" aria-label={`${additions} additions, ${deletions} deletions`}>+{additions} <span className="text-danger-text">−{deletions}</span></span>
      </div>}
      {controls && file && <div role="group" aria-label="Diff reading controls" className="ml-auto flex shrink-0 items-center">
        <TooltipProvider delay={400} closeDelay={80} timeout={400}>
          {onLayoutChange && <ReadingControl label={`Switch to ${nextLayout} view`} description={!wide ? "Split view needs a wider surface." : nextLayout === "split" ? "Split — compare the old and new code side by side." : "Unified — show removals and additions in one column."} disabled={!wide} onClick={() => onLayoutChange(nextLayout)}><PierreDiffIcon layout={nextLayout} /></ReadingControl>}
          {onWrapChange && <ReadingControl label={wrap ? "Unwrap lines" : "Wrap lines"} description={wrap ? "Unwrap lines — keep each line on one row and scroll horizontally." : "Wrap lines — fit long lines within the available width."} disabled={false} onClick={() => onWrapChange(!wrap)}>{wrap ? <UnwrapIcon size={16} aria-hidden="true" /> : <WrapIcon size={16} aria-hidden="true" />}</ReadingControl>}
        </TooltipProvider>
        <div className="ml-auto">
          {source.kind === "unchanged" && <CardCopyButton icon={<CopyIcon size={16} aria-hidden="true" />} value={source.file.contents} aria-label="Copy file" />}
          {source.kind === "patch" && <CardCopyButton icon={<CopyIcon size={16} aria-hidden="true" />} value={source.patch} aria-label="Copy patch" />}
          {source.kind === "files" && source.after && <CardCopyButton icon={<CopyIcon size={16} aria-hidden="true" />} value={source.after.contents} aria-label="Copy new file" />}
        </div>
      </div>}
    </header>
    <CollapsibleContent hiddenUntilFound={false} keepMounted>
    <div className="border-t border-border">
      {annotations && annotations.notes.filter(note => !hasRange(file, note.range)).map(note => <Note key={note.id} note={note} number={annotations.notes.indexOf(note) + 1} active={annotations.activeNoteId === note.id} unavailable onActivate={() => annotations.onActiveNoteChange(note.id)} />)}
      {notice && <p className="border-b border-border px-4 py-3 text-small">{notice}</p>}
      {message ? <p role="status" className="px-4 py-6 text-ui text-muted-foreground">{message}</p> : file && <>
        {file.type === "rename-pure" && file.hunks.length > 0 && <p className="border-b border-border px-4 py-2 text-small text-muted-foreground">File renamed without content changes.</p>}
        {source.kind === "unchanged" && <p className="border-b border-border px-4 py-2 text-small text-muted-foreground">Unchanged file · Excerpts with expandable context.</p>}
        {file.isPartial && <p className="border-b border-border px-4 py-2 text-small text-muted-foreground">Patch excerpt · Only supplied context is available.</p>}
        {file.hunks.length === 0 ? <p className="px-4 py-6 text-ui text-muted-foreground">{file.type === "rename-pure" ? "File renamed without content changes." : "No text changes."}</p> : <div ref={viewport} onScroll={event => { readingPosition.current = { file, top: event.currentTarget.scrollTop }; }} className="min-w-0 overflow-auto overscroll-contain [overflow-anchor:none] focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2" style={{ maxHeight: maxHeight ?? undefined }} tabIndex={0} role="region" aria-label={`Code changes: ${props["aria-label"] ?? path}`}>
          <FileDiff fileDiff={file} options={options} lineAnnotations={noteGroups} renderAnnotation={annotation => annotation.metadata.map(({ note, number }) => <Note key={note.id} note={note} number={number} active={annotations?.activeNoteId === note.id} unavailable={false} onActivate={() => annotations?.onActiveNoteChange(note.id)} />)} />
        </div>}
      </>}
    </div>
    </CollapsibleContent>
    </Collapsible>
  </section>;
}

export { Diff, type DiffProps, type DiffSource, type DiffNote, type DiffAnnotations };
