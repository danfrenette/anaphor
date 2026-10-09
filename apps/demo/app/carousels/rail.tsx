"use client";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { Pager, StoryCard, stories } from "./shared";

export function Rail() {
  const [viewport, api] = useEmblaCarousel({ align: "start", dragFree: true, loop: false, watchFocus: false }, [WheelGesturesPlugin({ forceWheelAxis: "x" })]);
  const [navigation, setNavigation] = useState({ index: 0, previous: false, next: true });
  useEffect(() => {
    if (!api) return;
    const sync = () => setNavigation({ index: api.selectedScrollSnap(), previous: api.canScrollPrev(), next: api.canScrollNext() });
    sync();
    api.on("select", sync).on("reInit", sync).on("settle", sync);
    const node = api.rootNode();
    const shiftWheel = (event: WheelEvent) => {
      if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      node.dispatchEvent(new WheelEvent("wheel", { deltaX: event.deltaY, deltaMode: event.deltaMode, clientX: event.clientX, clientY: event.clientY, bubbles: true, cancelable: true }));
    };
    node.addEventListener("wheel", shiftWheel, { passive: false });
    return () => { api.off("select", sync).off("reInit", sync).off("settle", sync); node.removeEventListener("wheel", shiftWheel); };
  }, [api]);
  const move = (next: number, keyboard = false) => api?.scrollTo(next, keyboard || matchMedia("(prefers-reduced-motion: reduce)").matches);

  return <section aria-label="Related reading, Rail carousel" aria-roledescription="carousel" tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4" onKeyDown={event => {
    if (!api || event.altKey || event.metaKey || event.ctrlKey) return;
    let next = api.selectedScrollSnap();
    if (event.key === "ArrowLeft") next--;
    else if (event.key === "ArrowRight") next++;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = api.scrollSnapList().length - 1;
    else return;
    event.preventDefault(); event.stopPropagation(); move(next, true);
  }}>
    <div ref={viewport} className="cursor-grab overflow-hidden p-2 pb-6 active:cursor-grabbing">
      <div className="flex touch-pan-y gap-6 select-none">
        {stories.map((story, index) => <div key={story.title} role="group" aria-roledescription="slide" aria-label={story.title} className="min-w-0 flex-[0_0_min(82%,21rem)]" onFocusCapture={() => move(index, true)}><StoryCard index={index} /></div>)}
      </div>
    </div>
    <Pager index={navigation.index} move={move} showCounter={false} canPrevious={navigation.previous} canNext={navigation.next} />
  </section>;
}
