"use client";

import { Button, ButtonLabel, Diff, Section, Text, type DiffNote, type DiffSource } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";
import { useState } from "react";

const before = `import type { ArticleDocument, ArticleSection } from "./types";

export type ReadingPosition = {
  sectionId: string;
  progress: number;
};

export function sectionLabel(section: ArticleSection): string {
  return section.title.trim() || "Untitled section";
}

export function nextSection(
  document: ArticleDocument,
  currentId: string,
): ArticleSection | undefined {
  const index = document.sections.findIndex(
    section => section.id === currentId,
  );

  return document.sections[index + 1];
}

export function readingProgress(
  document: ArticleDocument,
  currentId: string,
): ReadingPosition {
  const index = document.sections.findIndex(
    section => section.id === currentId,
  );

  return {
    sectionId: currentId,
    progress: index / document.sections.length,
  };
}
`;
const after = before.replace(
  "  return document.sections[index + 1];",
  `  if (index < 0) return undefined;

  return document.sections.at(index + 1);`,
).replace(
  "    progress: index / document.sections.length,",
  `    progress: index < 0
      ? 0
      : (index + 1) / document.sections.length,`,
);
const source: DiffSource = {
  kind: "files",
  before: { name: "src/articles/reading-position.ts", contents: before },
  after: { name: "src/articles/reading-position.ts", contents: after },
};
const alternateSource: DiffSource = { kind: "files", before: { name: "src/articles/reading-position.ts", contents: before }, after: { name: "src/articles/reading-position.ts", contents: after + "\n// Captured again after the review.\n" } };
const excerpt: DiffSource = {
  kind: "patch", path: "src/articles/reading-position.ts",
  patch: `diff --git a/src/articles/reading-position.ts b/src/articles/reading-position.ts
--- a/src/articles/reading-position.ts
+++ b/src/articles/reading-position.ts
@@ -17,5 +17,7 @@ export function nextSection(
     section => section.id === currentId,
   );
 
-  return document.sections[index + 1];
+  if (index < 0) return undefined;
+
+  return document.sections.at(index + 1);
 }
`,
};

const missingContextNotes: DiffNote[] = [{ id: "missing-context", title: "Explain omitted context", body: "This patch does not contain the unchanged label implementation.", presentation: "inline", range: { side: "after", start: 8, end: 10 } }];
const notes: DiffNote[] = [
  { id: "guard", title: "Guard missing sections", body: "Unknown sections return no next section instead of restarting at the beginning.", presentation: "inline", range: { side: "after", start: 20, end: 22 } },
  { id: "overlap", title: "Keep the return nearby", body: "The guard and successful return stay together.", presentation: "popover", range: { side: "after", start: 21, end: 22 } },
  { id: "label", title: "Keep the existing label", body: "The fallback title is unchanged and remains part of the reading contract.", presentation: "inline", range: { side: "after", start: 8, end: 10 } },
  { id: "old", title: "Replace implicit wrapping", body: "The old lookup restarted navigation when the current section was missing.", presentation: "inline", range: { side: "before", start: 20, end: 20 } },
  { id: "missing", title: "Explain a missing capture", body: "This original source range was not captured. The explanation remains readable.", presentation: "inline", range: { side: "after", start: 999, end: 999 } },
];

const unchangedContents = before + '// Keep the original source location visible even when a reviewer follows a long explanation across a narrow screen; this line deliberately exercises wrapping and horizontal inspection without changing the captured source.\n';
const unchangedSource: DiffSource = { kind: "unchanged", file: { name: "src/articles/labels.ts", contents: unchangedContents }, excerpts: [{ start: 8, end: 10 }, { start: 36, end: 36 }] };
const excerptNotes: DiffNote[] = [
  { id: "label-contract", title: "Preserve a readable fallback when the authored section title is empty", body: "An unchanged dependency can explain why a changed navigation path remains readable. The source is shown with its original numbering.", presentation: "inline", range: { side: "after", start: 8, end: 10 } },
];

