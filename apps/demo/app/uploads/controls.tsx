"use client";

import { Button, ButtonLabel, Text } from "@anaphor/system";
import { useState } from "react";
import { Check, Range, Select } from "../playground-fields";
import { PlaygroundControls } from "../playground-host";
import { phases, scenarios } from "./upload-state";
import type { UploadSession } from "./use-upload";

export function Controls({ session, narrow, setNarrow, reducedMotion, setReducedMotion, duration, setDuration, mirrored, setMirrored, reset }: {
  session: UploadSession; narrow: boolean; setNarrow: (value: boolean) => void;
  reducedMotion: boolean; setReducedMotion: (value: boolean) => void;
  mirrored: boolean; setMirrored: (value: boolean) => void;
  duration: number; setDuration: (value: number) => void; reset: () => void;
}) {
  const [copied, setCopied] = useState("");
  const names = session.items.map(item => `${item.file.name} (${item.id})`);
  const target = session.activeItem;
  return <PlaygroundControls sectionId="file-upload" title="File upload" onReset={reset}>
    <div className="grid gap-4">
      <Select label="Scenario" value={session.scenario} options={scenarios} onChange={session.setScenario} />
      {target && <Select label="Inspect file" value={`${target.file.name} (${target.id})`} options={names} onChange={name => {
        const item = session.items.find(item => `${item.file.name} (${item.id})` === name);
        if (item) session.setActiveId(item.id);
      }} />}
      <Select label="Inspect state" value={target?.phase ?? "empty"} options={["empty", ...phases]} onChange={value => {
        if (value === "empty" && target) session.remove(target.id);
        const phase = phases.find(phase => phase === value);
        if (phase) session.preview(phase);
      }} />
      {target?.phase === "uploading" && !target.unknown && !session.isSimulating && <Range label="Transferred" value={Math.round(target.fraction * 100)} min={0} max={100} step={1} unit="%" onChange={value => session.setFraction(value / 100)} />}
      <Range label="Meter response" value={duration} min={80} max={400} step={10} unit="ms" onChange={setDuration} />
      <Check label="390px canvas" checked={narrow} onChange={setNarrow} />
      <Check label="Mirror layout (RTL)" checked={mirrored} onChange={setMirrored} />
      <Check label="Disable uploader" checked={session.disabled} onChange={session.setDisabled} />
      <Check label="Reduce motion" checked={reducedMotion} onChange={setReducedMotion} />
      <div className="grid gap-2">
        <Button nativeButton type="button" size="md" shape="square" tone="neutral" variant="outline" loading={false} iconOnly={false} disabled={session.disabled} onClick={session.rejectSample}><ButtonLabel>Try invalid file</ButtonLabel></Button>
        <Button nativeButton type="button" size="md" shape="square" tone="neutral" variant="outline" loading={false} iconOnly={false} disabled={session.disabled} onClick={session.mixed}><ButtonLabel>Show mixed states</ButtonLabel></Button>
        <Button nativeButton type="button" size="md" shape="square" tone="neutral" variant="ghost" loading={false} iconOnly={false} onClick={async () => {
          try {
            await navigator.clipboard.writeText(JSON.stringify({ duration, reducedMotion, narrow, mirrored, scenario: session.scenario }, null, 2));
            setCopied("Copied settings");
          } catch { setCopied("Clipboard unavailable"); }
        }}><ButtonLabel>Copy settings</ButtonLabel></Button>
      </div>
      <Text as="p" variant="caption" role="status" className="min-h-5">{copied}</Text>
    </div>
  </PlaygroundControls>;
}
