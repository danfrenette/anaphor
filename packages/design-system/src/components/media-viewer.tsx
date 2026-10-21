"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { Video, VideoPlayer } from "@videojs/react/video";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Button, ButtonLabel } from "./button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs";
import { Text } from "./text";
import { cn } from "../lib/utils";

type MediaViewerTrack = { src: string; srcLang: string; label: string; kind: "captions" | "subtitles"; default: boolean };
type MediaViewerPanel = "annotations" | "evidence";
type MediaViewerItemBase = {
  id: string;
  /** Change this identity when the captured bytes or track assets change. */
  sourceKey: string;
  title: string;
  caption?: ReactNode;
  annotations?: ReactNode;
  evidence?: ReactNode;
};
type MediaViewerImage = MediaViewerItemBase & {
  kind: "image"; src: string; alt: string; width: number; height: number;
  /** Normalized capture coordinates. Change key to reveal the same point again. */
  reveal?: { x: number; y: number; key: string | number };
};
type MediaViewerVideo = MediaViewerItemBase & {
  kind: "video"; src: string; poster?: string; tracks?: readonly MediaViewerTrack[];
};
type MediaViewerItem = MediaViewerImage | MediaViewerVideo;
type MediaViewerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: readonly MediaViewerItem[];
  activeItemId: string;
  onActiveItemChange: (id: string) => void;
  initialPanel: MediaViewerPanel | null;
  returnFocus?: RefObject<HTMLElement | null>;
  /** Additional controls in the central console; state belongs to the consumer. */
  renderConsole?: (item: MediaViewerItem) => ReactNode;
};
const control = { nativeButton: true, type: "button", size: "md", shape: "square", variant: "ghost", tone: "neutral", loading: false, iconOnly: false } as const;
type VideoPosition = { time: number; volume: number; muted: boolean; rate: number; captions: string[] };

/** A finite, controlled media collection. Source interpretation stays with the consumer. */
function MediaViewer({ open, onOpenChange, items, activeItemId, onActiveItemChange, initialPanel, returnFocus, renderConsole }: MediaViewerProps) {
  const positions = useRef(new Map<string, VideoPosition>());
  const getPosition = useCallback((key: string) => positions.current.get(key), []);
  const onPosition = useCallback((key: string, value: VideoPosition) => { positions.current.set(key, value); }, []);
  return <Dialog.Root open={open} onOpenChange={onOpenChange} disablePointerDismissal modal>
    <Dialog.Portal className="fixed inset-0 isolate z-[var(--anaphor-z-overlay)]">
      <Dialog.Backdrop className="fixed inset-0 bg-black/60" />
      <ViewerContent items={items} activeItemId={activeItemId} onActiveItemChange={onActiveItemChange} initialPanel={initialPanel} returnFocus={returnFocus} renderConsole={renderConsole} getPosition={getPosition} onPosition={onPosition} />
    </Dialog.Portal>
  </Dialog.Root>;
}