const fileStates: { name: string; source: DiffSource }[] = [
  { name: "Added", source: { kind: "files", before: null, after: { name: "src/articles/constants.ts", contents: 'export const INITIAL_PROGRESS = 0;\n' } } },
  { name: "Deleted", source: { kind: "files", before: { name: "src/articles/legacy.ts", contents: 'export const WRAP_NAVIGATION = true;\n' }, after: null } },
  { name: "Renamed", source: { kind: "files", before: { name: "src/articles/position.ts", contents: before }, after: { name: "src/articles/reading-position.ts", contents: before } } },
  { name: "Unavailable", source: { kind: "unavailable", path: "public/article-preview.png", reason: "Binary file changed. A text diff is not available." } },
];
const annotatedFileStates = fileStates.map(state => {
  const note: DiffNote = { id: state.name, title: `Explain the ${state.name.toLowerCase()} source`, body: state.name === "Unavailable" ? "The author’s explanation stays readable even when the binary capture cannot be displayed as code." : "The note refers to the original source on the available side of this change.", presentation: "inline", range: { side: state.name === "Deleted" ? "before" : "after", start: 1, end: 1 } };
  return { ...state, notes: [note] };
});
const defaults = { layout: "unified", wrap: false, context: "collapsed", controls: true, height: "Page flow" } as const;
type Settings = { layout: "unified" | "split"; wrap: boolean; context: "collapsed" | "expanded"; controls: boolean; height: "Page flow" | "Bounded" };
const exampleCode = `<Diff source={source} layout="unified" wrap={false}
  controls={false} context="collapsed" maxHeight={null} />`;

