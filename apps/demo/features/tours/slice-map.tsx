"use client";

import { Graph, Node, Edge } from "../../components/diagrams/graph";

/** Authored reading map, not execution evidence. */
export function SliceMap({ sectionId, steps }: { sectionId: string; steps: { id: string; title: string }[] }) {
  return <figure aria-label="Implementation reading map" className="space-y-3">
    <figcaption className="text-small text-muted-foreground">Reading map · authored explanation</figcaption>
    <Graph pulseSpeed={120}>
      <ol className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => <li key={step.id} className="min-w-0">
          <Node nodeId={step.id} variant="plain" aria-label={step.title}>
            <a href={`#tour-step:${sectionId}:${step.id}`} className="block min-h-11 bg-background px-3 py-3 text-ui underline underline-offset-4 [overflow-wrap:anywhere]">
              {index + 1}. {step.title}
            </a>
          </Node>
        </li>)}
      </ol>
      {steps.slice(1).map((step, index) => <Edge key={step.id} edgeId={`${steps[index]!.id}-${step.id}`} from={steps[index]!.id} to={step.id} />)}
    </Graph>
  </figure>;
}
