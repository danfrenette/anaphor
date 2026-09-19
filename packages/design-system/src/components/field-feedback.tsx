"use client";

import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { FieldDescription } from "./field";

type FieldFeedbackProps = { id?: string; hint: string; error: string; invalid: boolean };

function FieldFeedback({ id, hint, error, invalid }: FieldFeedbackProps) {
  return (
    <div className="grid text-ui">
      <FieldDescription id={id} className="sr-only" role="status" aria-atomic="true">{invalid ? error : hint}</FieldDescription>
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 text-pretty text-muted-foreground [overflow-wrap:break-word]"
        style={{ opacity: invalid ? 0 : 1 }}
      >{hint}</span>
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 flex items-start gap-1.5 text-danger-foreground"
        style={{ opacity: invalid ? 1 : 0 }}
      >
        <span className="mt-0.5 shrink-0">
          <WarningCircle className="size-4" />
        </span>
        {error}
      </span>
    </div>
  );
}

export { FieldFeedback, type FieldFeedbackProps };
