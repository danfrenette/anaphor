"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Section } from "@anaphor/system";
import { PlaygroundControls } from "./playground-host";
import { Range, Select } from "./playground-fields";

export function SliderDemo() {
  const [snap, setSnap] = useState<"standard" | "magnetic">("magnetic");
  const [threshold, setThreshold] = useState(0.6);
  const [step, setStep] = useState<"5" | "10" | "20">("10");
  const [value, setValue] = useState(50);
  return <Section id="slider" className="border-t border-border py-12">
    <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">Control / Experiment</p>
    <h2 className="mt-8 text-title font-medium tracking-heading">Slider</h2>
    <p className="mt-3 prose-reading text-pretty">Compare standard dragging with magnetic notches. Adjust the step size and stickiness in Controls.</p>
    <PlaygroundControls sectionId="slider" title="Slider" onReset={() => { setSnap("magnetic"); setThreshold(0.6); setStep("10"); setValue(50); }}>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Snapping" value={snap} options={["standard", "magnetic"]} onChange={setSnap} />
        <Select label="Step" value={step} options={["5", "10", "20"]} onChange={next => { setStep(next); setValue(current => Math.round(current / Number(next)) * Number(next)); }} />
        {snap === "magnetic" && <Range label="Release threshold" value={Math.round(threshold * 100)} min={50} max={80} step={5} unit="%" onChange={next => setThreshold(next / 100)} />}
        <p className="col-span-2 text-small text-muted-foreground">{snap === "magnetic" ? `Move ${Math.round(threshold * 100)}% toward the next notch to switch. Higher values feel stickier.` : "Original DialKit dragging, click snapping, and number editing."}</p>
      </div>
    </PlaygroundControls>
    <Card variant="default" className="mt-8" role="group" aria-label="Slider preview">
      <CardHeader><CardTitle as="h3" variant="label">DialKit slider</CardTitle></CardHeader>
      <CardContent className="grid min-h-40 content-center gap-4">
        <Range label="Amount" value={value} onChange={setValue} min={0} max={100} step={Number(step)} unit="" snap={snap} releaseThreshold={threshold} />
        <p className="text-small text-muted-foreground">Arrow keys move one step. Press Enter on the slider to type a value.</p>
      </CardContent>
    </Card>
    <p className="mt-4 text-small text-muted-foreground">Thanks to <a href="https://www.dialkit.dev/" className="underline underline-offset-4">DialKit</a> and its creator, Josh Puckett, for the slider used here.</p>
  </Section>;
}
