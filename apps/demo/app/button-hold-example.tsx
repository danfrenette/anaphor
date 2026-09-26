"use client";

import { Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import "./button-hold-example.css";

const holdDuration = 2000;

export function ButtonHoldExample() {
  const [deleted, setDeleted] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  function startHold() {
    if (deleted || timer.current !== null) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setDeleted(true);
    }, holdDuration);
  }

  function cancelHold() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  if (deleted) {
    return (
      <div className="flex flex-wrap items-center gap-3" role="status">
        <span className="text-ui text-muted-foreground">Example item deleted.</span>
        <button type="button" className="min-h-11 rounded-control px-3 text-ui text-foreground underline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setDeleted(false)}>
          Restore item
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        className="hold-delete-button"
        data-holding={holding || undefined}
        aria-describedby="hold-delete-help"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          startHold();
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onBlur={cancelHold}
        onKeyDown={(event) => {
          if (event.key !== " " && event.key !== "Enter") return;
          event.preventDefault();
          startHold();
        }}
        onKeyUp={(event) => {
          if (event.key !== " " && event.key !== "Enter") return;
          event.preventDefault();
          cancelHold();
        }}
      >
        <span className="hold-delete-button__content"><Trash aria-hidden="true" />Hold to delete</span>
        <span className="hold-delete-button__overlay" aria-hidden="true"><Trash />Hold to delete</span>
      </button>
      <p id="hold-delete-help" className="text-small text-muted-foreground">
        {holding ? "Keep holding to delete the example item." : "Press and hold for 2 seconds. Release early to cancel."}
      </p>
    </div>
  );
}
