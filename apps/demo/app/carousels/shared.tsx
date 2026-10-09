"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter, Text } from "@anaphor/system";
export const stories = [
  { title: "Give movement a job", category: "Motion", excerpt: "A transition should explain where something went, what changed, or what happens next.", detail: "Try removing the movement first. If the change becomes harder to understand, motion is doing useful work. If it becomes clearer, let the interface stay still.", href: "/studies/field-notes#useful-motion" },
  { title: "Make room for attention", category: "Layout", excerpt: "The important thing gets easier to find when its neighbors become quieter.", detail: "A shared edge, a deliberate gap, and one change in emphasis can organize more effectively than another container. Look for what can recede before adding another visual signal.", href: "/studies/field-notes#attention" },
  { title: "The small decisions that make a system feel like itself", category: "Foundations", excerpt: "Typography, a shared rhythm, and a little restraint connect very different compositions.", detail: "These cards use the same type roles and raised surfaces as the manual. The carousel changes how you browse the material while keeping the material recognizable.", href: "/foundations" },
  { title: "Let the source shape the placeholder", category: "Components", excerpt: "Real typography and media proportions make a loading state less surprising.", detail: "Reserve the space content needs, retain the useful shell, and keep the loading message separate from each decorative shape. Content should not jump when it arrives.", href: "/#skeleton" },
  { title: "Leave a little room", category: "Field notes", excerpt: "A good default leaves you less to undo.", detail: "Not every surface needs a signature effect. The product gets its character from consistent, small decisions rather than competing moments of spectacle.", href: "/studies/field-notes#leave-room" },
];
export function Artwork({ index }: { index: number }) {
  return <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-t-card bg-background" aria-hidden="true">
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <path d="M40 60H360M40 240H360M80 30V270M320 30V270" stroke="var(--anaphor-input-border)" strokeWidth="1" />
      {index % 3 === 0 ? <><rect x="112" y="90" width="118" height="118" rx="10" fill="var(--anaphor-foreground)" stroke="var(--anaphor-input-border)" /><rect x="172" y="70" width="118" height="118" rx="10" fill="var(--anaphor-background)" stroke="var(--anaphor-font-secondary)" /><circle cx="231" cy="129" r="22" fill="var(--anaphor-brand)" /><path d="M210 190H280" stroke="var(--anaphor-brand)" strokeWidth="3" /></> : index % 3 === 1 ? <><circle cx="200" cy="150" r="82" stroke="var(--anaphor-font-secondary)" /><circle cx="200" cy="150" r="52" stroke="var(--anaphor-input-border)" /><circle cx="200" cy="150" r="23" fill="var(--anaphor-brand)" /><path d="M95 150H305M200 45V255" stroke="var(--anaphor-input-border)" /></> : <><path d="M95 210L180 70L265 210Z" stroke="var(--anaphor-font-secondary)" strokeWidth="2" /><rect x="195" y="110" width="100" height="100" fill="var(--anaphor-foreground)" stroke="var(--anaphor-input-border)" /><circle cx="245" cy="160" r="20" fill="var(--anaphor-brand)" /></>}
      <text x="40" y="285" fill="var(--anaphor-font-tertiary)" fontFamily="var(--font-mono)" fontSize="10">ANAPHOR / STUDY {String(index+1).padStart(2,"0")}</text>
    </svg>
  </div>;
}
export function StoryCard({ index, detailed = false }: { index: number; detailed?: boolean }) {
  const s=stories[index] ?? stories[0]!;
  return <Card variant="default" className="h-full"><Artwork index={index} /><CardHeader><Text as="p" variant="label">{s.category}</Text><CardTitle as="h3" variant="heading">{s.title}</CardTitle><CardDescription>{detailed ? s.detail : s.excerpt}</CardDescription></CardHeader><CardFooter><a className="inline-flex min-h-11 items-center gap-2 text-ui underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4" href={s.href}>Read the note <span aria-hidden="true">↗</span></a></CardFooter></Card>;
}
export function useBrowse() {
  const [index,setIndex]=useState(0);
  const [instant,setInstant]=useState(false);
  const start=useRef<{x:number;y:number;pointerId:number}|null>(null);
  const move=(next:number,keyboard=false)=>{setInstant(keyboard);setIndex(Math.max(0,Math.min(stories.length-1,next)));};
  const onKeyDown=(e:KeyboardEvent)=>{if(e.altKey||e.metaKey||e.ctrlKey)return;let next=index;if(e.key==="ArrowRight")next++;else if(e.key==="ArrowLeft")next--;else if(e.key==="Home")next=0;else if(e.key==="End")next=stories.length-1;else return;e.preventDefault();e.stopPropagation();move(next,true);};
  return {index,instant,move,onKeyDown,swipe:{
    onPointerDown:(e:React.PointerEvent)=>{if(e.pointerType!=="mouse"&&e.isPrimary&&!start.current)start.current={x:e.clientX,y:e.clientY,pointerId:e.pointerId};},
    onPointerUp:(e:React.PointerEvent)=>{if(start.current?.pointerId!==e.pointerId)return;const dx=e.clientX-start.current.x,dy=e.clientY-start.current.y;start.current=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5)move(index+(dx<0?1:-1));},
    onPointerCancel:(e:React.PointerEvent)=>{if(start.current?.pointerId===e.pointerId)start.current=null;},
  }};
}
export function Pager({index,move,showCounter=true,canPrevious=index>0,canNext=index<stories.length-1}:{index:number;move:(next:number,keyboard?:boolean)=>void;showCounter?:boolean;canPrevious?:boolean;canNext?:boolean}) {
  const props={nativeButton:true,type:"button",focusableWhenDisabled:true,iconOnly:true,loading:false,shape:"square",size:"md",variant:"outline",tone:"neutral"} as const;
  return <div className={`flex items-center gap-4 pt-6 ${showCounter ? "justify-between" : "justify-end"}`} >{showCounter && <Text as="span" variant="code" aria-live="polite" aria-atomic="true" className="tabular-nums">{String(index+1).padStart(2,"0")} / {String(stories.length).padStart(2,"0")}</Text>}<div className="flex gap-2"><Button {...props} className="min-h-11 min-w-11" disabled={!canPrevious} aria-label="Previous card" onClick={e=>move(index-1,e.detail===0)}><ArrowLeft aria-hidden="true" /></Button><Button {...props} className="min-h-11 min-w-11" disabled={!canNext} aria-label="Next card" onClick={e=>move(index+1,e.detail===0)}><ArrowRight aria-hidden="true" /></Button></div></div>;
}
