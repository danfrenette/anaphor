"use client";

import { ThreeNodeDiagram } from "./three-node-diagram";
import Link from "next/link";
import { useRef } from "react";
import { Play, Pause } from "@phosphor-icons/react";
import { Button, Card, CardPreview, CardHeader, CardTitle, CardDescription, CardAction } from "@anaphor/system";
import { RocailleArtwork } from "./studies/rocaille-artwork";
import { StudyProvider, useStudy } from "./studies/study-context";

function ShaderExample() {
  const begin = useRef<() => void>(() => {});
  const { playing, setPlaying, reducedMotion } = useStudy();
  return <Card variant="showcase" className="[--card-preview-ratio:16/9]">
    <CardPreview><RocailleArtwork expanded={false} beginMorph={begin} /></CardPreview>
    <CardHeader>
      <CardTitle as="h4">Rocaille 2</CardTitle>
      <CardDescription>Shader proof of concept by <a className="underline underline-offset-4" href="https://x.com/XorDev/status/2015813875833225715">Xor / @XorDev</a>.</CardDescription>
      <CardAction><Button variant="ghost" tone="neutral" size="sm" iconOnly disabled={reducedMotion} aria-label={playing && !reducedMotion ? "Pause Rocaille preview" : "Play Rocaille preview"} aria-pressed={playing && !reducedMotion} onClick={() => setPlaying(!playing)}>{playing && !reducedMotion ? <Pause /> : <Play />}</Button></CardAction>
    </CardHeader>
  </Card>;
}

export function CardMediaExamples() {
  return <section id="card-media" className="mt-12 scroll-mt-8" aria-labelledby="card-media-title">
    <h3 id="card-media-title" className="text-heading font-medium">Artwork as child content</h3>
    <p className="mt-3 prose-reading">The preview owns the frame and clipping. Its children own rendering, interaction, and playback.</p>
    <div className="mt-6 grid items-start gap-6 sm:grid-cols-2">
      <StudyProvider bare><ShaderExample /></StudyProvider>
      <Card variant="showcase" className="[--card-preview-ratio:16/9]">
        <CardPreview><ThreeNodeDiagram /></CardPreview>
        <CardHeader>
          <CardTitle as="h4">Node-edge diagram</CardTitle>
          <CardDescription>Three nodes connected by traveling pulses. <Link href="/studies/node-edge-graphs" className="underline underline-offset-4">Open the full study</Link>.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  </section>;
}
