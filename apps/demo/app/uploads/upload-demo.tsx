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
  return <main id="content" tabIndex={-1} className="mx-auto max-w-4xl px-6 pt-8 pb-[max(6rem,env(safe-area-inset-bottom))] sm:px-8">
    <Section id="file-upload" aria-labelledby="upload-page-title">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2"><Text as="h1" variant="heading" id="upload-page-title">File upload</Text><Text as="p" variant="ui" className="text-muted-foreground">Select, upload, and recover in one place.</Text></div>
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
    </Section>
  </main>;
}
