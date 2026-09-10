"use client";

import { useState } from "react";
import * as Effect from "effect/Effect";
import {
  MicrophoneIcon, NotePencilIcon, LinkIcon, MagnifyingGlassIcon,
  SparkleIcon, PlayIcon, StopIcon, ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import {
  Button, ButtonLabel, Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardAction, Checkbox,
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

function NotebookDiagram() {
  const graph = useGraph();
  const playback = useDiagramPlayback();
  const [notebook, setNotebook] = useState(initialNotebook);
  const [status, setStatus] = useState("Choose something to capture");
  const flow = { pulse: graph.pulse, update: setNotebook, report: setStatus };

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
        <div className="mx-auto grid w-[840px] grid-cols-[220px_240px_220px] items-center gap-x-[60px] px-5 py-12">
          <div className="flex flex-col gap-4">
            <p className="mb-2 text-label uppercase tracking-[.08em] text-muted-foreground">01 / Capture</p>
            {sourceOrder.map(id => {
              const source = sources[id];
              const Icon = sourceIcons[id];
              return (
                <Node key={id} nodeId={id} className="rounded-card">
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
                  </Card>
                </Node>
              );
            })}
          </div>

          <div>
            <p className="mb-6 text-label uppercase tracking-[.08em] text-muted-foreground">02 / Organize</p>
            <Node nodeId="notebook" id="diagram-notebook" className="rounded-card">
              <Card>
                <CardHeader>
                  <CardTitle>Notebook</CardTitle>
                  <CardDescription>A home for what you learn</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-border text-ui">
                    <Metric label="Notes" value={notebook.notes} />
                    <Metric label="Recordings" value={notebook.recordings} />
                    <Metric label="Saved links" value={notebook.links} />
                  </dl>
                  <p className="mt-4 text-small text-muted-foreground">Revision {notebook.revision}</p>
                </CardContent>
              </Card>
            </Node>
          </div>

          <div className="flex flex-col gap-4">
            <p className="mb-2 text-label uppercase tracking-[.08em] text-muted-foreground">03 / Connect</p>
            <Node nodeId="search" className="rounded-card">
              <Card>
                <CardHeader>
                  <CardTitle>Search index</CardTitle>
                  <CardDescription className="col-span-full whitespace-nowrap tabular-nums">Revision {notebook.indexedRevision}</CardDescription>
                  <CardAction><MagnifyingGlassIcon size={16} aria-hidden="true" /></CardAction>
                </CardHeader>
              </Card>
            </Node>
            <Node nodeId="summary" className="rounded-card">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription className="col-span-full whitespace-nowrap tabular-nums">Revision {notebook.summaryRevision}</CardDescription>
                  <CardAction><SparkleIcon size={16} aria-hidden="true" /></CardAction>
                </CardHeader>
              </Card>
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
