"use client";

import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { cn } from "../lib/utils";

type MarkdownEditorLabel = { "aria-label": string; "aria-labelledby"?: never } | { "aria-label"?: never; "aria-labelledby": string };
type UseMarkdownEditorOptions = {
  defaultValue: string;
  onChange?: (markdown: string) => void;
} & MarkdownEditorLabel;
type UseMarkdownEditorResult = {
  /** Mounting/frame use only. `editor.getMarkdown()` is serializer-normalised and not byte-stable before the first edit. */
  editor: Editor | null;
  /** Read Markdown only here: original bytes before any edit, serializer normal form afterwards. */
  getMarkdown: () => string;
};
type MarkdownEditorHandle = { getMarkdown: () => string };
type MarkdownEditorProps = UseMarkdownEditorOptions & { ref?: Ref<MarkdownEditorHandle> };

function useMarkdownEditor({ defaultValue, onChange, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy }: UseMarkdownEditorOptions): UseMarkdownEditorResult {
  const currentValue = useRef(defaultValue);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const getMarkdown = useCallback(() => currentValue.current, []);
  const editor = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    extensions: [StarterKit.configure({
      // Disabled: underline has no CommonMark source and is not in the supported
      // set; trailingNode appends an extra empty paragraph after a document ending
      // in a non-paragraph block; dropcursor and gapcursor are drag/click-caret
      // affordances the field does not need.
      underline: false,
      trailingNode: false,
      dropcursor: false,
      gapcursor: false,
      // Links render as links but never open on click, never auto-link while
      // typing, and never link on paste. Clicking places the caret instead.
      link: { openOnClick: false, autolink: false, linkOnPaste: false },
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }), Markdown],
    content: defaultValue,
    contentType: "markdown",
    editorProps: { attributes: {
      class: "anaphor-prose outline-none",
      role: "textbox",
      "aria-multiline": "true",
      ...(ariaLabel === undefined ? { "aria-labelledby": ariaLabelledBy } : { "aria-label": ariaLabel }),
    } },
  });
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      currentValue.current = editor.getMarkdown();
      onChangeRef.current?.(currentValue.current);
    };
    editor.on("update", onUpdate);
    return () => { editor.off("update", onUpdate); };
  }, [editor]);
  return { editor, getMarkdown };
}

function MarkdownEditor({ ref, ...options }: MarkdownEditorProps) {
  const { editor, getMarkdown } = useMarkdownEditor(options);
  useImperativeHandle(ref, () => ({ getMarkdown }), [getMarkdown]);
  return <div data-slot="markdown-editor" className={cn(
    // Layout and surface
    "w-full min-w-0 rounded-control border border-border bg-background px-3.5 py-3",
    // Focus state
    "focus-within:border-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
    // Motion
    "motion-safe:transition-[border-color,background-color,outline-color] motion-safe:duration-150",
    // Forced colors
    "forced-colors:border-[ButtonText]",
  )}>
    <EditorContent editor={editor} />
  </div>;
}

export { MarkdownEditor, useMarkdownEditor, type MarkdownEditorHandle, type MarkdownEditorProps, type UseMarkdownEditorOptions, type UseMarkdownEditorResult };