function ViewerContent({ items, activeItemId, onActiveItemChange, initialPanel, returnFocus, renderConsole, getPosition, onPosition }: Omit<MediaViewerProps, "open" | "onOpenChange"> & { getPosition: (key: string) => VideoPosition | undefined; onPosition: (key: string, value: VideoPosition) => void }) {
  const [panel, setPanel] = useState<MediaViewerPanel | null>(initialPanel);
  const [sizes, setSizes] = useState<Record<string, boolean>>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  const annotationTabRef = useRef<HTMLButtonElement>(null);
  const evidenceTabRef = useRef<HTMLButtonElement>(null);
  const index = items.findIndex(item => item.id === activeItemId);
  const active = items[index];
  const key = active ? JSON.stringify([active.id, active.sourceKey, active.src]) : "";
  const hasPanel = active && ((panel === "annotations" && active.annotations != null) || (panel === "evidence" && active.evidence != null));
  return <Dialog.Popup initialFocus={closeRef} finalFocus={returnFocus} data-slot="media-viewer"
    className={cn(
      // Modal bounds and layout
      "fixed inset-2 flex min-h-0 flex-col overflow-hidden sm:inset-4",
      "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
      // Surface and focus
      "rounded-card bg-background text-foreground shadow-card outline-none",
    )}
    onKeyDown={event => {
      if (event.defaultPrevented || event.target !== event.currentTarget || event.altKey || event.metaKey || event.ctrlKey) return;
      const target = event.key === "ArrowRight" ? items[index + 1] : event.key === "ArrowLeft" ? items[index - 1] : undefined;
      if (target) { event.preventDefault(); onActiveItemChange(target.id); }
    }}>
    <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-2">
      <Dialog.Title tabIndex={0} render={<Text as="h2" variant="subheading" />} className="max-h-[20dvh] min-w-0 flex-1 overflow-auto break-words focus-visible:outline-2 focus-visible:outline-ring">{active?.title ?? "Media unavailable"}</Dialog.Title>
      {active && items.length > 1 && <Text as="span" variant="caption" className="shrink-0 tabular-nums">{index + 1} / {items.length}</Text>}
      <Dialog.Close ref={closeRef} render={<Button {...control} iconOnly aria-label="Close media viewer" />}><X aria-hidden="true" /></Dialog.Close>
    </header>
    <Dialog.Description className="sr-only">Inspect media and its supporting details. Escape closes the viewer.</Dialog.Description>
    <Tabs value={panel} onValueChange={value => setPanel(value === "annotations" || value === "evidence" ? value : null)} className="flex min-h-0 flex-1 flex-col">
      <div className={cn(
        // Narrow windows use one scrolling document flow; content cannot overlap grid tracks.
        "flex min-h-0 flex-1 flex-col overflow-auto",
        // Wide windows give media and details independently bounded columns.
        "lg:grid lg:grid-rows-[minmax(0,1fr)]",
        hasPanel && "lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]",
      )}>
        <div className="flex min-w-0 shrink-0 flex-col lg:min-h-0 lg:overflow-auto">
          <div className={cn(
            "relative h-[max(12rem,40dvh)] shrink-0 overflow-hidden",
            "lg:h-auto lg:min-h-48 lg:flex-1",
          )} data-slot="media-viewer-stage">
            {!active && <Text as="p" variant="body" className="p-6">The selected media is unavailable.</Text>}
            {items.map(item => {
              const identity = JSON.stringify([item.id, item.sourceKey, item.src]);
              return <div key={identity} hidden={item.id !== activeItemId} className="h-full min-h-48" aria-hidden={item.id !== activeItemId || undefined}>
                {item.kind === "image" ? <ViewerImage item={item} actual={sizes[identity] === true} active={item.id === activeItemId} /> : <ViewerVideo item={item} active={item.id === activeItemId} getPosition={() => getPosition(identity)} onPosition={value => onPosition(identity, value)} />}
              </div>;
            })}
          </div>
          {active?.caption != null && <div className="shrink-0 border-t border-border p-4" data-slot="media-viewer-caption">{active.caption}</div>}
        </div>
        {hasPanel && <aside className={cn(
          "shrink-0 border-t border-border p-4",
          "lg:min-h-0 lg:overflow-auto lg:border-t-0 lg:border-l",
        )} aria-label="Supporting details">
          <div className="mb-3 flex justify-end"><Button {...control} onClick={() => { (panel === "annotations" ? annotationTabRef : evidenceTabRef).current?.focus(); setPanel(null); }}><ButtonLabel>Hide details</ButtonLabel></Button></div>
          {active.annotations != null && <TabsPanel value="annotations">{active.annotations}</TabsPanel>}
          {active.evidence != null && <TabsPanel value="evidence">{active.evidence}</TabsPanel>}
        </aside>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border p-2 sm:p-4">
        {items.length > 1 && <Button {...control} aria-label="Previous" disabled={index <= 0} onClick={() => { const previous = items[index - 1]; if (previous) onActiveItemChange(previous.id); }}><CaretLeft aria-hidden="true" /><ButtonLabel>Previous</ButtonLabel></Button>}
        <div className={cn(
          // Responsive console layout
          "order-first flex w-full flex-wrap items-center justify-center gap-1 p-1",
          "sm:order-none sm:mx-auto sm:w-auto",
          // Floating control surface
          "rounded-control bg-muted shadow-card",
        )} data-slot="media-viewer-console">
          {active?.kind === "image" && <div role="group" aria-label="Image size" className="flex"><Button {...control} aria-pressed={!sizes[key]} onClick={() => setSizes(previous => ({ ...previous, [key]: false }))}><ButtonLabel>Fit</ButtonLabel></Button><Button {...control} aria-pressed={sizes[key] === true} onClick={() => setSizes(previous => ({ ...previous, [key]: true }))}><ButtonLabel>Actual size</ButtonLabel></Button></div>}
          {active && (active.annotations != null || active.evidence != null) && <TabsList size="md" variant="default" aria-label="Media details">
            {active.annotations != null && <TabsTab ref={annotationTabRef} className="pointer-coarse:min-h-11" value="annotations">Annotations</TabsTab>}
            {active.evidence != null && <TabsTab ref={evidenceTabRef} className="pointer-coarse:min-h-11" value="evidence">Evidence</TabsTab>}
          </TabsList>}
          {active && renderConsole?.(active)}
        </div>
        {items.length > 1 && <Button {...control} aria-label="Next" disabled={index < 0 || index >= items.length - 1} onClick={() => { const next = items[index + 1]; if (next) onActiveItemChange(next.id); }}><ButtonLabel>Next</ButtonLabel><CaretRight aria-hidden="true" /></Button>}
      </footer>
    </Tabs>
  </Dialog.Popup>;
}

function ViewerImage({ item, actual, active }: { item: MediaViewerImage; actual: boolean; active: boolean }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const consumedReveal = useRef<string | number | undefined>(undefined);
  const valid = Number.isFinite(item.width) && Number.isFinite(item.height) && item.width > 0 && item.height > 0;
  const reveal = item.reveal;
  useLayoutEffect(() => {
    const viewport = scrollRef.current;
    const image = imageRef.current;
    if (!active || status !== "loaded" || !reveal || consumedReveal.current === reveal.key || !viewport || !image || !Number.isFinite(reveal.x) || !Number.isFinite(reveal.y) || reveal.x < 0 || reveal.x > 1 || reveal.y < 0 || reveal.y > 1) return;
    consumedReveal.current = reveal.key;
    const scale = Math.min(image.clientWidth / item.width, image.clientHeight / item.height);
    const width = item.width * scale;
    const height = item.height * scale;
    viewport.scrollLeft = image.offsetLeft + (image.clientWidth - width) / 2 + width * reveal.x - viewport.clientWidth / 2;
    viewport.scrollTop = image.offsetTop + (image.clientHeight - height) / 2 + height * reveal.y - viewport.clientHeight / 2;
  }, [active, reveal, status, item.width, item.height]);
  return <div ref={scrollRef} tabIndex={0} aria-label={`${item.title} image inspection`} className={cn(
    "relative h-full min-h-48 overflow-auto",
    "overscroll-contain outline-offset-[-3px]",
  )}>
    {!valid || status === "failed" ? <div className="grid h-full min-h-48 place-content-center gap-3 p-6 text-center"><Text as="p" variant="body">{!valid ? "Image dimensions unavailable." : "Image unavailable."}</Text>{valid && <Button {...control} onClick={() => { setStatus("loading"); setAttempt(value => value + 1); }}><ButtonLabel>Retry image</ButtonLabel></Button>}</div> : <>
      {status === "loading" && <Text as="p" variant="caption" role="status" className="absolute top-2 left-2">Loading image…</Text>}
      {/* Native image preserves captured pixels and does not impose a loader or optimization service. */}
      <img key={attempt} ref={imageRef} src={item.src} alt={item.alt} width={item.width} height={item.height} onLoad={() => setStatus("loaded")} onError={() => setStatus("failed")}
        className={actual ? "block max-w-none" : "block h-full max-h-full w-full object-contain"} style={actual ? { width: item.width, height: item.height } : undefined} />
    </>}
  </div>;
}

function readVideoPosition(video: HTMLVideoElement): VideoPosition {
  return {
    time: video.currentTime, rate: video.playbackRate, volume: video.volume, muted: video.muted,
    captions: Array.from(video.textTracks).filter(track => track.mode === "showing").map(track => `${track.language}:${track.label}`),
  };
}

function ViewerVideo({ item, active, getPosition, onPosition }: { item: MediaViewerVideo; active: boolean; getPosition: () => VideoPosition | undefined; onPosition: (value: VideoPosition) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [position] = useState(getPosition);
  const initial = useRef(position);
  useEffect(() => { if (!active) videoRef.current?.pause(); }, [active]);
  useEffect(() => { const video = videoRef.current; return () => { video?.pause(); }; }, []);
  function remember(video: HTMLVideoElement) {
    const value = readVideoPosition(video);
    initial.current = value;
    onPosition(value);
  }
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const changed = () => {
      const value = readVideoPosition(video);
      initial.current = value;
      onPosition(value);
    };
    video.textTracks.addEventListener("change", changed);
    return () => video.textTracks.removeEventListener("change", changed);
  }, [onPosition, failed, attempt]);
  return <div className="flex h-full min-h-48 flex-col justify-center">
    {failed ? <div className="grid place-content-center gap-3 p-6 text-center"><Text as="p" variant="body">Video unavailable.</Text><Button {...control} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}><ButtonLabel>Retry video</ButtonLabel></Button></div> : <VideoPlayer title={item.title}>
      <Video key={attempt} ref={videoRef} src={item.src} poster={item.poster} controls playsInline preload="metadata" aria-label={item.title} className="block h-full max-h-full w-full object-contain"
        onLoadedMetadata={event => { const video = event.currentTarget; const saved = initial.current; if (saved) { if (Number.isFinite(video.duration) && saved.time <= video.duration) video.currentTime = saved.time; video.volume = saved.volume; video.muted = saved.muted; video.playbackRate = saved.rate; for (const track of Array.from(video.textTracks)) track.mode = saved.captions.includes(`${track.language}:${track.label}`) ? "showing" : "disabled"; } }}
        onPlay={event => { if (!active) event.currentTarget.pause(); }} onTimeUpdate={event => remember(event.currentTarget)} onVolumeChange={event => remember(event.currentTarget)} onRateChange={event => remember(event.currentTarget)} onPause={event => remember(event.currentTarget)} onError={() => setFailed(true)}>
        {item.tracks?.map(track => <track key={track.src} {...track} onLoad={() => { const video = videoRef.current; const saved = initial.current; if (video && saved) for (const caption of Array.from(video.textTracks)) caption.mode = saved.captions.includes(`${caption.language}:${caption.label}`) ? "showing" : "disabled"; }} />)}
      </Video>
    </VideoPlayer>}
  </div>;
}

export { MediaViewer, type MediaViewerProps, type MediaViewerItem, type MediaViewerImage, type MediaViewerVideo, type MediaViewerTrack, type MediaViewerPanel };
