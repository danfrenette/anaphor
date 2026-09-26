"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Text, useTheme } from "@anaphor/system";
import { Check, Range } from "../playground-fields";
import { requireToken, type Tokens } from "./tokens";
import { contrastRatio } from "./contrast";

const roles = [
  ["background", "Page canvas"], ["foreground", "Primary text"],
  ["reading", "Body text, composited at 90%"], ["muted", "Raised neutral surface"],
  ["muted-foreground", "Secondary text"], ["border", "Quiet dividers, not a focus indicator"],
  ["primary", "Action, selection, measurement"], ["primary-foreground", "Bright action label; approved exception"],
  ["danger", "Destructive fill"], ["danger-foreground", "Error text, not a label on danger fill"],
  ["ring", "Focus indicator"],
] as const;

type ColorRole = (typeof roles)[number][0];
type ContrastPair = readonly [label: string, foreground: ColorRole, background: ColorRole, threshold: number, exception?: boolean];
const pairs: readonly ContrastPair[] = [
  ["Text / page", "foreground", "background", 4.5],
  ["Reading / page", "reading", "background", 4.5],
  ["Reading / surface", "reading", "muted", 4.5],
  ["Muted text / page", "muted-foreground", "background", 4.5],
  ["Muted text / surface", "muted-foreground", "muted", 4.5],
  ["Error / page", "danger-foreground", "background", 4.5],
  ["Error / surface", "danger-foreground", "muted", 4.5],
  ["Focus / page", "ring", "background", 3],
  ["Focus / surface", "ring", "muted", 3],
  ["Action label / orange", "primary-foreground", "primary", 4.5, true],
] as const satisfies readonly ContrastPair[];

type Theme = "light" | "dark";
const buttonClass = "min-h-11 rounded-md border border-border px-3 text-ui";

function ThemeSpecimen({ theme, values, tokens }: { theme: Theme; values: Tokens; tokens: Tokens }) {
  const root = useRef<HTMLDivElement>(null);
  const [ratios, setRatios] = useState<number[]>([]);
  const color = (role: ColorRole) => requireToken(tokens, `--color-${role}`);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context || !root.current) return;
      const pixel = (): [number, number, number, number] => {
        const data = context.getImageData(0, 0, 1, 1).data;
        return [data[0]!, data[1]!, data[2]!, data[3]! / 255];
      };
      setRatios([...root.current.querySelectorAll<HTMLElement>("[data-contrast-pair]")].map(element => {
        const style = getComputedStyle(element);
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, 1, 1);
        const background = pixel();
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = style.color;
        context.fillRect(0, 0, 1, 1);
        const foreground = pixel();
        return contrastRatio([foreground[0], foreground[1], foreground[2]], [background[0], background[1], background[2]], foreground[3]);
      }));
    });
    return () => cancelAnimationFrame(frame);
  }, [theme, values, tokens]);

  const themeStyle: CSSProperties = { ...values, colorScheme: theme, background: color("background"), color: color("foreground") };
  return <div ref={root} data-testid={`foundation-${theme}`} style={themeStyle} className="min-w-0 rounded-card border border-border p-5">
    <Text as="h3" variant="label">{theme} theme</Text>
    <dl className="mt-5 divide-y divide-[var(--anaphor-input-border)]">
      {roles.map(([role, purpose]) => <div key={role} className="relative min-w-0 py-3 ps-10">
        <dt className="text-ui font-medium"><span aria-hidden="true" className="absolute start-0 top-4 size-7 rounded-sm border border-[var(--anaphor-input-border)]" style={{ background: color(role) }} />{role}</dt><dd className="mt-1 text-small">{purpose}</dd>
          <dd className="mt-2 break-words font-mono text-small">{color(role)}</dd>
          <dd className="mt-1 break-words font-mono text-small">{color(role)?.replace(/var\((--[\w-]+)\)/g, (_, name: string) => values[name] ?? `var(${name})`)}</dd>
      </div>)}
    </dl>
    <details className="mt-5 border-t border-[var(--anaphor-input-border)] pt-4" open>
      <summary className="min-h-11 cursor-pointer text-ui font-medium">Contrast pairings</summary>
      <p className="mb-3 text-small">Measured in browser, sRGB with alpha compositing. Text AA: 4.5:1; non-text focus: 3:1. Rounded display only; pass checks use the full ratio.</p>
      <ul className="space-y-3">
        {pairs.map(([label, foreground, background, threshold, exception], index) => <li key={label} className="flex flex-wrap items-center justify-between gap-2 text-small">
          <span>{label}</span>
          <span aria-hidden="true" data-contrast-pair style={{ color: color(foreground), background: color(background) }} className="sr-only">Sample</span>
          <span className="font-mono tabular-nums" data-testid="contrast-result">{ratios[index] === undefined ? "Measuring…" : `${ratios[index].toFixed(2)}:1 · ${ratios[index] >= threshold ? "Pass" : exception ? "Exception" : "Below target"}`}</span>
        </li>)}
      </ul>
      <p className="mt-4 text-small">Orange action labels retain the approved bright-label exception. This is not an AA pass. Disabled controls are exempt, and are not used as readable-content pairings.</p>
    </details>
    <details className="mt-4 border-t border-[var(--anaphor-input-border)] pt-4"><summary className="min-h-11 cursor-pointer text-ui font-medium">Theme elevation</summary>
      <div className="my-4 grid grid-cols-2 gap-4">{["card", "menu"].map(name => <div key={name} className="rounded-card p-4 text-small" style={{ background: color("muted"), boxShadow: tokens[`--anaphor-shadow-${name}`] }}>{name}</div>)}</div>
      <TokenList tokens={values} names={Object.keys(values).filter(name => name.startsWith("--anaphor-shadow-") && name.endsWith("-color"))} />
    </details>
  </div>;
}

