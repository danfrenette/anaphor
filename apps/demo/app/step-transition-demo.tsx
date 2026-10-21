"use client";

import { useState } from "react";
import { Button, ButtonLabel, Section, StepTransition, Text } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";

const steps = [
  { title: "Choose the evidence", description: "Start with the capture that answers the reviewer's question." },
  { title: "Explain the change", description: "Describe the action, the visible outcome, and the part of the capture that matters. Keep the explanation with its source so the reviewer can inspect both together." },
  { title: "Review the result", description: "Confirm the evidence still applies to the source under review." },
];
const button = { nativeButton: true, type: "button", variant: "outline", tone: "neutral", size: "md", shape: "square", iconOnly: false, loading: false } as const;

export function StepTransitionDemo() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [expanded, setExpanded] = useState(false);
  const current = steps[step]!;
  function go(next: number) { setDirection(next > step ? "forward" : "backward"); setStep(next); }
  return <Section id="step-transition" className="border-t border-border py-12">
    <Text as="h2" variant="title">Step transition</Text>
    <Text as="p" variant="description" className="mt-3">Move ordered content in the direction of navigation while its container follows the content height.</Text>
    <div className="mt-10"><CatalogExample title="Ordered content" description="Back and Continue stay outside the moving content. Expand an explanation to resize the current step."
      code={'<StepTransition dir="ltr" value={stepId} direction={direction} animate>\n  {content}\n</StepTransition>'}>
      <StepTransition dir="ltr" value={String(step)} direction={direction} animate>
        <div className="space-y-4 p-2">
          <Text as="h3" variant="heading">{current.title}</Text>
          <Text as="p" variant="body">{current.description}</Text>
          <Button {...button} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><ButtonLabel>{expanded ? "Hide explanation" : "Expand explanation"}</ButtonLabel></Button>
          {expanded && <Text as="p" variant="body">Keep the source revision, capture date, and limitations available alongside the claim. Content can grow after arrival without starting another directional transition.</Text>}
        </div>
      </StepTransition>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button {...button} disabled={step === 0} onClick={() => go(step - 1)}><ButtonLabel>Back</ButtonLabel></Button>
        <Text as="span" variant="caption" className="font-mono tabular-nums">{step + 1} / {steps.length}</Text>
        <Button {...button} variant="solid" tone="accent" disabled={step === steps.length - 1} onClick={() => go(step + 1)}><ButtonLabel>Continue</ButtonLabel></Button>
      </div>
    </CatalogExample></div>
  </Section>;
}
