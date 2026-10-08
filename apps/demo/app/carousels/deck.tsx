"use client";
import { useRef } from "react";
import "./deck.css";
import { Pager, StoryCard, stories, useBrowse } from "./shared";

export function Deck() {
  const browse = useBrowse();
  const root = useRef<HTMLElement>(null);
  return <section ref={root} aria-label="Related reading, Deck carousel" aria-roledescription="carousel" tabIndex={0} onKeyDown={event => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) && !event.altKey && !event.metaKey && !event.ctrlKey) root.current?.focus({ preventScroll: true });
    browse.onKeyDown(event);
  }} className="focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4">
    <div className="relative mx-auto grid max-w-full touch-pan-y grid-cols-[minmax(0,1fr)] py-8" {...browse.swipe}>
      {stories.map((story, index) => {
        const offset = index - browse.index;
        const active = offset === 0;
        const visible = Math.abs(offset) <= 2;
        return <div key={story.title} data-instant={browse.instant || undefined} className="carousel-promoted-deck-card relative col-start-1 row-start-1 mx-auto w-[min(70%,23rem)]" style={{ transform: `translateX(${offset * 22}%) translateY(${Math.abs(offset) * 10}px) rotate(${offset * 2}deg) scale(${1 - Math.min(Math.abs(offset), 3) * .055})`, opacity: visible ? 1 : 0, zIndex: stories.length - Math.abs(offset), visibility: visible ? "visible" : "hidden" }}>
          <div inert={!active} aria-hidden={!active || undefined} className="h-full"><StoryCard index={index} /></div>
          {!active && visible && <button type="button" aria-label={`Show ${story.title}`} className="absolute inset-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4" onClick={event => {
            root.current?.focus({ preventScroll: true });
            browse.move(index, event.detail === 0);
          }} />}
        </div>;
      })}
    </div>
    <Pager index={browse.index} move={browse.move} />
  </section>;
}
