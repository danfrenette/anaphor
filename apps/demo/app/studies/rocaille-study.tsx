"use client";

import type {} from "react/canary";
import { ViewTransition, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Moon, Sun, Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button, ButtonLabel, Card, CardPreview, CardHeader, CardTitle, CardDescription, CardAction } from "@anaphor/system";
import { RocailleArtwork } from "./rocaille-artwork";
import { NodeEdgeStudyLink } from "./node-edge-study-link";
import { PaletteStudy } from "./palette-study";
import { useStudy } from "./study-context";

// A demo composition, deliberately local until another project establishes a reusable need.
export function RocailleStudy({ expanded = false }: { expanded?: boolean }) {
  const { dark, setDark, playing, setPlaying, zoom, setZoom, reset, reducedMotion } = useStudy();

  const beginMorph = useRef<() => void>(() => {});

  return <main className={expanded ? "studies-page studies-expanded" : "studies-page"}>
    <nav className="studies-nav flex items-center justify-between gap-6" aria-label="Studies navigation">
      <Link href={expanded ? "/studies" : "/"} className="study-back inline-flex min-h-11 items-center gap-2 text-ui hover:text-primary">
        <ArrowLeft aria-hidden="true" size={16} />
        {expanded ? "All studies" : "Anaphor"}
      </Link>
      <Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label={dark ? "Use light theme" : "Use dark theme"} onClick={() => setDark(!dark)}>
        {dark ? <Sun /> : <Moon />}
      </Button>
    </nav>

    <header className="studies-heading mt-12 mx-0 mb-8">
      <h1>{expanded ? "Rocaille 2" : "Studies"}</h1>
      <p>{expanded ? "Layered waves, folded into color." : "Experiments in form, interaction, and continuity."}</p>
    </header>

    <Card variant="showcase" className="rocaille-card">
      <ViewTransition name="anaphor-rocaille" share="rocaille-expand" default="none" onShare={() => beginMorph.current?.()}>
        <CardPreview><RocailleArtwork expanded={expanded} beginMorph={beginMorph} /></CardPreview>
      </ViewTransition>
      <CardHeader>
        <CardTitle as="h2">{expanded ? "Rocaille 2" : <Link href="/studies/rocaille-2" className="study-title-link">Rocaille 2 <ArrowUpRight size={16} aria-hidden="true" /></Link>}</CardTitle>
        <CardDescription>Shader by <a href="https://x.com/XorDev/status/2015813875833225715" className="study-credit underline underline-offset-3">Xor / @XorDev</a></CardDescription>
        {!expanded && <CardAction><Link href="/studies/rocaille-2" className="study-open">Open study <ArrowUpRight size={16} aria-hidden="true" /></Link></CardAction>}
      </CardHeader>
    </Card>

    <div className="study-controls flex items-center justify-between gap-6 mt-8 pt-6 border-t border-border" aria-label="Rocaille controls">
      <div className="study-buttons flex items-center gap-2">
        <Button variant="outline" tone="neutral" size="sm" disabled={reducedMotion} aria-pressed={playing && !reducedMotion} onClick={() => setPlaying(!playing)}>
          {playing && !reducedMotion ? <Pause /> : <Play />}<ButtonLabel>{playing && !reducedMotion ? "Pause" : "Play"}</ButtonLabel>
        </Button>
        <Button variant="ghost" tone="neutral" size="sm" onClick={reset}><ArrowCounterClockwise /><ButtonLabel>Reset</ButtonLabel></Button>
      </div>
      <label className="study-zoom flex items-center gap-4 text-ui">
        <span>Zoom</span>
        <input type="range" min="0.5" max="2" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} />
      </label>
    </div>

    <p className="study-instructions max-w-[65ch] mt-4 text-ui leading-reading text-muted-foreground">{reducedMotion ? "Animation is paused to match your reduced-motion preference. Zoom still works." : "Pause to explore a frame. Adjust the zoom to move between detail and the wider composition."}</p>
    {expanded && <div className="study-notes grid gap-4 max-w-[65ch] mt-12 pt-6 border-t border-border text-body">
      <p>Ten layers of sine-wave distortion create the flowing structure. The original color palette stays intact as the artwork opens into a larger frame.</p>
      <p>Work in progress. The subject is a starting point; the behavior is the experiment.</p>
    </div>}
    {!expanded && <><PaletteStudy /><NodeEdgeStudyLink /></>}
  </main>;
}
