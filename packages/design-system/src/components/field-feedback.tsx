"use client";

import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "motion/react";
import { FieldDescription } from "./field";

type FieldFeedbackProps = { id?: string; hint: string; error: string; invalid: boolean };

function FieldFeedback({ id, hint, error, invalid }: FieldFeedbackProps) {
  const reducedMotion = useReducedMotion();
  const transition = { duration: reducedMotion ? 0 : 0.16, ease: "easeOut" as const };
  return (
    <div className="grid text-ui">
      <FieldDescription id={id} className="sr-only" role="status" aria-atomic="true">{invalid ? error : hint}</FieldDescription>
      <motion.span
        aria-hidden="true"
        className="col-start-1 row-start-1 text-pretty text-muted-foreground [overflow-wrap:break-word]"
        initial={false}
        animate={{ opacity: invalid ? 0 : 1, y: invalid && !reducedMotion ? -2 : 0 }}
        transition={transition}
      >{hint}</motion.span>
      <motion.span
        aria-hidden="true"
        className="col-start-1 row-start-1 flex items-start gap-1.5 text-danger-foreground"
        initial={false}
        animate={{ opacity: invalid ? 1 : 0, y: !invalid && !reducedMotion ? 2 : 0 }}
        transition={transition}
      >
        <motion.span className="mt-0.5 shrink-0" initial={false} animate={{ scale: invalid || reducedMotion ? 1 : 0.9 }} transition={transition}>
          <WarningCircle className="size-4" />
        </motion.span>
        {error}
      </motion.span>
    </div>
  );
}

export { FieldFeedback, type FieldFeedbackProps };
