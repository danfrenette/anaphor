"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useId, useState } from "react";
import type { TourAsset } from "./document";

export function EvidenceMedia({ asset, url, onUnavailable }: { asset: TourAsset; url: string | undefined; onUnavailable?: () => void }) {
  const descriptionId = useId();
  const [failed, setFailed] = useState(false);
  const reportUnavailable = useEffectEvent(() => { setFailed(true); onUnavailable?.(); });
  useEffect(() => {
    if (!url || asset.mediaType !== "text/plain") return;
    const controller = new AbortController();
    void fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal })
      .then((response) => { if (!response.ok) reportUnavailable(); })
      .catch(() => { if (!controller.signal.aborted) reportUnavailable(); });
    return () => controller.abort();
  }, [url, asset.mediaType]);
  if (!url || failed) return <p role="alert">Evidence unavailable: {asset.caption}. Restore the asset and refresh the tour.</p>;
  return <figure className="space-y-3">
    {asset.mediaType.startsWith("image/") ? (
      <Image src={url} alt={asset.description} width={1600} height={1000} unoptimized
        className="h-auto w-full border border-input-border" onError={() => { setFailed(true); onUnavailable?.(); }} />
    ) : asset.mediaType.startsWith("video/") ? (
      <>
        <video src={url} controls preload="metadata" aria-label={asset.caption}
          aria-describedby={descriptionId} className="w-full border border-input-border"
          onError={() => { setFailed(true); onUnavailable?.(); }} />
        <p id={descriptionId} className="text-ui">{asset.description}</p>
      </>
    ) : <a href={url} className="underline underline-offset-4">Open {asset.caption}</a>}
    <figcaption className="space-y-1 text-small text-muted-foreground">
      <p>{asset.caption}</p><p>{asset.provenance}</p>
    </figcaption>
  </figure>;
}
