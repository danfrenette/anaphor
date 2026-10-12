"use client";

import { useEffect, useRef, useState } from "react";

export type Phase = "selected" | "uploading" | "finishing" | "processing" | "complete" | "upload-error" | "processing-error";
export type Scenario = "Steady" | "Quick" | "Unknown total" | "Transfer failure" | "Processing failure";
export type UploadItem = { id: string; file: File; phase: Phase; fraction: number; unknown: boolean };
export const phases: Phase[] = ["selected", "uploading", "finishing", "processing", "complete", "upload-error", "processing-error"];
export const scenarios: Scenario[] = ["Steady", "Quick", "Unknown total", "Transfer failure", "Processing failure"];
export const isBusy = (phase: Phase) => phase === "uploading" || phase === "finishing" || phase === "processing";
type Run = { started: number; transferTime: number; processingTime: number; scenario: Scenario; fromProcessing: boolean; retry: boolean; phase: Phase; name: string };

function sampleFiles() {
  return [
    new File(["# Project proposal\n\nSupporting notes.\n".repeat(16384)], "Project proposal — supporting research and revision notes — final annotated copy.md", { type: "text/markdown" }),
    new File(["Meeting notes\n".repeat(2048)], "Meeting notes.txt", { type: "text/plain" }),
    new File(["# Reference\n".repeat(4096)], "Reference notes.md", { type: "text/markdown" }),
  ];
}

