"use client";

import { EditorContent } from "@tiptap/react";
import {
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import { cn } from "../../lib/utils";
import { focusAtEnd } from "./focus-at-end";
import { SelectionBubble } from "./selection-bubble";
import type { MarkdownEditorImageHandler } from "./types";
import {
  useMarkdownEditor,
  type UseMarkdownEditorOptions,
  type UseMarkdownEditorResult,
} from "./use-markdown-editor";

type MarkdownEditorHandle = {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
};

type MarkdownEditorProps = UseMarkdownEditorOptions & {
  presentation: "field" | "in-place";
  ref?: Ref<MarkdownEditorHandle>;
};

function MarkdownEditor({ ref, presentation, ...options }: MarkdownEditorProps) {
  const { disabled = false, readOnly = false, invalid = false } = options;
  const { editor, getMarkdown, setMarkdown } = useMarkdownEditor(options);

  const selectionBubbleRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ getMarkdown, setMarkdown }), [getMarkdown, setMarkdown]);

  const handleFrameClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !editor) return;

    const target = event.target;
    if (target instanceof globalThis.Node && selectionBubbleRef.current?.contains(target)) return;
    if (target instanceof globalThis.Node && editor.view.dom.contains(target)) return;
    focusAtEnd(editor);
  };

  return (
    <div
      data-slot="markdown-editor"
      data-presentation={presentation}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        presentation === "in-place" && "min-w-0 data-disabled:pointer-events-none",
        presentation === "field" && cn(
          "w-full min-w-0 rounded-control border border-border bg-background px-3.5 py-3",
          "min-h-[var(--anaphor-markdown-editor-min-height)] max-h-[var(--anaphor-markdown-editor-max-height)] overflow-y-auto",
          "focus-within:border-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
          "data-invalid:border-danger data-invalid:focus-within:outline-danger",
          "data-disabled:pointer-events-none data-disabled:bg-[var(--anaphor-input-disabled)]",
          "motion-safe:transition-[border-color,background-color,outline-color] motion-safe:duration-150",
          "forced-colors:border-[ButtonText]",
        ),
      )}
      onClick={presentation === "field" ? handleFrameClick : undefined}
    >
      <EditorContent editor={editor} />
      {editor && (
        <SelectionBubble
          editor={editor}
          isEditable={!readOnly && !disabled}
          bubbleRef={selectionBubbleRef}
        />
      )}
    </div>
  );
}

export {
  MarkdownEditor,
  useMarkdownEditor,
  type MarkdownEditorHandle,
  type MarkdownEditorImageHandler,
  type MarkdownEditorProps,
  type UseMarkdownEditorOptions,
  type UseMarkdownEditorResult,
};
