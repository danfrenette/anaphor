"use client";

import { SVGSpriteSheet, parseDiffFromFile, parsePatchFiles, type FileContents, type FileDiffMetadata, type SelectedLineRange } from "@pierre/diffs";
import { CopyIcon, UnwrapIcon, WrapIcon } from "@primer/octicons-react";
import { FileDiff, type FileDiffOptions } from "@pierre/diffs/react";
import { CaretRight, FileCode } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "./button";
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { CardCopyButton } from "./card-copy-button";
import { useTheme } from "./theme";
import { cn } from "../lib/utils";

type DiffSource =
  | { kind: "patch"; patch: string; path: string }
  | { kind: "files"; before: FileContents | null; after: FileContents | null }
  | { kind: "unavailable"; path: string; reason: string };

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
  onLayoutChange?: (layout: "unified" | "split") => void;
  onWrapChange?: (wrap: boolean) => void;
};

function readSource(source: DiffSource): { file?: FileDiffMetadata; message?: string } {
  if (source.kind === "unavailable") return { message: source.reason };
  try {
    if (source.kind === "files") {
      if (!source.before && !source.after) return { message: "No file contents supplied." };
      return { file: parseDiffFromFile(source.before, source.after, { context: 3 }, true) };
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
button:focus-visible, code[data-code]:focus-visible { outline: 2px solid var(--anaphor-focus); outline-offset: -2px; }
@media (pointer: coarse) { button { min-height: 44px; } }
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

function Diff({ source, layout, wrap, controls, context, maxHeight, highlightedLines, revealKey, notice, onLayoutChange, onWrapChange, className, ref, ...props }: DiffProps) {
  const { file, message } = useMemo(() => readSource(source), [source]);
  const [collapsed, setCollapsed] = useState(false);
  const [wide, setWide] = useState(false);
  const root = useRef<HTMLElement>(null);
  const revealed = useRef<string | number | undefined>(undefined);
  const revealFrame = useRef<number | undefined>(undefined);
  useEffect(() => () => cancelAnimationFrame(revealFrame.current ?? 0), []);
  const effectiveLayout = wide ? layout : "unified";
  const nextLayout = effectiveLayout === "unified" ? "split" : "unified";
  const { resolvedTheme } = useTheme();
  const path = file?.name ?? (source.kind === "files" ? source.after?.name ?? source.before?.name ?? "Unknown file" : source.path);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWide((entry?.contentRect.width ?? 0) >= 640));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const options = useMemo<FileDiffOptions<undefined, undefined>>(() => ({
    theme: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    themeType: resolvedTheme === "dark" ? "dark" : "light",
    diffStyle: wide ? layout : "unified",
    overflow: wrap ? "wrap" : "scroll",
    disableFileHeader: true,
    diffIndicators: "classic",
    lineDiffType: "word-alt",
    hunkSeparators: "line-info",
    expandUnchanged: context === "expanded",
    expansionLineCount: 20,
    enableLineSelection: false,
    unsafeCSS: diffCSS,
    onPostRender(node) {
      // Pierre owns the horizontal scroller inside its shadow root.
      for (const code of node.shadowRoot?.querySelectorAll<HTMLElement>("code[data-code]") ?? []) {
        code.tabIndex = wrap ? -1 : 0;
      }
      for (const button of node.shadowRoot?.querySelectorAll("button") ?? []) {
        if (!button.textContent?.trim() && !button.hasAttribute("aria-label")) {
          button.setAttribute("aria-label", "Expand unchanged lines");
        }
      }
      if (revealKey === undefined || revealed.current === revealKey || !highlightedLines) return;
      cancelAnimationFrame(revealFrame.current ?? 0);
      // Selection is applied after Pierre renders; reveal once that update reaches layout.
      revealFrame.current = requestAnimationFrame(() => {
        const line = node.shadowRoot?.querySelector("[data-line][data-selected-line]");
        if (line) {
          revealed.current = revealKey;
          line.scrollIntoView({ block: "center", behavior: "instant" });
        }
      });
    },
  }), [resolvedTheme, wide, layout, wrap, context, revealKey, highlightedLines]);

  const additions = file?.hunks.reduce((sum, hunk) => sum + hunk.additionLines, 0) ?? 0;
  const deletions = file?.hunks.reduce((sum, hunk) => sum + hunk.deletionLines, 0) ?? 0;

  return <section {...props} ref={node => {
    root.current = node;
    if (typeof ref === "function") return ref(node);
    if (ref) ref.current = node;
  }} aria-label={props["aria-label"] ?? `Diff for ${path}`} className={cn("@container min-w-0 overflow-hidden rounded border border-border bg-background", className)}>
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
        <span className="sr-only text-muted-foreground @sm:not-sr-only">{changeLabels[file.type]}</span>
        <span className="font-mono tabular-nums" aria-label={`${additions} additions, ${deletions} deletions`}>+{additions} <span className="text-danger-text">−{deletions}</span></span>
      </div>}
      {controls && file && <div role="group" aria-label="Diff reading controls" className="ml-auto flex shrink-0 items-center">
        <TooltipProvider delay={400} closeDelay={80} timeout={400}>
          {onLayoutChange && <ReadingControl label={`Switch to ${nextLayout} view`} description={!wide ? "Split view needs a wider surface." : nextLayout === "split" ? "Split — compare the old and new code side by side." : "Unified — show removals and additions in one column."} disabled={!wide} onClick={() => onLayoutChange(nextLayout)}><PierreDiffIcon layout={nextLayout} /></ReadingControl>}
          {onWrapChange && <ReadingControl label={wrap ? "Unwrap lines" : "Wrap lines"} description={wrap ? "Unwrap lines — keep each line on one row and scroll horizontally." : "Wrap lines — fit long lines within the available width."} disabled={false} onClick={() => onWrapChange(!wrap)}>{wrap ? <UnwrapIcon size={16} aria-hidden="true" /> : <WrapIcon size={16} aria-hidden="true" />}</ReadingControl>}
        </TooltipProvider>
        <div className="ml-auto">
          {source.kind === "patch" && <CardCopyButton icon={<CopyIcon size={16} aria-hidden="true" />} value={source.patch} aria-label="Copy patch" />}
          {source.kind === "files" && source.after && <CardCopyButton icon={<CopyIcon size={16} aria-hidden="true" />} value={source.after.contents} aria-label="Copy new file" />}
        </div>
      </div>}
    </header>
    <CollapsibleContent hiddenUntilFound={false} keepMounted>
    <div className="border-t border-border">
      {notice && <p className="border-b border-border px-4 py-3 text-small">{notice}</p>}
      {message ? <p role="status" className="px-4 py-6 text-ui text-muted-foreground">{message}</p> : file && <>
        {file.isPartial && <p className="border-b border-border px-4 py-2 text-small text-muted-foreground">Patch excerpt · Only supplied context is available.</p>}
        {file.hunks.length === 0 ? <p className="px-4 py-6 text-ui text-muted-foreground">{file.type === "rename-pure" ? "File renamed without content changes." : "No text changes."}</p> : <div className="min-w-0 overflow-auto focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2" style={{ maxHeight: maxHeight ?? undefined }} tabIndex={0} role="region" aria-label={`Code changes: ${props["aria-label"] ?? path}`}>
          <FileDiff fileDiff={file} options={options} selectedLines={highlightedLines ?? null} />
        </div>}
      </>}
    </div>
    </CollapsibleContent>
    </Collapsible>
  </section>;
}

export { Diff, type DiffProps, type DiffSource };