export function useUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const [scenario, setScenario] = useState<Scenario>("Steady");
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [playing, setPlaying] = useState(false);
  const runs = useRef(new Map<string, Run>());
  const sequence = useRef(0);
  const activeItem = items.find(item => item.id === activeId) ?? items[0];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!runs.current.size) return;
      const changes = new Map<string, { phase: Phase; fraction: number }>();
      const notices: string[] = [];
      for (const [id, run] of runs.current) {
        const elapsed = performance.now() - run.started;
        const processingElapsed = run.fromProcessing ? elapsed : elapsed - run.transferTime - 700;
        let phase: Phase;
        let fraction = 1;
        if (!run.fromProcessing && elapsed < run.transferTime) {
          fraction = Math.min(1, Math.floor(elapsed / run.transferTime * 20) / 20);
          phase = !run.retry && run.scenario === "Transfer failure" && elapsed >= run.transferTime * 0.45 ? "upload-error" : "uploading";
        } else if (!run.fromProcessing && elapsed < run.transferTime + 700) phase = "finishing";
        else phase = !run.retry && run.scenario === "Processing failure" && processingElapsed >= run.processingTime * 0.6 ? "processing-error"
          : processingElapsed >= run.processingTime ? "complete" : "processing";
        if (phase !== run.phase) {
          run.phase = phase;
          notices.push(`${run.name}: ${phase === "finishing" ? "Transfer finished. Waiting for confirmation." : phase === "processing" ? "Processing file." : phase === "complete" ? "Upload complete." : "Interrupted. Retry is available."}`);
        }
        changes.set(id, { phase, fraction });
        if (phase === "complete" || phase.endsWith("error")) runs.current.delete(id);
      }
      setItems(current => {
        const next = current.map(item => {
          const change = changes.get(item.id);
          return !change || (item.phase === change.phase && item.fraction === change.fraction) ? item : { ...item, ...change };
        });
        return next.every((item, index) => item === current[index]) ? current : next;
      });
      if (notices.length) setAnnouncement(notices.join(" "));
      if (!runs.current.size) setPlaying(false);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  function makeItems(files: File[]): UploadItem[] {
    return files.map(file => ({ id: `file-${++sequence.current}`, file, phase: "selected", fraction: 0, unknown: false }));
  }

  function select(files: File[]) {
    if (disabled || !files.length) return;
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const reason = !/\.(pdf|md|txt)$/i.test(file.name) ? "choose PDF, Markdown, or plain text."
        : file.size > 10 * 1024 * 1024 ? "over the demo’s 10 MB limit."
        : file.size === 0 ? "the file is empty." : "";
      if (reason) rejected.push(`${file.name}: ${reason}`);
      else accepted.push(file);
    }
    const added = makeItems(accepted);
    if (added.length) {
      setItems(current => [...current, ...added]);
      setActiveId(added[0]?.id ?? "");
      setAnnouncement(`${added.length} ${added.length === 1 ? "file" : "files"} added. Ready to upload.`);
    }
    setError(rejected.join(" "));
  }

  function start(selected: UploadItem[], retry = false) {
    if (disabled || !selected.length) return;
    const ids = new Set(selected.map(item => item.id));
    for (const item of selected) {
      const fromProcessing = item.phase === "processing-error";
      runs.current.set(item.id, {
        started: performance.now(), transferTime: scenario === "Quick" ? 1600 : 2500 + Math.min(item.file.size / 256, 6000),
        processingTime: scenario === "Quick" ? 900 : 2400, scenario, fromProcessing, retry,
        phase: fromProcessing ? "processing" : "uploading", name: item.file.name,
      });
    }
    setItems(current => current.map(item => ids.has(item.id) ? { ...item, phase: item.phase === "processing-error" ? "processing" : "uploading", fraction: item.phase === "processing-error" ? 1 : 0, unknown: scenario === "Unknown total" } : item));
    setPlaying(true);
    setAnnouncement(`${retry ? "Retrying" : "Uploading"} ${selected.length} ${selected.length === 1 ? "file" : "files"}.`);
  }

  function stop(id: string) { runs.current.delete(id); setPlaying(runs.current.size > 0); }
  function cancel(id: string) {
    stop(id);
    setItems(current => current.map(item => item.id === id ? { ...item, phase: "selected", fraction: 0, unknown: false } : item));
    setAnnouncement("Upload canceled. The selected file is kept; other uploads continue.");
  }
  function remove(id: string) {
    stop(id);
    setItems(current => current.filter(item => item.id !== id));
    setAnnouncement("File removed. Other files are kept.");
  }
  function preview(next: Phase) {
    const chosen = activeItem ?? makeItems(sampleFiles().slice(0, 1))[0];
    if (!chosen) return;
    stop(chosen.id);
    const changed: UploadItem = { ...chosen, phase: next, fraction: next === "uploading" || next === "upload-error" ? 0.4 : next === "selected" ? 0 : 1, unknown: scenario === "Unknown total" };
    setItems(current => current.length ? current.map(item => item.id === chosen.id ? changed : item) : [changed]);
    setActiveId(chosen.id);
    setAnnouncement("");
  }
  function reset() {
    runs.current.clear(); setPlaying(false); setItems([]); setActiveId(""); setScenario("Steady"); setDisabled(false); setError(""); setAnnouncement("");
  }
  function mixed() {
    runs.current.clear(); setPlaying(false);
    const samples = makeItems(sampleFiles());
    setItems(samples.map((item, index) => ({ ...item, phase: index === 0 ? "uploading" : index === 1 ? "complete" : "upload-error", fraction: index === 1 ? 1 : 0.4 })));
    setActiveId(samples[0]?.id ?? ""); setError("");
    setAnnouncement("Showing independent uploading, complete, and failed files.");
  }

  return {
    items, activeItem, setActiveId, scenario, setScenario, disabled, setDisabled, error, announcement, playing,
    select, cancel, remove, preview, reset, mixed,
    upload: (id: string) => start(items.filter(item => item.id === id && !isBusy(item.phase) && item.phase !== "complete"), items.some(item => item.id === id && item.phase.endsWith("error"))),
    uploadPending: () => start(items.filter(item => item.phase === "selected")),
    useSample: () => select(sampleFiles()),
    rejectSample: () => select([new File(["title,notes\nExample,unsupported\n"], "unsupported.csv", { type: "text/csv" })]),
    setFraction: (fraction: number) => setItems(current => current.map(item => item.id === activeItem?.id ? { ...item, fraction } : item)),
  };
}

export type UploadSession = ReturnType<typeof useUpload>;
