"use client";

import { useEffect, useReducer, useState } from "react";
import { initialUploadState, inspectedUpload, uploadReducer, type Phase, type Scenario } from "./upload-state";

function sampleFiles(): [File, File, File] {
  return [
    new File(["# Project proposal\n\nSupporting notes.\n".repeat(16384)], "Project proposal — supporting research and revision notes — final annotated copy.md", { type: "text/markdown" }),
    new File(["Meeting notes\n".repeat(2048)], "Meeting notes.txt", { type: "text/plain" }),
    new File(["# Reference\n".repeat(4096)], "Reference notes.md", { type: "text/markdown" }),
  ];
}

export function useUpload() {
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState);
  const [scenario, setScenario] = useState<Scenario>("Steady");
  const [disabled, setDisabled] = useState(false);
  const activeItem = inspectedUpload(state);
  const isSimulating = state.items.some(item => item.simulation !== null);

  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => dispatch({ type: "tick", now: performance.now() }), 100);
    return () => clearInterval(timer);
  }, [isSimulating]);

  function select(files: File[]) {
    if (!disabled) dispatch({ type: "select", files });
  }

  function start(id: string | null) {
    if (!disabled) dispatch({ type: "start", id, scenario, now: performance.now() });
  }

  function preview(phase: Phase) {
    dispatch({ type: "preview", phase, scenario, fallbackFile: activeItem?.file ?? sampleFiles()[0] });
  }

  function reset() {
    dispatch({ type: "reset" });
    setScenario("Steady");
    setDisabled(false);
  }

  return {
    items: state.items,
    error: state.error,
    announcement: state.announcement,
    activeItem,
    isSimulating,
    scenario,
    setScenario,
    disabled,
    setDisabled,
    select,
    preview,
    reset,
    setActiveId: (id: string) => dispatch({ type: "inspect", id }),
    cancel: (id: string) => dispatch({ type: "cancel", id }),
    remove: (id: string) => dispatch({ type: "remove", id }),
    upload: (id: string) => start(id),
    uploadPending: () => start(null),
    mixed: () => dispatch({ type: "mixed", files: sampleFiles() }),
    useSample: () => select(sampleFiles()),
    rejectSample: () => select([new File(["title,notes\nExample,unsupported\n"], "unsupported.csv", { type: "text/csv" })]),
    setFraction: (fraction: number) => dispatch({ type: "fraction", fraction }),
  };
}

export type UploadSession = ReturnType<typeof useUpload>;
