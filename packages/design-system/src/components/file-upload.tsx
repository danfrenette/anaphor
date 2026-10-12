"use client";

import { createContext, useContext, useRef, useState, type ComponentProps } from "react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

type FileUploadProps = ComponentProps<"div"> & {
  accept?: string;
  multiple: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onFilesSelected: (files: File[]) => void;
};

type FileUploadContextValue = {
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  openPicker: () => void;
  select: (files: File[]) => void;
};

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

function useFileUpload() {
  const context = useContext(FileUploadContext);
  if (!context) throw new Error("FileUpload parts must be inside FileUpload");
  return context;
}

function FileUpload({ accept, children, disabled, invalid, multiple, onFilesSelected, ...props }: FileUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  function select(files: File[]) {
    if (!disabled && files.length) onFilesSelected(files);
  }
  return <FileUploadContext value={{ disabled, invalid, select, openPicker: () => {
    if (disabled || !input.current) return;
    input.current.value = "";
    input.current.click();
  } }}>
    <div {...props} data-slot="file-upload" data-disabled={disabled || undefined} data-invalid={invalid || undefined}>
      <input ref={input} type="file" accept={accept} multiple={multiple} disabled={disabled} hidden
        onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          select(files);
        }} />
      {children}
    </div>
  </FileUploadContext>;
}

type FileUploadDropzoneProps = ComponentProps<"div">;

function FileUploadDropzone({ className, onDragEnter, onDragOver, onDragLeave, onDrop, ...props }: FileUploadDropzoneProps) {
  const { disabled, invalid, select } = useFileUpload();
  const [drag, setDrag] = useState({ disabled, depth: 0 });
  if (drag.disabled !== disabled) setDrag({ disabled, depth: 0 });
  const dragging = drag.disabled === disabled && drag.depth > 0;
  return <div {...props} data-slot="file-upload-dropzone" data-dragging={dragging || undefined} data-disabled={disabled || undefined} data-invalid={invalid || undefined}
    className={cn(
      "flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted p-6 text-center",
      "motion-safe:transition-[border-color,background-color] motion-safe:duration-150",
      "data-dragging:border-solid data-dragging:border-ring data-dragging:bg-[color-mix(in_oklch,var(--anaphor-brand)_8%,var(--anaphor-background))]",
      "data-invalid:border-solid data-invalid:border-danger-foreground",
      "data-disabled:border-dotted data-disabled:border-[color-mix(in_oklch,var(--anaphor-input-border)_60%,var(--anaphor-background))] data-disabled:text-muted-foreground",
      "[&[data-disabled]_[data-slot=text]]:text-muted-foreground",
      "forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:data-disabled:border-[GrayText] forced-colors:data-dragging:outline-2 forced-colors:data-dragging:outline-[Highlight]",
      className,
    )}
    onDragEnter={event => {
      onDragEnter?.(event);
      event.preventDefault();
      if (disabled || !Array.from(event.dataTransfer.items).some(item => item.kind === "file")) return;
      setDrag(current => ({ disabled, depth: current.depth + 1 }));
    }}
    onDragOver={event => {
      onDragOver?.(event);
      event.preventDefault();
      event.dataTransfer.dropEffect = !disabled && Array.from(event.dataTransfer.items).some(item => item.kind === "file") ? "copy" : "none";
    }}
    onDragLeave={event => {
      onDragLeave?.(event);
      event.preventDefault();
      setDrag(current => ({ disabled, depth: Math.max(0, current.depth - 1) }));
    }}
    onDrop={event => {
      const canceled = event.defaultPrevented;
      onDrop?.(event);
      const handled = canceled || event.defaultPrevented;
      event.preventDefault();
      setDrag({ disabled, depth: 0 });
      if (!handled) select(Array.from(event.dataTransfer.files));
    }} />;
}

type FileUploadTriggerProps = Omit<Extract<ButtonProps, { nativeButton: true }>, "nativeButton" | "type">;

function FileUploadTrigger({ disabled, onClick, ...props }: FileUploadTriggerProps) {
  const context = useFileUpload();
  return <Button {...props} data-slot="file-upload-trigger" nativeButton type="button" disabled={context.disabled || disabled}
    onClick={event => {
      onClick?.(event);
      if (!event.defaultPrevented) context.openPicker();
    }} />;
}

type FileUploadProgressProps = ComponentProps<"div"> & {
  value: number | null;
  max: number;
  label: string;
  valueText?: string;
};

function FileUploadProgress({ value, max, label, valueText, className, ...props }: FileUploadProgressProps) {
  if (!Number.isFinite(max) || max <= 0) throw new RangeError("FileUploadProgress max must be positive and finite");
  if (value !== null && !Number.isFinite(value)) throw new RangeError("FileUploadProgress value must be finite or null");
  const measured = value === null ? null : Math.min(max, Math.max(0, value));
  return <div {...props} data-slot="file-upload-progress" data-indeterminate={measured === null || undefined} className={cn("relative h-1 overflow-hidden rounded-sm bg-border forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]", className)}>
    <progress className="sr-only" aria-label={label} aria-valuetext={valueText} value={measured ?? undefined} max={max} />
    <span aria-hidden="true" className={cn(
      "pointer-events-none absolute inset-y-0 start-0 select-none bg-primary forced-colors:bg-[Highlight] forced-colors:[forced-color-adjust:none]",
      measured === null ? "w-2/5 motion-safe:animate-[anaphor-upload-activity_1.25s_var(--anaphor-ease-in-out)_infinite] motion-reduce:start-[30%] rtl:[animation-name:anaphor-upload-activity-rtl]"
        : "w-full origin-left rtl:origin-right motion-safe:transition-transform motion-safe:duration-[var(--upload-duration,var(--anaphor-motion-duration-standard))] motion-safe:ease-[var(--upload-ease,var(--anaphor-ease-out))]",
    )} style={measured === null ? undefined : { transform: `scaleX(${measured / max})` }} />
  </div>;
}

export { FileUpload, FileUploadDropzone, FileUploadTrigger, FileUploadProgress, type FileUploadProps, type FileUploadDropzoneProps, type FileUploadTriggerProps, type FileUploadProgressProps };
