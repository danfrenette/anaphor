"use client";

import type {} from "react/canary";
import { ViewTransition, useState, useRef, useLayoutEffect, useImperativeHandle, type RefObject } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Moon, Sun, Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button, ButtonLabel, Card, CardPreview, CardHeader, CardTitle, CardDescription, CardAction } from "@anaphor/system";
import { RocailleArtwork } from "./rocaille-artwork";
import { useStudy } from "./study-context";
import { usePalette, swatchColor } from "./palette-context";

const steps = [0, 1, 2, 3, 4, 5, 6];

function PaletteArtwork({ expanded, begin }: { expanded: boolean; begin: RefObject<(() => void) | null> }) {
  const svg = useRef<SVGSVGElement>(null);
  const sync = useRef<() => void>(() => {});
  const { color, selected, position, remember } = usePalette();
  const { reducedMotion } = useStudy();
  useImperativeHandle(begin, () => () => sync.current(), []);

  useLayoutEffect(() => {
    const surface = svg.current;
    if (!surface) return;
    const target = expanded ? 1 : 0;
    let from = position.current ?? target;
    let started = performance.now();
    let frame = 0;
    const groups = surface.querySelectorAll<SVGGElement>(".palette-swatch-position");
    function draw(now: number) {
      const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (now - started) / 520));
      const value = from + (target - from) * (1 - Math.pow(1 - progress, 3));
      remember(progress === 1 ? target : value);
      surface!.dataset.spread = String(progress === 1 ? target : value);
      groups.forEach((group, i) => {
        const fanX = 196 + i * 52;
        const fanY = 160 + Math.abs(i - 3) * 9;
        const x = fanX + (34 + i * 106 - fanX) * value;
        const y = fanY + (128 - fanY) * value;
        const angle = (i - 3) * 12 * (1 - value);
        group.setAttribute("transform", `translate(${x} ${y}) rotate(${angle} 48 150)`);
      });
      if (progress < 1 && from !== target) frame = requestAnimationFrame(draw);
    }
    sync.current = () => {
      from = position.current ?? target;
      started = performance.now();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    draw(performance.now());
    return () => { cancelAnimationFrame(frame); sync.current = () => {}; };
  }, [expanded, position, remember, reducedMotion]);

  return <svg ref={svg} className="palette-artwork" viewBox="0 0 800 450" aria-hidden="true">
    {steps.map(i => <g key={i} className="palette-swatch-position" transform={expanded ? `translate(${34 + i * 106} 128)` : `translate(${196 + i * 52} ${160 + Math.abs(i - 3) * 9}) rotate(${(i - 3) * 12} 48 150)`}>
      <g className="palette-swatch-lift" style={{ transform: i === selected ? "translateY(-20px)" : "translateY(0)" }}>
        <rect x="-3" y="-3" width="102" height="186" rx="15" fill="var(--anaphor-background)" />
        <rect width="96" height="180" rx="12" fill={swatchColor(color, i)} />
        {i === selected && <path d="M 40 158 L 46 164 L 57 151" fill="none" stroke={i < 3 ? "white" : "black"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </g>)}
  </svg>;
}

export function PaletteStudy({ expanded = false }: { expanded?: boolean }) {
  const { color, setColor, selected, setSelected, reset } = usePalette();
  const { dark, setDark, playing, setPlaying, reducedMotion } = useStudy();
  const beginShader = useRef<() => void>(() => {});
  const begin = useRef<(() => void) | null>(null);
  const [longWay, setLongWay] = useState(false);
  const artwork = <div className="palette-composite">
    <div className="palette-shader" aria-hidden="true"><RocailleArtwork expanded={expanded} beginMorph={beginShader} background /></div>
    <PaletteArtwork expanded={expanded} begin={begin} />
  </div>;
  const visual = <ViewTransition name="anaphor-palette" share="palette-unfold" default="none" onShare={() => { begin.current?.(); beginShader.current?.(); }}>
    {expanded ? <div className="palette-hero">{artwork}</div> : <CardPreview>{artwork}</CardPreview>}
  </ViewTransition>;
  const playback = <div className="palette-background-controls">
    <Button variant="ghost" tone="neutral" size="sm" disabled={reducedMotion} aria-pressed={playing && !reducedMotion} onClick={() => setPlaying(!playing)}>
      {playing && !reducedMotion ? <Pause /> : <Play />}<ButtonLabel>{playing && !reducedMotion ? "Pause background" : "Play background"}</ButtonLabel>
    </Button>
    <span>Rocaille 2 by <a className="study-credit underline underline-offset-3" href="https://x.com/XorDev/status/2015813875833225715">Xor / @XorDev</a></span>
  </div>;
  const selection = <div className="palette-selection mt-6 flex flex-wrap gap-2" role="group" aria-label="Select a swatch">
    {steps.map(i => <button key={i} type="button" className="palette-select inline-flex items-center justify-center gap-2 min-w-11 min-h-11 p-2 rounded-control border border-transparent text-ui cursor-pointer" aria-label={`Swatch ${i + 1}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><span style={{ background: swatchColor(color, i) }} /><span>{i + 1}</span></button>)}
  </div>;
  const content = expanded ? <>
    {visual}
    {playback}
    <div className="palette-essay">
      <section aria-labelledby="palette-start">
        <h2 id="palette-start">Start with a color.</h2>
        <p>This one starts with orange. Move the hue until something catches your eye.</p>
        <div className="essay-color-row flex gap-3 mt-8 mx-0 mb-6" aria-hidden="true">{steps.map(i => <span key={i} style={{ background: swatchColor(color, i) }} />)}</div>
        <div className="palette-controls">
          <label><span>Hue <output>{color.hue.toFixed(1)}°</output></span><input aria-label="Hue" type="range" min="0" max="360" step="0.1" value={color.hue} onChange={e => setColor({ ...color, hue: Number(e.target.value) })} /></label>
        </div>
        {selection}
        <div className="palette-readout"><span>Selected color</span><output aria-live="polite">{swatchColor(color, selected)}</output></div>
      </section>
      <section aria-labelledby="palette-light">
        <h2 id="palette-light">Give it a different mood.</h2>
        <p>A lighter shade, a quieter color. Keep the hue and see how far the other two values take it.</p>
        <div className="essay-color-strips" aria-hidden="true">{steps.map(i => <span key={i} style={{ background: swatchColor(color, i) }} />)}</div>
        <div className="palette-controls">
          <label><span>Lightness <output>{(color.lightness * 100).toFixed(1)}%</output></span><input aria-label="Lightness" type="range" min="0.35" max="0.7" step="0.001" value={color.lightness} onChange={e => setColor({ ...color, lightness: Number(e.target.value) })} /></label>
          <label><span>Chroma <output>{color.chroma.toFixed(3)}</output></span><input aria-label="Chroma" type="range" min="0" max="0.22" step="0.001" value={color.chroma} onChange={e => setColor({ ...color, chroma: Number(e.target.value) })} /></label>
        </div>
      </section>
      <section aria-labelledby="palette-between">
        <h2 id="palette-between">Enjoy the in-between.</h2>
        <p>Two colors can take more than one route around the hue wheel. Try the other way.</p>
        <div className="essay-gradient" role="img" aria-label={`Gradient following the ${longWay ? "longer" : "shorter"} hue path`} style={{ background: `linear-gradient(90deg in oklch ${longWay ? "longer" : "shorter"} hue, ${swatchColor(color, 3)}, oklch(${color.lightness} ${color.chroma} ${(color.hue + 110) % 360}))` }} />
        <div className="essay-route flex gap-2" role="group" aria-label="Hue path">
          <Button variant={longWay ? "ghost" : "outline"} tone="neutral" size="sm" aria-pressed={!longWay} onClick={() => setLongWay(false)}>Short way</Button>
          <Button variant={longWay ? "outline" : "ghost"} tone="neutral" size="sm" aria-pressed={longWay} onClick={() => setLongWay(true)}>Long way</Button>
        </div>
      </section>
      <footer className="essay-footer mt-16 pt-6 border-t border-border">
        <Button variant="ghost" tone="neutral" size="sm" onClick={() => { reset(); setLongWay(false); }}><ArrowCounterClockwise /><ButtonLabel>Reset palette</ButtonLabel></Button>
        <p>A small experiment starting from Anaphor’s orange. Colors outside your display’s gamut are mapped by your browser.</p>
        <p>Inspired by <a className="study-credit underline underline-offset-3" href="https://oklch.fyi/">oklch.fyi</a>.</p>
      </footer>
    </div>
  </> : <>
    <Card variant="showcase" className="palette-card">
      {visual}
      <CardHeader>
        <CardTitle as="h2"><Link href="/studies/palette" className="study-title-link">A palette, unfolded <ArrowUpRight size={16} aria-hidden="true" /></Link></CardTitle>
        <CardDescription>A few colors to play with.</CardDescription>
        <CardAction><Link href="/studies/palette" className="study-open">Explore palette <ArrowUpRight size={16} aria-hidden="true" /></Link></CardAction>
      </CardHeader>
    </Card>
    {playback}
    {selection}
    <p className="study-instructions max-w-[65ch] mt-4 text-ui leading-reading text-muted-foreground">Choose a swatch, then open the study.</p>
  </>;
  if (!expanded) return <section id="palette" className="palette-study mt-16" aria-label="Palette study">{content}</section>;
  return <main className="studies-page palette-article">
    <nav className="studies-nav flex items-center justify-between gap-6" aria-label="Studies navigation">
      <Link href="/studies#palette" className="study-back inline-flex min-h-11 items-center gap-2 text-ui hover:text-primary"><ArrowLeft size={16} aria-hidden="true" />All studies</Link>
      <Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label={dark ? "Use light theme" : "Use dark theme"} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button>
    </nav>
    <header className="studies-heading mt-12 mx-0 mb-8"><h1>A palette, unfolded</h1><p>A few colors, a little movement, and room to play.</p></header>
    {content}
  </main>;
}
