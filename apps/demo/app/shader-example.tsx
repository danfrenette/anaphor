"use client";

import { useRef } from "react";
import { Play, Pause } from "@phosphor-icons/react";
import { Button, Card, CardPreview, CardHeader, CardTitle, CardDescription, CardAction } from "@anaphor/system";
import { RocailleArtwork } from "./studies/rocaille-artwork";
import { useStudy } from "./studies/study-context";

export function ShaderExample() {
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