function TokenList({ names, tokens }: { names: string[]; tokens: Tokens }) {
  return <dl className="mt-5 divide-y divide-border">{names.map(name => <div key={name} className="grid min-w-0 gap-1 py-3 sm:grid-cols-2 sm:gap-6">
    <dt className="break-words font-mono text-small">{name}</dt><dd className="break-words font-mono text-small">{requireToken(tokens, name)}</dd>
  </div>)}</dl>;
}

export function FoundationReference({ tokens, themes, springs }: { tokens: Tokens; themes: Record<Theme, Tokens>; springs: Record<string, unknown> }) {
  const { resolvedTheme } = useTheme();
  const [compare, setCompare] = useState(false);
  const [radius, setRadius] = useState(12);
  const [space, setSpace] = useState(24);
  const [duration, setDuration] = useState(200);
  const [moved, setMoved] = useState(false);
  const theme: Theme = resolvedTheme === "dark" ? "dark" : "light";
  const displayedThemes: Theme[] = compare ? ["light", "dark"] : [theme];
  const names = Object.keys(tokens);
  return <div className="mt-12 space-y-12">
    <section aria-labelledby="color-reference">
      <div className="flex flex-wrap items-center justify-between gap-4"><Text as="h2" variant="section" id="color-reference">Color roles</Text><Check label="Compare themes" checked={compare} onChange={setCompare} /></div>
      <Text as="p" variant="description" className="mt-4">Public Tailwind roles come first; backing variables remain visible. The private foreground variable is a surface, while the public foreground role means text. Comparison is local and never changes the global theme.</Text>
      <div className={`mt-6 grid gap-6 ${compare ? "xl:grid-cols-2" : ""}`}>
        {displayedThemes.map(value => <ThemeSpecimen key={value} theme={value} values={themes[value]} tokens={tokens} />)}
      </div>
      <details className="mt-5"><summary className="min-h-11 cursor-pointer text-ui">Component-only color roles</summary><TokenList tokens={themes[theme]} names={["--anaphor-checkbox-mark", "--anaphor-input-disabled"]} /></details>
    </section>
    <section aria-labelledby="type-reference"><Text as="h2" variant="section" id="type-reference">Type and reading</Text>
      <p className="mt-4 text-body">Three families, purpose-based sizes, a 65ch reading measure. <Link className="underline" href="/typography">See typography in use</Link>, including uppercase section titles and article rhythm.</p>
      <TokenList tokens={tokens} names={names.filter(name => /^--(font-|text-|leading-|tracking-|container-reading|spacing-prose)/.test(name))} />
      <p className="mt-4 text-ui">Prose h3 also uses Tailwind’s text-xl (1.25rem). Weight utilities remain Tailwind defaults: normal 400, medium 500, bold 700, black 900.</p>
    </section>
    <section aria-labelledby="geometry-reference"><Text as="h2" variant="section" id="geometry-reference">Space, geometry, elevation</Text>
      <p className="mt-4 text-body">Numeric spacing follows Tailwind’s 4px base. The documented rhythm is 4, 8, 12, 16, 24, 32, 48, 64 and 96px. Page gutters are 24px, 48px from 40rem, and 80px from 64rem.</p>
      <div className="mt-6 flex flex-wrap gap-6">{["sm", "md", "control", "card"].map(name => <div key={name} className="grid gap-2 text-small"><div aria-hidden="true" className="size-16 border border-border bg-muted" style={{ borderRadius: `var(--radius-${name})` }} /><span>{name} · {tokens[`--radius-${name}`]}</span></div>)}</div>
      <p className="mt-6 text-ui">Borders use a 1px rule; focus uses a 2px outline with a 2px offset. These are component rules, not a new global border scale. Structural surfaces stay flat.</p>
      <TokenList tokens={tokens} names={names.filter(name => /^--(radius-|spacing$|anaphor-(shadow-|filter-shadow-|sidebar-.*width|z-))/.test(name))} />
      <p className="mt-4 text-small">Shadow formulas resolve theme-aware colors locally. The dark theme uses a light keyline and stronger neutral shadows; card and clipped-card share the same primitives.</p>
    </section>
    <section aria-labelledby="motion-reference"><Text as="h2" variant="section" id="motion-reference">Motion</Text>
      <TokenList tokens={tokens} names={names.filter(name => /^--anaphor-.*(duration|ease|delay)/.test(name))} />
      <p className="mt-4 text-body">Repeated keyboard feedback is immediate. Springs remain interaction recipes, not CSS duration aliases. Menu and sidebar highlights use the fast/moderate presets in lib/motion.ts.</p>
      <TokenList tokens={Object.fromEntries(Object.entries(springs).map(([name, value]) => [`spring.${name}`, JSON.stringify(value)]))} names={Object.keys(springs).map(name => `spring.${name}`)} />
      <p className="mt-4 text-ui">Documented local exceptions: theme reveal uses 350ms and its own easing to cross the viewport; MorphSurface retains its reference-derived geometry timings; Slider retains DialKit springs, colors, 13px text and 8px corners. None is a new shared scale.</p>
    </section>
    <section aria-labelledby="experiment-title"><Text as="h2" variant="section" id="experiment-title">A bounded experiment</Text>
      <p className="mt-4 text-body">Try spacing, corners and motion on this sample only. Reset restores the shipped card radius, 24px spacing and standard 200ms duration. Reduced motion removes travel.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="grid content-start gap-4"><Range label="Sample radius" value={radius} min={0} max={24} step={2} unit="px" onChange={setRadius} /><Range label="Sample spacing" value={space} min={8} max={48} step={4} unit="px" onChange={setSpace} /><Range label="Sample duration" value={duration} min={0} max={300} step={25} unit="ms" onChange={setDuration} />
          <button className={buttonClass} type="button" onClick={() => { setRadius(12); setSpace(24); setDuration(200); setMoved(false); }}>Reset experiment</button>
        </div>
        <div data-testid="foundation-experiment" className="min-w-0 bg-muted shadow-card" style={{ borderRadius: radius, padding: space }}>
          <Text as="h3" variant="subheading">Local decisions</Text><p className="mt-3 text-ui">The reference values above remain unchanged.</p>
          <div className="my-6 h-6"><div data-testid="motion-sample" className="size-6 rounded-sm bg-foreground transition-transform motion-reduce:transform-none! motion-reduce:transition-none! motion-reduce:duration-0!" style={{ transform: moved ? "translateX(48px)" : "translateX(0)", transitionDuration: `${duration}ms`, transitionTimingFunction: "var(--anaphor-ease-out)" }} /></div>
          <button className={buttonClass} type="button" onClick={() => setMoved(value => !value)}>Replay motion</button>
        </div>
      </div>
    </section>
  </div>;
}
