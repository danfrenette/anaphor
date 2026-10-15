"use client";

import { AnnotatedScreenshot, VideoEvidence } from "@anaphor/system";
import { useEffect, useEffectEvent, useState } from "react";
import { http } from "./browser-http";
import type { TourAsset, TourDocumentV2 } from "./document";

export type CheckEvidenceAsset = (url: string, signal: AbortSignal) => Promise<void>;
async function checkLocalAsset(url: string, signal: AbortSignal) { await http.head(url, { signal }); }

type MediaAnnotations = NonNullable<TourDocumentV2["sections"][number]["review"]>["steps"][number]["media"][number];

export function EvidenceMedia({ asset, url, annotations, onUnavailable, checkAsset = checkLocalAsset }: {
  asset: TourAsset; url: string | undefined; annotations?: MediaAnnotations; onUnavailable?: () => void; checkAsset?: CheckEvidenceAsset;
}) {
  const [failed, setFailed] = useState(false);
  const reportUnavailable = useEffectEvent(() => { setFailed(true); onUnavailable?.(); });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    void checkAsset(url, controller.signal)
      .catch(() => { if (!controller.signal.aborted) reportUnavailable(); });
    return () => controller.abort();
  }, [url, checkAsset]);
  const unavailableLabel = `Evidence unavailable: ${asset.caption}. Restore the asset and refresh the tour.`;
  const description = <>{asset.description}<span className="mt-2 block text-small text-muted-foreground">{asset.provenance}</span></>;
  const onMediaError = () => { setFailed(true); onUnavailable?.(); };
  if (asset.mediaType.startsWith("image/")) return <AnnotatedScreenshot
    src={failed ? null : url ?? null} alt={asset.description} width={annotations?.width ?? 1600} height={annotations?.height ?? 1000}
    title={asset.caption} description={description} callouts={annotations?.callouts ?? []}
    enlargeLabel={`Enlarge ${asset.caption}`} closeLabel="Close enlarged screenshot" unavailableLabel={unavailableLabel} onMediaError={onMediaError} />;
  if (asset.mediaType.startsWith("video/")) return <VideoEvidence src={failed ? null : url ?? null} title={asset.caption}
    description={description} moments={annotations?.moments ?? []} unavailableLabel={unavailableLabel} onMediaError={onMediaError} />;
  return <div className="space-y-2 text-ui">{!url || failed ? <p role="alert">{unavailableLabel}</p> : <a href={url} className="inline-block min-h-11 py-3 underline underline-offset-4">Open {asset.caption}</a>}
    <p>{description}</p>
  </div>;
}
