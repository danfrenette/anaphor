"use client";

import { useState } from "react";
import * as Effect from "effect/Effect";
import {
  MicrophoneIcon, NotePencilIcon, LinkIcon, MagnifyingGlassIcon,
  SparkleIcon, PlayIcon, StopIcon, ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import {
  Badge, Button, ButtonLabel, Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardAction, CardFooter, Checkbox,
} from "@anaphor/system";
import { Graph, Node, Edge, useGraph } from "../components/diagrams/graph";
import { useDiagramPlayback } from "../components/diagrams/use-diagram-playback";
import {
  captureSource, initialNotebook, sourceOrder, sources, type SourceId,
} from "./notebook-diagram";

const sourceIcons = {
  audio: MicrophoneIcon,
  note: NotePencilIcon,
  link: LinkIcon,
} satisfies Record<SourceId, typeof MicrophoneIcon>;

const sourceMeta = {
  audio: { format: "Audio", result: "+3 notes" },
  note: { format: "Text", result: "+1 note" },
  link: { format: "URL", result: "+1 source" },
} satisfies Record<SourceId, { format: string; result: string }>;

function NotebookDiagram() {
  const graph = useGraph();
  const playback = useDiagramPlayback();
  const [notebook, setNotebook] = useState(initialNotebook);
  const [status, setStatus] = useState("Choose something to capture");
  const flow = { pulse: graph.pulse, update: setNotebook, report: setStatus };
  const capturedItems = notebook.notes + notebook.recordings + notebook.links;
  const synchronized = notebook.revision === notebook.indexedRevision && notebook.revision === notebook.summaryRevision;

  function capture(id: SourceId) {
    graph.clearGlows();
    playback.setLoop(false);
    playback.run(captureSource(id, flow));
  }

  function play() {
    graph.clearGlows();
    playback.run(Effect.gen(function* () {
      for (const id of sourceOrder) {
        yield* captureSource(id, flow);
        yield* Effect.sleep(840);
      }
      yield* Effect.sleep(1000);
    }), { repeat: true });
  }

  function stop() {
    playback.stop();
    graph.clearGlows();
    setStatus("Stopped · capture something when you’re ready");
  }

  function reset() {
    playback.stop();
    graph.clearGlows();
    setNotebook(initialNotebook);
    setStatus("Choose something to capture");
  }

  return (
    <>
      <div tabIndex={0} role="region" aria-label="Notebook diagram; scroll horizontally to explore" className="overflow-x-auto">
        <div className="mx-auto grid w-[920px] grid-cols-[240px_260px_240px] items-center gap-x-[70px] px-5 py-12">
          <div className="flex flex-col gap-4">
            <p className="mb-2 text-label uppercase tracking-[.08em] text-muted-foreground">01 / Capture</p>
            {sourceOrder.map(id => {
              const source = sources[id];
              const Icon = sourceIcons[id];
              return (
                <Node key={id} nodeId={id} aria-label={source.title} className="rounded-card">
                  <Card>
                    <CardHeader>
                      <CardTitle>{source.title}</CardTitle>
                      <CardDescription>{source.description}</CardDescription>
                      <CardAction>
                        <Button variant="outline" tone="neutral" size="sm" iconOnly aria-label={`Capture from ${source.title}`} onClick={() => capture(id)}>
                          <Icon size={16} aria-hidden="true" />
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="px-6 pb-4 text-small">
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-muted-foreground">
                        <span>Input / {sourceMeta[id].format}</span>
                        <Badge variant="outline" size="sm">{sourceMeta[id].result}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Node>
              );
            })}
          </div>

          <div>
            <p className="mb-6 text-label uppercase tracking-[.08em] text-muted-foreground">02 / Organize</p>
            <Node nodeId="notebook" id="diagram-notebook" aria-label="Notebook" className="rounded-card">
              <Card>
                <CardHeader>
                  <CardTitle>Notebook</CardTitle>
                  <CardDescription>A home for what you learn</CardDescription>
                  <CardAction><Badge variant="outline" size="sm">Rev {String(notebook.revision).padStart(2, "0")}</Badge></CardAction>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-border text-ui">
                    <Metric label="Notes" value={notebook.notes} />
                    <Metric label="Recordings" value={notebook.recordings} />
                    <Metric label="Saved links" value={notebook.links} />
                  </dl>
                </CardContent>
                <CardFooter className="px-6 pb-4 text-small">
                  <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-3 text-muted-foreground">
                    <span>Downstream sync</span>
                    <Badge variant={synchronized ? "soft" : "outline"} size="sm">{synchronized ? "Current" : "Updating"}</Badge>
                  </div>
                </CardFooter>
              </Card>
            </Node>
          </div>

          <div className="flex flex-col gap-4">
            <p className="mb-2 text-label uppercase tracking-[.08em] text-muted-foreground">03 / Connect</p>
            <Node nodeId="search" aria-label="Search index" className="rounded-card">
              <OutputCard
                title="Search index"
                description="Makes captured material retrievable"
                detail={`${capturedItems} ${capturedItems === 1 ? "item" : "items"} available`}
                revision={notebook.indexedRevision}
                icon={MagnifyingGlassIcon}
              />
            </Node>
            <Node nodeId="summary" aria-label="Summary" className="rounded-card">
              <OutputCard
                title="Summary"
                description="Distills the latest notebook context"
                detail={notebook.notes === 0 ? "Waiting for source material" : `${notebook.notes} ${notebook.notes === 1 ? "note" : "notes"} synthesized`}
                revision={notebook.summaryRevision}
                icon={SparkleIcon}
              />
            </Node>
          </div>
        </div>
      </div>

      {sourceOrder.map(id => <Edge key={id} edgeId={`${id}-notebook`} from={id} to="notebook" />)}
      <Edge edgeId="notebook-search" from="notebook" to="search" />
      <Edge edgeId="notebook-summary" from="notebook" to="summary" />

      <div className="relative z-[4] flex flex-wrap items-center justify-between gap-4 border-t border-border bg-background px-6 py-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" tone="neutral" size="sm" onClick={playback.running ? stop : play}>
            {playback.running ? <StopIcon size={16} aria-hidden="true" /> : <PlayIcon size={16} aria-hidden="true" />}
            <ButtonLabel>{playback.running ? "Stop flow" : "Play flow"}</ButtonLabel>
          </Button>
          <Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label="Reset diagram" onClick={reset}>
            <ArrowCounterClockwiseIcon size={16} aria-hidden="true" />
          </Button>
          <label className="flex cursor-pointer items-center gap-3 text-ui">
            <Checkbox aria-label="Loop" checked={playback.loop} onCheckedChange={playback.setLoop} />
            Loop
          </label>
        </div>
        <p role="status" className="text-small text-muted-foreground">
          {playback.error ? "The flow could not finish. Try capturing again." : status}
        </p>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function OutputCard({ title, description, detail, revision, icon: Icon }: {
  title: string;
  description: string;
  detail: string;
  revision: number;
  icon: typeof MagnifyingGlassIcon;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction><Icon size={16} aria-hidden="true" /></CardAction>
      </CardHeader>
      <CardContent className="px-6 pb-4 text-small">
        <div className="border-t border-border pt-3 text-muted-foreground">{detail}</div>
      </CardContent>
      <CardFooter className="px-6 pb-4 text-small">
        <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-3 text-muted-foreground">
          <span>Index revision</span>
          <Badge variant="outline" size="sm">{String(revision).padStart(2, "0")}</Badge>
        </div>
      </CardFooter>
    </Card>
  );
}

export function NodeEdgeDemo() {
  return (
    <section id="node-edge-graphs" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 text-label uppercase tracking-[.08em] text-muted-foreground">
          <p>03.03 / Component</p><p>Status / Study</p>
        </div>
        <h2 className="mt-8 text-title font-medium tracking-[-.02em]">Node-edge graphs</h2>
        <p className="prose-reading mt-3 text-pretty">From a fleeting thought to connected knowledge. Capture something, watch it reach the notebook, then follow the update into search and a summary.</p>
      </header>
      <div className="mt-8"><NotebookExample /></div>
      <p className="mt-4 text-small text-muted-foreground">An authored illustration with simulated data. Pulse illumination inspired by <a className="underline underline-offset-4" href="https://x.com/kitlangton/status/2096703869136867563" target="_blank" rel="noreferrer">Kit Langton’s diagrams</a>.</p>
    </section>
  );
}

export function NotebookExample() {
  return (
      <div className="dark overflow-hidden rounded-card border border-border bg-background text-foreground">
        <div className="flex flex-wrap justify-between gap-3 border-b border-border px-6 py-5 text-small">
          <span>A connected notebook</span><span>Choose a capture source to follow its path</span>
        </div>
        <Graph><NotebookDiagram /></Graph>
      </div>
  );
}
