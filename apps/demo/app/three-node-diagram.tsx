"use client";

import * as Effect from "effect/Effect";
import { DownloadSimpleIcon, NotebookIcon, MagnifyingGlassIcon, PlayIcon, StopIcon } from "@phosphor-icons/react";
import { Button, ButtonLabel } from "@anaphor/system";
import { Graph, Node, Edge, useGraph } from "../components/diagrams/graph";
import { useDiagramPlayback } from "../components/diagrams/use-diagram-playback";

const nodes = [
  { id: "capture", label: "Capture", icon: DownloadSimpleIcon },
  { id: "organize", label: "Organize", icon: NotebookIcon },
  { id: "recall", label: "Recall", icon: MagnifyingGlassIcon },
] as const;

function DiagramContent() {
  const { pulse, clearGlows } = useGraph();
  const { run, stop, running, error } = useDiagramPlayback();

  function play() {
    clearGlows();
    run(Effect.gen(function* () {
      yield* pulse("capture-organize");
      yield* pulse("organize-recall");
    }));
  }

  return (
    <>
      <div className="grid grid-cols-3 items-center gap-6 px-4 py-6">
        {nodes.map(({ id, label, icon: Icon }) => (
          <Node key={id} nodeId={id} variant="surface" aria-label={label} className="flex flex-col items-center gap-2 px-2 py-4">
            <Icon size={20} aria-hidden="true" />
            <span className="text-small">{label}</span>
          </Node>
        ))}
      </div>
      <Edge edgeId="capture-organize" from="capture" to="organize" />
      <Edge edgeId="organize-recall" from="organize" to="recall" />
      <div className="relative z-[4] flex justify-center pb-4">
        <Button variant="ghost" tone="neutral" size="sm" aria-label={running ? "Stop three-node diagram" : "Play three-node diagram"} onClick={running ? () => { stop(); clearGlows(); } : play}>
          {running ? <StopIcon size={14} /> : <PlayIcon size={14} />}
          <ButtonLabel>{running ? "Stop" : "Play"}</ButtonLabel>
        </Button>
      </div>
      <p role="status" className="sr-only">{error ? "The diagram could not finish. Try again." : running ? "Following the three-node flow" : "Ready to play"}</p>
    </>
  );
}

export function ThreeNodeDiagram() {
  return (
    <div className="dark flex h-full w-full items-center bg-background text-foreground" role="group" aria-label="Capture connects to Organize, then Recall">
      <div className="w-full"><Graph><DiagramContent /></Graph></div>
    </div>
  );
}
