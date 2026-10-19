"use client";

import { Button, ButtonLabel, Diff, Section, Text, type DiffSource } from "@anaphor/system";
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

const fileStates: { name: string; source: DiffSource }[] = [
  { name: "Added", source: { kind: "files", before: null, after: { name: "src/articles/constants.ts", contents: 'export const INITIAL_PROGRESS = 0;\n' } } },
  { name: "Deleted", source: { kind: "files", before: { name: "src/articles/legacy.ts", contents: 'export const WRAP_NAVIGATION = true;\n' }, after: null } },
  { name: "Renamed", source: { kind: "files", before: { name: "src/articles/position.ts", contents: before }, after: { name: "src/articles/reading-position.ts", contents: before } } },
  { name: "Unavailable", source: { kind: "unavailable", path: "public/article-preview.png", reason: "Binary file changed. A text diff is not available." } },
];
const defaults = { layout: "unified", wrap: false, context: "collapsed", controls: true, height: "Page flow" } as const;
type Settings = { layout: "unified" | "split"; wrap: boolean; context: "collapsed" | "expanded"; controls: boolean; height: "Page flow" | "Bounded" };
const exampleCode = `<Diff source={source} layout="unified" wrap={false}
  controls={false} context="collapsed" maxHeight={null} />`;

export function DiffDemo() {
  const [settings, setSettings] = useState<Settings>(defaults);
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
          <Button type="button" nativeButton size="sm" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false} disabled={!highlightGuard} onClick={() => setHighlightGuard(false)}><ButtonLabel>Clear highlight</ButtonLabel></Button>
        </div>
        <Diff aria-label="Navigation guard excerpt" source={excerpt} layout="unified" wrap={false} controls={false} context="collapsed" maxHeight={null} highlightedLines={highlightGuard ? { start: 20, end: 20, side: "additions" } : undefined} revealKey={highlightGuard ? reveal : undefined} notice={highlightGuard ? "Highlighted line 20: the guard for a missing section." : undefined} />
      </CatalogExample>
      <CatalogExample framed={false} title="File states" description="Added, deleted, renamed, and unavailable files keep their status explicit." code={`// Complete files: use null for the missing side.
<Diff source={{ kind: "files", before: null, after: file }}
  layout="unified" wrap={false} controls={false}
  context="collapsed" maxHeight={null} />`}>
        <div className="grid min-w-0 gap-6">{fileStates.map(state => <div key={state.name} className="min-w-0">
          <h4 className="mb-3 font-sans text-ui font-medium normal-case text-muted-foreground">{state.name}</h4>
          <Diff aria-label={`${state.name} file example`} source={state.source} layout="unified" wrap={false} controls={false} context="collapsed" maxHeight={null} />
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
