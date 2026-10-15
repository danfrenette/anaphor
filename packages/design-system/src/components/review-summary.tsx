import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Text } from "./text";

export type RequirementSummaryProps = Omit<ComponentProps<"section">, "children"> & {
  problem: ReactNode;
  outcome: ReactNode;
  acceptance: readonly ReactNode[];
};

export function RequirementSummary({ problem, outcome, acceptance, className, ...props }: RequirementSummaryProps) {
  return <section className={cn("space-y-4", className)} {...props}>
    <Text as="h3" variant="subheading">The problem</Text>
    <Text as="p" variant="body">{problem}</Text>
    <Text as="h3" variant="subheading">Required outcome</Text>
    <Text as="p" variant="body">{outcome}</Text>
    <details><summary className="min-h-11 cursor-pointer py-3 text-ui">Acceptance conditions</summary>
      <ul className="list-disc space-y-2 pl-5 text-body">{acceptance.map((condition, index) => <li key={index}>{condition}</li>)}</ul>
    </details>
  </section>;
}

export type VerificationSummaryProps = ComponentProps<"article"> & {
  criterion: string;
  result: string;
  applicability: string;
  superseded: boolean;
  required: boolean;
  observed: ReactNode;
  detailsLabel: string;
};

/** Applications calculate applicability and supersession; this view only presents them. */
export function VerificationSummary({ criterion, result, applicability, superseded, required, observed, detailsLabel, children, className, ...props }: VerificationSummaryProps) {
  return <article className={cn("min-w-0 space-y-3 border-t-[length:var(--anaphor-border-hairline)] border-input-border py-5", className)} {...props}>
    <Text as="h3" variant="subheading">{criterion}</Text>
    <p className="text-ui">Recorded result: <strong>{result}</strong> · {applicability} evidence{required ? " · required" : ""}{superseded ? " · superseded" : ""}</p>
    <Text as="p" variant="body" className="whitespace-pre-wrap break-words">{observed}</Text>
    <details><summary className="min-h-11 cursor-pointer py-3 text-ui">{detailsLabel}</summary><div className="space-y-4 pt-3">{children}</div></details>
  </article>;
}
