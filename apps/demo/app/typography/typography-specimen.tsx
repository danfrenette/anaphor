"use client";

import { Button, ButtonLabel, Kbd, KbdGroup, Prose, Text } from "@anaphor/system";
import { useState, type CSSProperties } from "react";
import { Select } from "../playground-fields";

const defaults = {
  size: "16", weight: "400", measure: "65", leading: "1.6",
  tracking: "0", color: "Reading", decoration: "Solid",
} as const;

const longIdentifier = "deployment_production_us_east_01_abcdefghijklmnopqrstuvwxyz0123456789";

export function TypographySpecimen() {
  const [size, setSize] = useState<"16" | "18" | "20">(defaults.size);
  const [weight, setWeight] = useState<"400" | "500" | "600">(defaults.weight);
  const [measure, setMeasure] = useState<"45" | "55" | "65" | "75">(defaults.measure);
  const [leading, setLeading] = useState<"1.5" | "1.6" | "1.8">(defaults.leading);
  const [tracking, setTracking] = useState<"0" | "0.01" | "0.02">(defaults.tracking);
  const [color, setColor] = useState<"Reading" | "Primary" | "Muted">(defaults.color);
  const [decoration, setDecoration] = useState<"Solid" | "Double">(defaults.decoration);
  const [expanded, setExpanded] = useState(false);
  const approved = size === defaults.size && weight === defaults.weight && measure === defaults.measure
    && leading === defaults.leading && tracking === defaults.tracking
    && color === defaults.color && decoration === defaults.decoration;

  function reset() {
    setSize(defaults.size); setWeight(defaults.weight); setMeasure(defaults.measure);
    setLeading(defaults.leading); setTracking(defaults.tracking);
    setColor(defaults.color); setDecoration(defaults.decoration);
  }

  const previewStyle: CSSProperties = {
    fontSize: `${Number(size) / 16}rem`, fontWeight: Number(weight), maxWidth: `${measure}ch`,
    lineHeight: Number(leading), letterSpacing: `${tracking}em`,
    color: color === "Primary" ? "var(--anaphor-font-secondary)"
      : color === "Muted" ? "var(--anaphor-font-tertiary)" : undefined,
  };

  return (
    <div className="mt-10">
      <details className="border-y border-border py-4">
        <summary className="min-h-11 cursor-pointer content-center text-ui">Reading experiments</summary>
        <p className="mt-2 text-ui text-muted-foreground">Changes affect only the reading sample. Reset restores approved values.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select label="Body size (px)" value={size} options={["16", "18", "20"]} onChange={setSize} />
          <Select label="Body weight" value={weight} options={["400", "500", "600"]} onChange={setWeight} />
          <Select label="Measure (ch)" value={measure} options={["45", "55", "65", "75"]} onChange={setMeasure} />
          <Select label="Leading" value={leading} options={["1.5", "1.6", "1.8"]} onChange={setLeading} />
          <Select label="Tracking (em)" value={tracking} options={["0", "0.01", "0.02"]} onChange={setTracking} />
          <Select label="Color role" value={color} options={["Reading", "Primary", "Muted"]} onChange={setColor} />
          <Select label="Link decoration" value={decoration} options={["Solid", "Double"]} onChange={setDecoration} />
        </div>
        <Button className="mt-4" iconOnly={false} loading={false} nativeButton type="button" size="sm" shape="square" variant="outline" tone="neutral" onClick={reset}>
          <ButtonLabel>Reset typography</ButtonLabel>
        </Button>
      </details>

      <p role="status" className="my-6 text-small text-muted-foreground">{approved ? "Approved defaults" : "Local experiment — not a system change"}</p>
      <section aria-label="Typography specimen" className="min-w-0 bg-background py-4">
        <Prose as="article" aria-label="Reading sample" style={previewStyle}>
          <Text as="h2" variant="section">A useful record of the work</Text>
          <p>A technical note should make its next step easy to find. Start with the decision, explain the constraint, and leave enough room for the reader to follow the example. <strong>Emphasis marks the important part.</strong> An aside can remain <em>quiet and readable.</em></p>
          <p>Use <code>deployment_id</code> when referring to a literal value. Follow the <a href="#type-reference" style={{ textDecorationStyle: decoration === "Double" ? "double" : "solid" }}>type reference</a> for the roles behind this page.</p>
          <h3>Keep the details intact</h3>
          <ul><li>Let prose wrap; preserve the spacing of code.<ul><li>Scroll long code lines without widening the document.</li></ul></li><li>Keep links underlined without requiring hover.</li><li>Expose the full value when a compact label is truncated.</li></ul>
          <blockquote><p>The same words should remain usable at a different size.</p></blockquote>
          <p>Long tokens can wrap without widening the page: <code>{longIdentifier}</code>.</p>
          <pre tabIndex={0} aria-label="Deployment code example"><code>{`const deployment = {\n  id: "${longIdentifier}",\n  region: "us-east-1",\n};`}</code></pre>
        </Prose>

        <section id="type-reference" tabIndex={-1} aria-labelledby="type-reference-title" className="mt-10 scroll-mt-24 border-t border-border pt-6">
          <Text as="h2" variant="section" id="type-reference-title">Type reference</Text>
          <Text as="p" variant="body" className="mt-4">Headings use Text with an explicit heading element. Article links and code use native HTML inside Prose. Outside an article, literal values use Text’s code variant.</Text>
          <Text as="code" variant="code" className="mt-4 block">request.duration_ms</Text>
          <Text as="p" variant="body" className="mt-4">Keyboard notation is presentational: <KbdGroup aria-label="Command K"><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>. It does not register a shortcut.</Text>
          <div className="mt-6 max-w-full">
            <Text as="p" variant="label">Compact identifier</Text>
            <Text as="code" variant="code" id="full-identifier" style={{ whiteSpace: expanded ? "normal" : "nowrap" }} className={`mt-2 block max-w-[24ch] ${expanded ? "" : "truncate"}`}>{longIdentifier}</Text>
            <Button className="mt-3" iconOnly={false} loading={false} nativeButton type="button" size="sm" shape="square" variant="outline" tone="neutral" aria-expanded={expanded} aria-controls="full-identifier" onClick={() => setExpanded(!expanded)}>
              <ButtonLabel>{expanded ? "Hide value" : "Show value"}</ButtonLabel>
            </Button>
          </div>
        </section>
      </section>
    </div>
  );
}
