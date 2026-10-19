"use client";

import { Button, ButtonLabel, Section, Text } from "@anaphor/system";
import { ArrowClockwise, FileText } from "@phosphor-icons/react";
import { useState, type CSSProperties } from "react";
import { Controls } from "./controls";
import { UploadExample } from "./upload-example";
import { useUpload } from "./use-upload";

export function UploadDemo() {
  const session = useUpload();
  const [narrow, setNarrow] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [duration, setDuration] = useState(200);
  const [controlsRevision, setControlsRevision] = useState(0);
  function reset() {
    session.reset(); setNarrow(false); setReducedMotion(false); setMirrored(false); setDuration(200);
    setControlsRevision(value => value + 1);
  }
  const canvasStyle: CSSProperties & { "--upload-duration": string } = { maxWidth: narrow ? 390 : 720, "--upload-duration": `${duration}ms` };
  return <Section id="file-upload" aria-labelledby="upload-title" className="border-t border-border py-12">
      <header className="mb-8">
        <Text as="p" variant="label" className="text-muted-foreground">Component</Text>
        <Text as="h2" variant="title" id="upload-title" className="mt-8">File upload</Text>
        <Text as="p" variant="description" className="mt-3">Select, upload, and recover in one place.</Text>
      </header>
      <div className="mx-auto" dir={mirrored ? "rtl" : "ltr"} style={canvasStyle}>
        <UploadExample session={session} reducedMotion={reducedMotion} />
      </div>
      <div className="mx-auto mt-5 grid max-w-[720px] gap-3">
        <div className="flex flex-wrap gap-2">
          <Button nativeButton type="button" size="md" shape="square" variant="outline" tone="neutral" loading={false} iconOnly={false} disabled={session.disabled} onClick={session.useSample}><FileText aria-hidden="true" /><ButtonLabel>Use sample files</ButtonLabel></Button>
          <Button nativeButton type="button" size="md" shape="square" variant="ghost" tone="neutral" loading={false} iconOnly={false} onClick={reset}><ArrowClockwise aria-hidden="true" /><ButtonLabel>Reset example</ButtonLabel></Button>
        </div>
        <Text as="p" variant="caption">Selection is real. Transfers and processing are simulated; nothing is sent or saved.</Text>
      </div>
      <Controls key={controlsRevision} session={session} narrow={narrow} setNarrow={setNarrow} reducedMotion={reducedMotion} setReducedMotion={setReducedMotion} duration={duration} setDuration={setDuration} mirrored={mirrored} setMirrored={setMirrored} reset={reset} />
    </Section>;
}
