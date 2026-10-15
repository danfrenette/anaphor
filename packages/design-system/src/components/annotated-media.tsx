"use client";

import { ArrowsOutSimpleIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, XIcon } from "@phosphor-icons/react";
import { Dialog } from "@base-ui/react/dialog";
import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button, ButtonLabel } from "./button";
import { Text } from "./text";
import { cn } from "../lib/utils";

type ScreenshotCallout = { id: string; label: string; x: number; y: number };
type AnnotatedScreenshotProps = Omit<ComponentProps<"figure">, "children"> & {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  title: string;
  description: ReactNode;
  callouts: readonly ScreenshotCallout[];
  enlargeLabel: string;
  closeLabel: string;
  unavailableLabel: string;
  onMediaError?: () => void;
};
type VideoMoment = { id: string; label: string; seconds: number };
type VideoEvidenceProps = Omit<ComponentProps<"figure">, "children"> & {
  src: string | null;
  title: string;
  description: ReactNode;
  moments: readonly VideoMoment[];
  unavailableLabel: string;
  captions?: { src: string; srcLang: string; label: string };
  poster?: string;
  onMediaError?: () => void;
};
function ScreenshotImage({ src, alt, width, height, callouts, onError }: Pick<AnnotatedScreenshotProps, "alt" | "width" | "height" | "callouts"> & { src: string; onError: () => void }) {
  return <div className="relative min-w-0">
    <img src={src} alt={alt} width={width} height={height} onError={onError}
      className="block h-auto w-full outline outline-1 -outline-offset-1 outline-[var(--anaphor-image-outline)]" />
    {callouts.map((callout, index) => <span key={callout.id} aria-hidden="true"
      className="pointer-events-none absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-foreground font-sans text-small font-medium text-background shadow-card"
      style={{ left: `${callout.x * 100}%`, top: `${callout.y * 100}%` }}>{index + 1}</span>)}
  </div>;
}

function AnnotatedScreenshot({ src, alt, width, height, title, description, callouts, enlargeLabel, closeLabel, unavailableLabel, onMediaError, className, ...props }: AnnotatedScreenshotProps) {
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const unavailable = !src || src === failedSrc;
  const image = src && <ScreenshotImage src={src} alt={alt} width={width} height={height} callouts={callouts} onError={() => { setFailedSrc(src); onMediaError?.(); }} />;
  return <figure {...props} aria-labelledby={`${id}-title`} className={cn("min-w-0 space-y-3", className)}>
    <Dialog.Root onOpenChangeComplete={open => { if (!open) setZoomed(false); }}>
      <div className="relative">
        {unavailable ? <Text as="p" variant="ui" role="status">{unavailableLabel}</Text> : <>
          {image}
          <Dialog.Trigger aria-label={enlargeLabel} title={enlargeLabel} render={<Button nativeButton={true} type="button" size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={true} className="absolute right-2 top-2 bg-background" />}>
            <ArrowsOutSimpleIcon aria-hidden="true" />
          </Dialog.Trigger>
        </>}
      </div>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[var(--anaphor-z-backdrop)] bg-black/60" />
        <Dialog.Popup initialFocus={closeRef} className="fixed inset-4 z-[var(--anaphor-z-overlay)] m-auto flex h-[calc(100dvh-2rem)] max-w-6xl flex-col gap-3 overflow-hidden rounded-card bg-background p-4 text-foreground shadow-[var(--anaphor-shadow-upload)]">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <Dialog.Title render={<Text as="h2" variant="heading" className="min-w-0 break-words" />}>{title}</Dialog.Title>
            <div className="flex shrink-0 gap-2">
              <Button nativeButton={true} type="button" size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={true}
                aria-label={zoomed ? "Fit image to window" : "View image at actual size"} title={zoomed ? "Fit image to window" : "View image at actual size"} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>
                {zoomed ? <MagnifyingGlassMinusIcon aria-hidden="true" /> : <MagnifyingGlassPlusIcon aria-hidden="true" />}
              </Button>
              <Dialog.Close ref={closeRef} aria-label={closeLabel} title={closeLabel} render={<Button nativeButton={true} type="button" size="sm" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={true} />}>
                <XIcon aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>
          <div tabIndex={0} role="region" aria-label="Enlarged screenshot" className="min-h-0 flex-1 overflow-auto [container-type:size] focus-visible:outline-2 focus-visible:outline-ring">
            <div className={zoomed ? "min-h-full min-w-max" : "grid min-h-full min-w-full place-items-center"}>
              <div className="shrink-0" style={{ width: zoomed ? width : `min(100cqw, calc(100cqh * ${width / height}), ${width}px)` }}>
                {unavailable ? <Text as="p" variant="ui" role="status">{unavailableLabel}</Text> : image}
              </div>
            </div>
          </div>
          <div tabIndex={0} role="region" aria-label="Screenshot details" className="max-h-32 shrink-0 space-y-2 overflow-auto focus-visible:outline-2 focus-visible:outline-ring">
            <Dialog.Description render={<div className="max-w-reading text-ui" />}>{description}</Dialog.Description>
            <CalloutList callouts={callouts} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
    <figcaption className="space-y-2">
      <Text as="span" variant="ui" id={`${id}-title`} className="font-medium">{title}</Text>
      <div className="max-w-reading text-body text-reading">{description}</div>
      <CalloutList callouts={callouts} />
    </figcaption>
  </figure>;
}

