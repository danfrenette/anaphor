"use client";

import { EditorState } from "@tiptap/pm/state";
import { useEditor, type Editor } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cleanPastedHtml, handleMarkdownPaste } from "#lib/markdown-editor-paste";
import { splitFrontMatter } from "#lib/markdown-editor-tokenizers";
import { createEditorExtensions } from "./editor-extensions";
import { focusAtEnd } from "./focus-at-end";
import type { MarkdownEditorImageHandler } from "./types";
import { useImageFiles } from "./use-image-files";

function updatePlaceholder(editor: Editor, placeholder: string) {
  editor.storage.placeholderText.placeholder = placeholder;
  editor.view.dispatch(editor.state.tr.setMeta("placeholderRefresh", true));
}

function resetHistory(editor: Editor): void {
  const state = editor.state;
  const nextState = EditorState.create({
    doc: state.doc,
    selection: state.selection,
    storedMarks: state.storedMarks,
    plugins: state.plugins,
  });
  editor.view.updateState(nextState);
}

type MarkdownEditorLabel =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };

type UseMarkdownEditorOptions = {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  onImageFile?: MarkdownEditorImageHandler;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-describedby"?: string;
} & MarkdownEditorLabel;

type UseMarkdownEditorResult = {
  editor: Editor | null;
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
};

function useMarkdownEditor({
  defaultValue,
  onChange,
  onImageFile,
  placeholder,
  readOnly = false,
  disabled = false,
  autoFocus = false,
  invalid = false,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: UseMarkdownEditorOptions): UseMarkdownEditorResult {
  const [{ frontMatter, body }] = useState(() => splitFrontMatter(defaultValue));
  const frontMatterRef = useRef(frontMatter);
  const currentValue = useRef(defaultValue);
  const getMarkdown = useCallback(() => currentValue.current, []);

  const isReplacingRef = useRef(false);
  const pendingBodyRef = useRef<string | null>(null);

  const { handleImageFiles, cancelPendingImages } = useImageFiles(onImageFile);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    editable: !readOnly && !disabled,
    autofocus: autoFocus ? "end" : false,
    extensions: createEditorExtensions(),
    content: body,
    contentType: "markdown",
    onCreate: ({ editor }) => {
      if (autoFocus && readOnly && !disabled) focusAtEnd(editor);
    },
    onUpdate: ({ editor }) => {
      if (isReplacingRef.current) return;

      const serializedBody = editor.getMarkdown();
      const currentFrontMatter = frontMatterRef.current;
      const needsSeparator =
        currentFrontMatter !== "" &&
        !currentFrontMatter.endsWith("\n") &&
        serializedBody !== "";
      currentValue.current = currentFrontMatter + (needsSeparator ? "\n" : "") + serializedBody;
      onChangeRef.current?.(currentValue.current);
    },
    editorProps: {
      transformPastedHTML: cleanPastedHtml,
      handleDOMEvents: {
        paste: (view, event) => handleImageFiles(editor, view, event, event.clipboardData?.files, false),
        drop: (view, event) => handleImageFiles(editor, view, event, event.dataTransfer?.files, true),
      },
      handlePaste: (view, event): boolean => handleMarkdownPaste(view, event, editor),
      attributes: {
        class: "anaphor-prose outline-none",
        role: "textbox",
        "aria-multiline": "true",
        ...(id !== undefined ? { id } : {}),
        ...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(readOnly ? { "aria-readonly": "true" } : {}),
        ...(disabled ? { "aria-disabled": "true" } : {}),
        ...(disabled ? {} : { tabindex: "0" }),
        ...(ariaLabel === undefined
          ? { "aria-labelledby": ariaLabelledBy }
          : { "aria-label": ariaLabel }),
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      updatePlaceholder(editor, placeholder ?? "");
    }
  }, [editor, placeholder]);

  const replaceContent = useCallback((nextBody: string, target: Editor) => {
    isReplacingRef.current = true;
    try {
      target.commands.setContent(nextBody, { contentType: "markdown" });
      resetHistory(target);
    } finally {
      isReplacingRef.current = false;
    }
  }, []);

  const setMarkdown = useCallback((markdown: string) => {
    if (editor?.isDestroyed) return;

    cancelPendingImages();
    const { frontMatter: nextFrontMatter, body: nextBody } = splitFrontMatter(markdown);
    currentValue.current = markdown;
    frontMatterRef.current = nextFrontMatter;
    if (editor) {
      replaceContent(nextBody, editor);
    } else {
      pendingBodyRef.current = nextBody;
    }
  }, [editor, replaceContent, cancelPendingImages]);

  useEffect(() => {
    if (!editor || pendingBodyRef.current === null) return;

    const nextBody = pendingBodyRef.current;
    pendingBodyRef.current = null;
    replaceContent(nextBody, editor);
  }, [editor, replaceContent]);

  useLayoutEffect(() => {
    if (!editor) return;

    if (readOnly || disabled) cancelPendingImages();
    if (
      disabled &&
      document.activeElement instanceof HTMLElement &&
      editor.view.dom.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }
    editor.setEditable(!readOnly && !disabled, false);
  }, [editor, readOnly, disabled, cancelPendingImages]);

  useLayoutEffect(() => {
    if (!editor || !disabled) return;

    const root = editor.view.dom;
    const checkboxSelector = 'li[data-checked] input[type="checkbox"]';
    const disableCheckboxes = () => {
      root.querySelectorAll<HTMLInputElement>(checkboxSelector).forEach(input => { input.disabled = true; });
    };
    disableCheckboxes();

    const observer = new MutationObserver(disableCheckboxes);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      root.querySelectorAll<HTMLInputElement>(checkboxSelector).forEach(input => { input.disabled = false; });
    };
  }, [editor, disabled]);

  return { editor, getMarkdown, setMarkdown };
}

export {
  useMarkdownEditor,
  type UseMarkdownEditorOptions,
  type UseMarkdownEditorResult,
};
