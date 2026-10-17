"use client";

import { Button, ButtonLabel, Field, FieldFeedback, FileUpload, FileUploadDropzone, FileUploadProgress, FileUploadTrigger, Text, Tooltip, TooltipPopup, TooltipTrigger } from "@anaphor/system";
import { ArrowClockwise, Check, FileText, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { useCallback, useId, useRef, type RefObject } from "react";
import { isBusy, type UploadItem } from "./upload-state";
import type { UploadSession } from "./use-upload";

export function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`;
}

const actionSurface = [
  "max-w-full whitespace-normal [&_[data-slot=button-content]]:min-w-0 [&_[data-slot=button-label]]:[overflow-wrap:anywhere]",
  "data-[variant=outline]:border-transparent data-[variant=outline]:not-data-muted:shadow-upload-action data-[variant=solid]:not-data-muted:shadow-upload-action",
  "data-[variant=outline]:hover:not-data-disabled:shadow-upload-action-hover data-[variant=solid]:hover:not-data-disabled:shadow-upload-action-hover",
  "data-muted:shadow-none data-muted:bg-muted motion-safe:transition-[background-color,color,transform,box-shadow]",
  "forced-colors:shadow-none forced-colors:data-[variant=outline]:border-[ButtonText]",
].join(" ");

const labels = { selected: "Ready to upload", uploading: "Uploading", finishing: "Finishing upload", processing: "Processing file", complete: "Complete", "upload-error": "Transfer interrupted", "processing-error": "Processing interrupted" };

function FileRow({ item, session, onRemove, reducedMotion, actionRefs }: { item: UploadItem; session: UploadSession; onRemove: () => void; reducedMotion: boolean; actionRefs: RefObject<Map<string, HTMLButtonElement>> }) {
  const primary = useRef<HTMLButtonElement>(null);
  const actionRef = useCallback((element: HTMLButtonElement | null) => {
    primary.current = element;
    if (!element) return;
    actionRefs.current.set(item.id, element);
    return () => { actionRefs.current.delete(item.id); };
  }, [actionRefs, item.id]);
  const headingId = useId();
  const present = useIsPresent();
  const recoveryRef = useCallback((element: HTMLButtonElement | null) => {
    if (!element) return;
    return () => { if (document.activeElement === element) primary.current?.focus({ preventScroll: true }); };
  }, []);
  const { file, phase, fraction, unknown } = item;
  const busy = isBusy(phase);
  const failed = phase.endsWith("error");
  const complete = phase === "complete";
  const indeterminate = phase === "processing" || (phase === "uploading" && unknown);
  const detail = phase === "selected" ? "Start the upload when you’re ready."
    : phase === "uploading" ? unknown ? "Total size is unavailable." : `${fileSize(Math.round(fraction * file.size))} of ${fileSize(file.size)} transferred`
    : phase === "finishing" ? "Waiting for confirmation."
    : phase === "processing" ? "Upload received. Processing in progress."
    : complete ? "Your file is ready."
    : phase === "upload-error" ? "File kept. Retry when you’re ready."
    : "Retry processing without uploading again.";
  return <motion.li aria-labelledby={headingId} aria-hidden={!present || undefined} inert={!present || undefined}
    initial={reducedMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }} transition={{ duration: reducedMotion ? 0 : present ? 0.18 : 0.12, ease: [0.23, 1, 0.32, 1] }}
    className="grid min-w-0 gap-3 py-4">
    <div className="flex min-w-0 items-start gap-3">
      <span aria-hidden="true" className="pointer-events-none relative mt-0.5 size-5 shrink-0 select-none">
        <FileText className="absolute size-5 text-muted-foreground motion-safe:transition-[opacity,transform] motion-safe:duration-150" style={{ opacity: complete || failed ? 0 : 1, transform: complete || failed ? "scale(0.85)" : "scale(1)", transitionDuration: reducedMotion ? "0s" : undefined }} />
        <Check className="absolute size-5 text-foreground motion-safe:transition-[opacity,transform] motion-safe:duration-150" style={{ opacity: complete ? 1 : 0, transform: complete ? "scale(1)" : "scale(0.85)", transitionDuration: reducedMotion ? "0s" : undefined }} />
        <WarningCircle className="absolute size-5 text-danger-foreground motion-safe:transition-[opacity,transform] motion-safe:duration-150" style={{ opacity: failed ? 1 : 0, transform: failed ? "scale(1)" : "scale(0.85)", transitionDuration: reducedMotion ? "0s" : undefined }} />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <Text as="p" variant="ui" id={headingId} className="max-w-none font-medium text-foreground [overflow-wrap:anywhere]" data-file-name="">{file.name}</Text>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Text as="p" variant="caption">{file.name.split(".").pop()?.toUpperCase()} · {fileSize(file.size)}</Text>
          <Text as="span" variant="code" className="min-h-[1lh] w-12 shrink-0 text-end text-muted-foreground tabular-nums" aria-hidden="true">{phase === "uploading" && !unknown ? `${Math.round(fraction * 100)}%` : phase === "finishing" ? "100%" : ""}</Text>
        </div>
      </div>
    </div>
    <div className="ms-8 h-1">
      {phase !== "selected" && <FileUploadProgress value={indeterminate ? null : Math.round(fraction * file.size)} max={file.size} label={`${labels[phase]}: ${file.name}`}
        valueText={indeterminate ? labels[phase] : `${fileSize(Math.round(fraction * file.size))} of ${fileSize(file.size)} transferred`}
        className={reducedMotion ? indeterminate ? "[&>span]:animate-none [&>span]:start-[30%]" : "[&>span]:transition-none" : undefined} />}
    </div>
    <div className="ms-8 grid gap-3 @min-[28rem]/upload:grid-cols-[minmax(0,1fr)_auto] @min-[28rem]/upload:items-center">
      <div className="grid min-h-16 content-start gap-1">
        <Text as="p" variant="ui" className={failed ? "text-danger-foreground" : "text-foreground"}>{labels[phase]}</Text>
        <Text as="p" variant="caption" className="tabular-nums">{detail}</Text>
      </div>
      <div className="flex min-h-10 min-w-0 flex-wrap items-center justify-end gap-3">
        <Button ref={actionRef} nativeButton type="button" size="md" shape="square" tone={busy || complete ? "neutral" : "accent"} variant={busy || complete ? "ghost" : "outline"} loading={false} iconOnly={false}
          className={`${actionSurface} min-w-32`} disabled={session.disabled || busy || complete} focusableWhenDisabled={busy || complete} onClick={() => session.upload(item.id)}>
          {failed && <ArrowClockwise aria-hidden="true" className="pointer-events-none" />}<ButtonLabel>{failed ? "Retry" : complete ? "Uploaded" : phase === "processing" ? "Processing…" : phase === "finishing" ? "Finishing…" : busy ? "Uploading…" : "Upload file"}</ButtonLabel>
        </Button>
        <div className="size-10 shrink-0 pointer-coarse:size-11">
          {phase !== "processing" && <Tooltip>
            <TooltipTrigger render={<Button nativeButton type="button" size="md" shape="square" tone={busy ? "neutral" : "danger"} variant="ghost" loading={false} iconOnly={true}
              ref={recoveryRef} aria-label={busy ? "Cancel upload" : "Remove"} aria-describedby={headingId} disabled={!busy && session.disabled}
              onClick={() => { if (busy) { session.cancel(item.id); primary.current?.focus({ preventScroll: true }); } else onRemove(); }} />}>
              <X aria-hidden="true" className="pointer-events-none" />
            </TooltipTrigger>
            <TooltipPopup side="top" align="center" sideOffset={6} className="border-transparent shadow-upload forced-colors:border-[CanvasText] forced-colors:shadow-none">{busy ? "Cancel upload" : "Remove file"}</TooltipPopup>
          </Tooltip>}
        </div>
      </div>
    </div>
  </motion.li>;
}

export function UploadExample({ session, reducedMotion }: { session: UploadSession; reducedMotion: boolean }) {
  const feedbackId = useId();
  const picker = useRef<HTMLButtonElement>(null);
  const actionRefs = useRef(new Map<string, HTMLButtonElement>());
  function removeFile(id: string) {
    const index = session.items.findIndex(item => item.id === id);
    const neighbor = session.items[index + 1] ?? session.items[index - 1];
    const destination = neighbor ? actionRefs.current.get(neighbor.id) : picker.current;
    session.remove(id);
    destination?.focus({ preventScroll: true });
  }
  const systemReducedMotion = useReducedMotion();
  const reduced = reducedMotion || !!systemReducedMotion;
  const ready = session.items.filter(item => item.phase === "selected").length;
  const complete = session.items.filter(item => item.phase === "complete").length;
  const active = session.items.filter(item => isBusy(item.phase)).length;
  const errors = session.items.filter(item => item.phase.endsWith("error")).length;
  return <FileUpload multiple={true} accept=".pdf,.md,.txt,application/pdf,text/markdown,text/plain" disabled={session.disabled} invalid={!!session.error} onFilesSelected={session.select}
    className="[overflow-anchor:none] [--anaphor-button-press-scale:0.96] [--anaphor-focus:var(--anaphor-font-tertiary)]">
    <div className="@container/upload isolate">
      <Field orientation="vertical" invalid={!!session.error} disabled={session.disabled}>
        <FileUploadDropzone className="min-h-28 flex-row flex-wrap justify-start gap-4 rounded-lg p-4 text-start sm:p-5">
          <UploadSimple aria-hidden="true" className="pointer-events-none size-6 shrink-0 text-muted-foreground" />
          <Text as="p" variant="ui" className="min-w-24 flex-1 font-medium text-foreground">Drop files here</Text>
          <FileUploadTrigger ref={picker} className={actionSurface} size="md" shape="square" tone="accent" variant="solid" loading={false} iconOnly={false} aria-describedby={feedbackId} aria-invalid={!!session.error || undefined}>
            <ButtonLabel>{session.items.length ? "Add files" : "Choose files"}</ButtonLabel>
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FieldFeedback id={feedbackId} hint="PDF, Markdown, or plain text · 10 MB per file" error={session.error} invalid={!!session.error} />
      </Field>
      {session.items.length > 0 && <section className="mt-4 min-w-0" aria-label="File uploads">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2">
          <Text as="p" variant="caption" className="tabular-nums">{session.items.length} {session.items.length === 1 ? "file" : "files"} · {complete} complete{active > 0 ? ` · ${active} active` : ""}{errors > 0 ? ` · ${errors} ${errors === 1 ? "needs" : "need"} attention` : ""}</Text>
          <div className="min-h-10">{session.items.length > 1 && <Button nativeButton type="button" size="md" shape="square" tone="accent" variant="solid" loading={false} iconOnly={false} className={actionSurface} disabled={session.disabled || ready === 0} focusableWhenDisabled={ready === 0} onClick={session.uploadPending}><ButtonLabel>{ready > 0 ? `Upload ${ready} ${ready === 1 ? "file" : "files"}` : "Upload files"}</ButtonLabel></Button>}</div>
        </div>
        <ul className="mt-2 min-w-0" aria-label="Selected files">
          <AnimatePresence initial={false}>{session.items.map(item => <FileRow key={item.id} item={item} session={session} reducedMotion={reduced} actionRefs={actionRefs} onRemove={() => removeFile(item.id)} />)}</AnimatePresence>
        </ul>
      </section>}
      <footer className="mt-2 border-t border-border pt-4 [border-top-width:var(--anaphor-border-hairline)]"><Text as="p" variant="caption">You can add more files while uploads are running.</Text></footer>
    </div>
    <p className="sr-only" role="status" aria-atomic="true">{session.announcement}</p>
  </FileUpload>;
}