export function DiffDemo() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [alternateCapture, setAlternateCapture] = useState(false);
  const [sourceAvailable, setSourceAvailable] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteReveal, setNoteReveal] = useState(0);
  const [reveal, setReveal] = useState(0);
  const [highlightGuard, setHighlightGuard] = useState(false);
  return <Section id="diff" className="border-t border-border py-12">
    <Text as="h2" variant="title">Diff</Text>
    <Text as="p" variant="description" className="mt-3">Read what changed. Compare layouts, reveal context, and draw attention to a specific line.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample framed={false} title="Layouts" description="The same change in unified and split views. Narrow surfaces use unified view automatically." code={exampleCode}>
        <div className="grid min-w-0 gap-6">{(["unified", "split"] as const).map(layout => <div key={layout} className="min-w-0">
          <h4 className="mb-3 font-sans text-ui font-medium normal-case text-muted-foreground">{layout === "unified" ? "Unified" : "Split"}</h4>
          <Diff aria-label={`${layout === "unified" ? "Unified" : "Split"} layout example`} source={excerpt} layout={layout} wrap={false} controls={false} context="collapsed" maxHeight={null} />
        </div>)}</div>
      </CatalogExample>
      <CatalogExample framed={false} title="Line emphasis" description="Locate a line without moving keyboard focus. Emphasis uses the original file’s line numbers." code={`<Diff source={excerpt} layout="unified" wrap={false}
  controls={false} context="collapsed" maxHeight={null}
  highlightedLines={{ start: 20, end: 20, side: "additions" }}
  revealKey={reveal} />`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" nativeButton size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={false} onClick={() => { setHighlightGuard(true); setReveal(value => value + 1); }}><ButtonLabel>Locate the guard</ButtonLabel></Button>
          <Button type="button" nativeButton size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={false} onClick={() => { setActiveNoteId("missing-context"); setNoteReveal(value => value + 1); }}><ButtonLabel>Locate omitted context</ButtonLabel></Button>
          <Button type="button" nativeButton size="sm" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false} disabled={!highlightGuard} onClick={() => setHighlightGuard(false)}><ButtonLabel>Clear highlight</ButtonLabel></Button>
        </div>
        <Diff aria-label="Navigation guard excerpt" source={excerpt} layout="unified" wrap={false} controls={false} context="collapsed" maxHeight={null} highlightedLines={highlightGuard ? { start: 20, end: 20, side: "additions" } : undefined} revealKey={highlightGuard ? reveal : undefined} notice={highlightGuard && activeNoteId !== "missing-context" ? "Highlighted line 20: the guard for a missing section." : undefined} annotations={{ notes: missingContextNotes, activeNoteId, onActiveNoteChange: setActiveNoteId, revealKey: noteReveal }} />
      </CatalogExample>
      <CatalogExample framed={false} title="Authored notes" description="Read explanations in place, or follow an external note without opening its explanation again." code={`<Diff annotations={{ notes, activeNoteId, onActiveNoteChange, revealKey }} {...settings} />`}>
        <ol aria-label="Change explanations" className="mb-4 space-y-2">{notes.map((note, index) => <li key={note.id}>
          <Button type="button" nativeButton size="md" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false} className="h-auto min-w-0 max-w-full whitespace-normal py-2 text-start" onClick={() => { setActiveNoteId(note.id); setNoteReveal(previous => previous + 1); }}><ButtonLabel>Locate {index + 1}: {note.title}</ButtonLabel></Button>
        </li>)}</ol>
        <div className="mb-4"><Button type="button" nativeButton size="md" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={false} onClick={() => { setSourceAvailable(value => !value); setActiveNoteId(null); }}><ButtonLabel>{sourceAvailable ? "Show unavailable source" : "Restore captured source"}</ButtonLabel></Button></div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" nativeButton size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={false} onClick={() => setActiveNoteId("guard")}><ButtonLabel>Emphasize guard only</ButtonLabel></Button>
          <Button type="button" nativeButton size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={false} onClick={() => { setSourceAvailable(true); setAlternateCapture(value => !value); setActiveNoteId("guard"); setNoteReveal(value => value + 1); }}><ButtonLabel>Replace captured source</ButtonLabel></Button>
        </div>
        <Diff aria-label="Annotated navigation" source={sourceAvailable ? (alternateCapture ? alternateSource : source) : { kind: "unavailable", path: "src/articles/reading-position.ts", reason: "The captured source is unavailable. Authored explanations are retained." }} layout="split" wrap controls={false} context="collapsed" maxHeight={280} annotations={{ notes, activeNoteId, onActiveNoteChange: setActiveNoteId, revealKey: noteReveal }} />
      </CatalogExample>
      <CatalogExample framed={false} title="Unchanged excerpts" description="Inspect the existing contract with original line numbers and expandable context." code={`<Diff source={{ kind: "unchanged", file, excerpts: [{ start: 8, end: 10 }] }} {...settings} />`}>
        <Diff aria-label="Unchanged label contract" source={unchangedSource} layout="unified" wrap controls={false} context="collapsed" maxHeight={280} annotations={{ notes: excerptNotes, activeNoteId, onActiveNoteChange: setActiveNoteId }} />
      </CatalogExample>
      <CatalogExample framed={false} title="File states" description="Added, deleted, renamed, and unavailable files keep their status explicit." code={`// Complete files: use null for the missing side.
<Diff source={{ kind: "files", before: null, after: file }}
  layout="unified" wrap={false} controls={false}
  context="collapsed" maxHeight={null} />`}>
        <div className="grid min-w-0 gap-6">{annotatedFileStates.map(state => <div key={state.name} className="min-w-0">
          <h4 className="mb-3 font-sans text-ui font-medium normal-case text-muted-foreground">{state.name}</h4>
          <Diff aria-label={`${state.name} file example`} source={state.source} layout="unified" wrap={false} controls={false} context="collapsed" maxHeight={240} annotations={{ notes: state.notes, activeNoteId, onActiveNoteChange: setActiveNoteId }} />
        </div>)}</div>
      </CatalogExample>
      <div>
        <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
        <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore layout, wrapping, context, reading controls, and a bounded code area.</p>
        <PlaygroundControls sectionId="diff" title="Diff" onReset={() => setSettings(defaults)}>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Layout" value={settings.layout} options={["unified", "split"]} onChange={layout => setSettings(s => ({ ...s, layout }))} />
            <Select label="Context" value={settings.context} options={["collapsed", "expanded"]} onChange={context => setSettings(s => ({ ...s, context }))} />
            <Select label="Height" value={settings.height} options={["Page flow", "Bounded"]} onChange={height => setSettings(s => ({ ...s, height }))} />
            <Check label="Wrap lines" checked={settings.wrap} onChange={wrap => setSettings(s => ({ ...s, wrap }))} />
            <Check label="Reading controls" checked={settings.controls} onChange={controls => setSettings(s => ({ ...s, controls }))} />
          </div>
        </PlaygroundControls>
        <div className="mt-4"><Diff aria-label="Diff playground" source={source} layout={settings.layout} wrap={settings.wrap} controls={settings.controls} context={settings.context} maxHeight={settings.height === "Bounded" ? 320 : null} onLayoutChange={layout => setSettings(s => ({ ...s, layout }))} onWrapChange={wrap => setSettings(s => ({ ...s, wrap }))} /></div>
        <p className="mt-4 text-small text-muted-foreground">The playground supplies complete files so unchanged context can expand. Patch examples can only show the context included in their source.</p>
      </div>
    </div>
  </Section>;
}