function CalloutList({ callouts }: Pick<AnnotatedScreenshotProps, "callouts">) {
  return callouts.length > 0 && <ol className="list-decimal space-y-2 ps-6 text-ui text-foreground">
    {callouts.map((callout) => <li key={callout.id}>{callout.label}</li>)}
  </ol>;
}
function VideoEvidence({ src, title, description, moments, unavailableLabel, captions, poster, onMediaError, className, ...props }: VideoEvidenceProps) {
  const id = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const unavailable = !src || src === failedSrc;
  return <figure {...props} aria-labelledby={`${id}-title`} className={cn("min-w-0 space-y-3", className)}>
    {unavailable ? <Text as="p" variant="ui" role="status">{unavailableLabel}</Text> : <video
      key={src} ref={videoRef} src={src} poster={poster} controls preload="metadata" playsInline tabIndex={0}
      aria-label={title} aria-describedby={`${id}-description`}
      className="block w-full outline outline-1 -outline-offset-1 outline-[var(--anaphor-image-outline)]"
      onError={() => { setFailedSrc(src); onMediaError?.(); }}>
      {captions && <track kind="captions" src={captions.src} srcLang={captions.srcLang} label={captions.label} />}
    </video>}
    <figcaption className="space-y-2">
      <Text as="span" variant="ui" className="font-medium" id={`${id}-title`}>{title}</Text>
      <div id={`${id}-description`} className="max-w-reading text-body text-reading">{description}</div>
      {moments.length > 0 && <ol className="space-y-1">
        {moments.map((moment) => <li key={moment.id}>
          <Button nativeButton={true} type="button" size="sm" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false}
            className="h-auto min-w-0 justify-start text-start whitespace-normal" disabled={unavailable}
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.currentTime = moment.seconds;
              video.focus();
            }}>
            <ButtonLabel><span className="font-mono tabular-nums">{formatTimestamp(moment.seconds)}</span> — {moment.label}</ButtonLabel>
          </Button>
        </li>)}
      </ol>}
    </figcaption>
  </figure>;
}

function formatTimestamp(seconds: number) {
  const tenths = Math.round(seconds * 10);
  const whole = Math.floor(tenths / 10);
  const fraction = tenths % 10;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}${fraction ? `.${fraction}` : ""}`;
}
export { AnnotatedScreenshot, VideoEvidence, type AnnotatedScreenshotProps, type ScreenshotCallout, type VideoEvidenceProps, type VideoMoment };
