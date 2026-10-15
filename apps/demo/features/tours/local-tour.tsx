"use client";

import { useState } from "react";
import axios from "axios";
import { Button, ButtonLabel, Text, ThemeToggle } from "@anaphor/system";
import { storedTour } from "./document";
import type { LocalTour as LocalTourDocument } from "./local-store";
import { TourReader } from "./reader";

export function LocalTour({ initial }: { initial: LocalTourDocument }) {
  const [tour, setTour] = useState(initial);
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function refresh() {
    setPending(true);
    setFailed(false);
    try {
      setTour(storedTour.omit({ url: true }).parse((await axios.get(`/api/local-tours/${initial.id}`, { timeout: 15000 })).data));
      setRefreshGeneration((value) => value + 1);
    }
    catch { setFailed(true); }
    finally { setPending(false); }
  }
  return <>
    <div className="mb-12 space-y-4">
      <Text as="p" variant="caption">Local preview</Text>
      <Text as="p" variant="caption">This URL opens on this machine. Hosted publication is optional.</Text>
      <div className="flex flex-wrap items-center gap-3">
        <Button iconOnly={false} nativeButton={true} type="button" shape="square" size="md" variant="outline" tone="neutral"
          loading={pending} onClick={() => void refresh()}><ButtonLabel>Refresh tour</ButtonLabel></Button>
        <ThemeToggle />
      </div>
      {failed && <p role="alert">The tour could not refresh. Your current revision is still shown. Check the local workspace and try again.</p>}
    </div>
    <TourReader key={refreshGeneration} document={tour.document} revision={tour.revision}
      assetBaseUrl={`/api/local-tours/${tour.id}/revisions/${tour.revision}/assets`} />
  </>;
}
