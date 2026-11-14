"use client";

import Image from "next/image";
import { Button, ButtonLabel, MediaViewer, Text, type MediaViewerItem } from "@anaphor/system";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { http } from "./browser-http";
import type { TourAsset, TourDocumentV2 } from "./document";

export type CheckEvidenceAsset = (url: string, signal: AbortSignal) => Promise<void>;
async function checkLocalAsset(url: string, signal: AbortSignal) { await http.head(url, { signal }); }
type MediaAnnotations = NonNullable<TourDocumentV2["sections"][number]["review"]>["steps"][number]["media"][number];
type EvidenceMediaProps = {
  asset: TourAsset;
  url: string | undefined;
  annotations?: MediaAnnotations;
  onUnavailable?: () => void;
  checkAsset?: CheckEvidenceAsset;
};
const control = { nativeButton: true, type: "button", size: "sm", shape: "square", variant: "ghost", tone: "neutral", loading: false, iconOnly: false } as const;

export function EvidenceMedia(props: EvidenceMediaProps) {
  return <MediaAsset key={JSON.stringify([props.asset.sha256, props.url])} {...props} />;
}

function MediaAsset({ asset, url, annotations, onUnavailable, checkAsset = checkLocalAsset }: EvidenceMediaProps) {
  const id = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ x: number; y: number; key: number }>();
  const reportUnavailable = useEffectEvent(() => { setFailed(true); onUnavailable?.(); });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    void checkAsset(url, controller.signal)
      .catch(() => { if (!controller.signal.aborted) reportUnavailable(); });
    return () => controller.abort();
  }, [url, checkAsset]);
  const unavailable = !url || failed;
  const unavailableLabel = `Evidence unavailable: ${asset.caption}. Restore the asset and refresh the tour.`;
  const description = <div className="space-y-2"><Text as="p" variant="body">{asset.description}</Text><Text as="p" variant="caption">{asset.provenance}</Text></div>;
  const onMediaError = () => { setFailed(true); onUnavailable?.(); };
  const image = asset.mediaType.startsWith("image/");
  const video = asset.mediaType.startsWith("video/");
  const callouts = annotations?.callouts ?? [];
  const moments = annotations?.moments ?? [];
  const width = annotations?.width ?? 1600;
  const height = annotations?.height ?? 1000;

  function selectCallout(callout: typeof callouts[number]) {
    setSelected(callout.id);
    setReveal(previous => ({ x: callout.x, y: callout.y, key: (previous?.key ?? 0) + 1 }));
  }
  function seekMoment(moment: typeof moments[number]) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = moment.seconds;
    setSelected(moment.id);
    video.focus();
  }
  const item: MediaViewerItem | undefined = !image || !url ? undefined : {
    id: asset.id, sourceKey: asset.sha256, title: asset.caption, src: url,
    caption: <Text as="p" variant="body">{asset.description}</Text>,
    annotations: callouts.length ? <MediaAnnotationList image callouts={callouts} moments={[]} selected={selected} unavailable={unavailable} onSelectCallout={selectCallout} onSelectMoment={seekMoment} /> : undefined, evidence: description,
    kind: "image", alt: asset.description, width, height, reveal,
  };

  if (!image && !video) return <div className="space-y-2">
    {unavailable ? <Text as="p" variant="ui" role="alert">{unavailableLabel}</Text> : <a href={url} className="inline-block min-h-11 py-3 underline underline-offset-4">Open {asset.caption}</a>}
    {description}
  </div>;
  return <figure aria-labelledby={`${id}-title`} className="min-w-0 space-y-3">
    {unavailable ? <Text as="p" variant="ui" role="alert">{unavailableLabel}</Text> : image ?
      <div className="relative min-w-0" style={{ maxWidth: width }}>
        {/* Captured bytes remain native media; the shared viewer owns enlargement. */}
        <Image unoptimized src={url ?? ""} alt={asset.description} width={width} height={height} onError={onMediaError}
          className="block h-auto w-full outline outline-1 -outline-offset-1 outline-[var(--anaphor-image-outline)]" />
        {callouts.map((callout, index) => <span key={callout.id} aria-hidden="true"
          className="pointer-events-none absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-small text-background shadow-card"
          style={{ left: `${callout.x * 100}%`, top: `${callout.y * 100}%` }}>{index + 1}</span>)}
      </div> : <video ref={videoRef} src={url} controls preload="metadata" playsInline tabIndex={0}
        aria-label={asset.caption} aria-describedby={`${id}-description`} onError={onMediaError}
        className="block w-full outline outline-1 -outline-offset-1 outline-[var(--anaphor-image-outline)]" />}
    <figcaption className="space-y-3">
      <Text as="span" variant="ui" id={`${id}-title`}>{asset.caption}</Text>
      <div id={`${id}-description`}>{description}</div>
      {image && <Button {...control} ref={openerRef} disabled={unavailable} onClick={() => setOpen(true)}>
        <ButtonLabel>Enlarge {asset.caption}</ButtonLabel>
      </Button>}
      <MediaAnnotationList image={image} callouts={callouts} moments={moments} selected={selected} unavailable={unavailable} onSelectCallout={selectCallout} onSelectMoment={seekMoment} />
    </figcaption>
    {item && <MediaViewer open={open} onOpenChange={setOpen} items={[item]} activeItemId={asset.id}
      onActiveItemChange={() => {}} initialPanel={callouts.length ? "annotations" : "evidence"} returnFocus={openerRef} />}
  </figure>;
}

function MediaAnnotationList({ image, callouts, moments, selected, unavailable, onSelectCallout, onSelectMoment }: {
  image: boolean; callouts: MediaAnnotations["callouts"]; moments: MediaAnnotations["moments"];
  selected: string | null; unavailable: boolean;
  onSelectCallout: (callout: MediaAnnotations["callouts"][number]) => void;
  onSelectMoment: (moment: MediaAnnotations["moments"][number]) => void;
}) {
    if (image) return callouts.length > 0 && <ol className="list-decimal space-y-2 ps-6">
      {callouts.map(callout => <li key={callout.id}><Button {...control} aria-pressed={selected === callout.id}
        className="h-auto min-w-0 justify-start whitespace-normal text-start" onClick={() => onSelectCallout(callout)}>
        <ButtonLabel>{callout.label}</ButtonLabel>
      </Button></li>)}
    </ol>;
    return moments.length > 0 && <div className="space-y-2">
      <ol className="space-y-1">{moments.map(moment => <li key={moment.id}>
        <Button {...control} disabled={unavailable} aria-pressed={selected === moment.id}
            className="h-auto min-w-0 justify-start whitespace-normal text-start" onClick={() => onSelectMoment(moment)}><ButtonLabel><span className="font-mono tabular-nums">{formatTimestamp(moment.seconds)}</span> — {moment.label}</ButtonLabel></Button>
      </li>)}</ol>
    </div>;
  }

function formatTimestamp(seconds: number) {
  const tenths = Math.round(seconds * 10);
  const whole = Math.floor(tenths / 10);
  const fraction = tenths % 10;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}${fraction ? `.${fraction}` : ""}`;
}
