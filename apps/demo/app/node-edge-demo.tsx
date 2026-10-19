"use client";

import { Section, Text } from "@anaphor/system";

import { useState } from "react";
import * as Effect from "effect/Effect";
import {
  MicrophoneIcon, NotePencilIcon, LinkIcon, MagnifyingGlassIcon,
  SparkleIcon, PlayIcon, StopIcon, ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import {
  Badge, Button, ButtonLabel, Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardAction, CardFooter,
} from "@anaphor/system";
import { Graph, Node, Edge, useGraph, useGraphPlayback } from "../components/diagrams/graph";
import {
  captureSource, initialNotebook, sourceOrder, sources, type SourceId,
} from "./notebook-diagram";

import { CatalogExample } from "./catalog-example";
import { PlaygroundControls } from "./playground-host";
import { Check, Range } from "./playground-fields";

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

function NotebookDiagram({ speed, onSpeedChange }: { speed: number; onSpeedChange: (speed: number) => void }) {
  const graph = useGraph();
  const playback = useGraphPlayback();
  const [notebook, setNotebook] = useState(initialNotebook);
  const [status, setStatus] = useState("Choose something to capture");
  const flow = { pulse: graph.pulse, update: setNotebook, report: setStatus };
  const capturedItems = notebook.notes + notebook.recordings + notebook.links;
  const synchronized = notebook.revision === notebook.indexedRevision && notebook.revision === notebook.summaryRevision;

  function capture(id: SourceId) {
    playback.setLoop(false);
    playback.run(captureSource(id, flow));
  }

  function play() {
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
    setStatus("Stopped · capture something when you’re ready");
  }

  function reset() {
    playback.stop();
    setNotebook(initialNotebook);
    setStatus("Choose something to capture");
  }

  return (
    <>
      <PlaygroundControls sectionId="node-edge-graphs" title="Node-edge graphs" onReset={() => { reset(); playback.setLoop(false); onSpeedChange(120); }}>
        <div className="grid grid-cols-2 gap-4">
          <Check label="Loop playback" checked={playback.loop} onChange={playback.setLoop} />
          <Range label="Pulse speed" value={speed} min={60} max={300} step={20} unit="px/s" onChange={onSpeedChange} />
        </div>
      </PlaygroundControls>
      <div tabIndex={0} role="region" aria-label="Notebook diagram; scroll horizontally to explore" className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <div className="mx-auto grid w-[920px] grid-cols-[240px_260px_240px] items-center gap-x-[70px] px-5 py-12">
          <div className="flex flex-col gap-4">
            <p className="mb-2 text-ui font-medium text-muted-foreground">Capture</p>
            {sourceOrder.map(id => {
              const source = sources[id];
              const Icon = sourceIcons[id];
              return (
                <Node variant="plain" key={id} nodeId={id} aria-label={source.title} className="rounded-card">
                  <Card variant="default">
                    <CardHeader>
                      <CardTitle as="h3" variant="heading">{source.title}</CardTitle>
                      <CardDescription>{source.description}</CardDescription>
                      <CardAction>
                        <Button loading={false} nativeButton={true} type="button" shape="square" variant="outline" tone="neutral" size="sm" iconOnly className="size-11" aria-label={`Capture from ${source.title}`} onClick={() => capture(id)}>
                          <Icon size={16} aria-hidden="true" />
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="px-6 pb-4 text-small">
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-muted-foreground">
                        <span>Input / {sourceMeta[id].format}</span>
                        <Badge shape="square" variant="outline" size="sm">{sourceMeta[id].result}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Node>
              );
            })}
          </div>

          <div>
            <p className="mb-6 text-ui font-medium text-muted-foreground">Organize</p>
            <Node variant="plain" nodeId="notebook" id="diagram-notebook" aria-label="Notebook" className="rounded-card">
              <Card variant="default">
                <CardHeader>
                  <CardTitle as="h3" variant="heading">Notebook</CardTitle>
                  <CardDescription>A home for what you learn</CardDescription>
                  <CardAction><Badge className="min-w-16 justify-center tabular-nums" shape="square" variant="outline" size="sm">Rev {String(notebook.revision).padStart(2, "0")}</Badge></CardAction>
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
                    <Badge className="min-w-20 justify-center" shape="square" variant={synchronized ? "soft" : "outline"} size="sm">{synchronized ? "Current" : "Updating"}</Badge>
                  </div>
                </CardFooter>
              </Card>
            </Node>
          </div>

          <div className="flex flex-col gap-4">
            <p className="mb-2 text-ui font-medium text-muted-foreground">Connect</p>
            <Node variant="plain" nodeId="search" aria-label="Search index" className="rounded-card">
              <OutputCard
                title="Search index"
                description="Makes captured material retrievable"
                detail={`${capturedItems} ${capturedItems === 1 ? "item" : "items"} available`}
                revision={notebook.indexedRevision}
                icon={MagnifyingGlassIcon}
              />
            </Node>
            <Node variant="plain" nodeId="summary" aria-label="Summary" className="rounded-card">
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

      <div className="relative z-[4] grid gap-3 border-t border-border bg-background px-6 py-5">
        <div className="flex items-center gap-3">
          <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" variant="outline" tone="neutral" size="sm" className="min-h-11 min-w-28" onClick={playback.running ? stop : play}>
            {playback.running ? <StopIcon size={16} aria-hidden="true" /> : <PlayIcon size={16} aria-hidden="true" />}
            <ButtonLabel>{playback.running ? "Stop flow" : "Play flow"}</ButtonLabel>
          </Button>
          <Button loading={false} nativeButton={true} type="button" shape="square" variant="ghost" tone="neutral" size="sm" iconOnly className="size-11" aria-label="Reset diagram" onClick={reset}>
            <ArrowCounterClockwiseIcon size={16} aria-hidden="true" />
          </Button>

        </div>
        <p role="status" className="min-h-10 text-small text-muted-foreground">
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
    <Card variant="default">
      <CardHeader>
        <CardTitle as="h3" variant="heading">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction><Icon size={16} aria-hidden="true" /></CardAction>
      </CardHeader>
      <CardContent className="px-6 pb-4 text-small">
        <div className="min-h-14 border-t border-border pt-3 text-muted-foreground tabular-nums">{detail}</div>
      </CardContent>
      <CardFooter className="px-6 pb-4 text-small">
        <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-3 text-muted-foreground">
          <span>Index revision</span>
          <Badge className="min-w-8 justify-center tabular-nums" shape="square" variant="outline" size="sm">{String(revision).padStart(2, "0")}</Badge>
        </div>
      </CardFooter>
    </Card>
  );
}

function ConnectionExample({ interactive = false }: { interactive?: boolean }) {
  const graph = useGraph();
  const playback = useGraphPlayback();
  const [status, setStatus] = useState("Send a pulse in either direction.");
  function send(reverse: boolean) {
    setStatus(reverse ? "Sending to source…" : "Sending to destination…");
    playback.run(graph.pulse("connection", reverse).pipe(Effect.tap(() => Effect.sync(() => setStatus(reverse ? "Arrived at source." : "Arrived at destination.")))));
  }
  return <>
    <div className="flex items-center justify-between gap-12 py-8">
      <Node nodeId="source" variant="surface" aria-label="Source node" className="p-4 text-ui">Source</Node>
      <Node nodeId="destination" variant="plain" aria-label="Destination node"><div className="rounded-md border border-border bg-background p-4 text-ui">Destination</div></Node>
    </div>
    <Edge edgeId="connection" from="source" to="destination" />
    {interactive && <div className="relative z-[4] grid gap-3 bg-background pt-4">
      <div className="flex flex-wrap gap-2">{([false, true] as const).map(reverse => <Button key={String(reverse)} nativeButton type="button" variant="outline" tone="neutral" size="sm" shape="square" iconOnly={false} loading={false} className="min-h-11" onClick={() => send(reverse)}><ButtonLabel>{reverse ? "Send backward" : "Send forward"}</ButtonLabel></Button>)}</div>
      <p role="status" className="min-h-10 text-small text-muted-foreground">{playback.error ? "Delivery failed. Try again." : status}</p>
    </div>}
  </>;
}

export function NodeEdgeDemo() {
  return <Section id="node-edge-graphs" className="border-t border-border py-12">
    <Text as="h2" variant="title">Node-edge graphs</Text>
    <Text as="p" variant="description" className="mt-3">Connect related objects and show how an update travels between them.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Nodes & connections" description="Surface nodes provide a quiet container. Plain nodes let their content own the surface." code={`<Graph pulseSpeed={120}>
  <Node nodeId="source" variant="surface">Source</Node>
  <Node nodeId="destination" variant="plain">Destination</Node>
  <Edge edgeId="connection" from="source" to="destination" />
</Graph>`}><Graph pulseSpeed={120}><ConnectionExample /></Graph></CatalogExample>
      <CatalogExample title="Pulse feedback" description="Send an update forward or backward. Reduced motion preserves arrival feedback without the traveling pulse." code={`const graph = useGraph();
const playback = useGraphPlayback();
playback.run(graph.pulse("connection"));
// Reverse the same connection.
playback.run(graph.pulse("connection", true));`}><Graph pulseSpeed={120}><ConnectionExample interactive /></Graph></CatalogExample>
      <div>
        <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
        <p className="mt-2 text-ui text-muted-foreground">Capture from a source or play the full sequence. Use Controls to adjust pulse speed and looping.</p>
        <p className="mt-2 text-small text-muted-foreground">Scroll horizontally when the graph is wider than the preview.</p>
        <div className="mt-4"><NotebookExample /></div>
      </div>
    </div>
    <p className="mt-4 text-small text-muted-foreground">Demo-owned graph utilities with simulated data. Pulse illumination inspired by <a className="underline underline-offset-4" href="https://x.com/kitlangton/status/2096703869136867563" target="_blank" rel="noreferrer">Kit Langton’s diagrams</a>.</p>
  </Section>;
}

export function NotebookExample() {
  const [speed, setSpeed] = useState(120);
  return <div className="overflow-hidden rounded-card border border-border bg-background text-foreground">
    <Graph pulseSpeed={speed}><NotebookDiagram speed={speed} onSpeedChange={setSpeed} /></Graph>
  </div>;
}
