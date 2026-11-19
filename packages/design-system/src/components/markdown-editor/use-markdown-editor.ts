"use client";

import { useEditor, type Editor } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { cleanPastedHtml, handleMarkdownPaste } from "#lib/markdown-editor-paste";
import { splitFrontMatter } from "#lib/markdown-editor-tokenizers";
import { createEditorExtensions } from "./editor-extensions";
import { focusAtEnd, resetHistory, updatePlaceholder } from "./editor-utils";
import type { UseMarkdownEditorOptions } from "./types";
import { useImageFiles } from "./use-image-files";

type UseMarkdownEditorResult = {
  /**
   * Mounting/frame use only. `editor.getMarkdown()` is serializer-normalised and
   * not byte-stable before the first edit.
   */
  editor: Editor | null;
  /** Read Markdown only here: original bytes before any edit, serializer normal form afterwards. */
  getMarkdown: () => string;
  /** Replace the document from outside. Does not fire `onChange` and resets undo history. */
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
  const { frontMatter, body } = useMemo(() => splitFrontMatter(defaultValue), [defaultValue]);
  const frontMatterRef = useRef(frontMatter);
  const currentValue = useRef(defaultValue);
  const getMarkdown = useCallback(() => currentValue.current, []);

  const isReplacingRef = useRef(false);
  const pendingBodyRef = useRef<string | null>(null);
  const autofocusHandled = useRef(false);

  const { handleImageFiles, cancelPendingImages } = useImageFiles(onImageFile);

  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    editable: !readOnly && !disabled,
    autofocus: autoFocus ? "end" : false,
    extensions: createEditorExtensions(),
    content: body,
    contentType: "markdown",
    // Tiptap calls the latest render's handler, so a new `onChange` needs no ref.
    onUpdate: ({ editor }) => {
      if (isReplacingRef.current) return;

      const serializedBody = editor.getMarkdown();
      const currentFrontMatter = frontMatterRef.current;
      // A front-matter-only document ends without a newline on its closing `---`,
      // so the body must be separated with one to keep the block intact on reload.
      const needsSeparator =
        currentFrontMatter !== "" &&
        !currentFrontMatter.endsWith("\n") &&
        serializedBody !== "";
      currentValue.current = currentFrontMatter + (needsSeparator ? "\n" : "") + serializedBody;
      onChange?.(currentValue.current);
    },
    editorProps: {
      // Spec requirement (AC-1–5, AC-7): clean and classify pasted content.
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
        // State attributes live here, not on an imperative effect, so ProseMirror
        // re-applies them on every view update and toggling never drops them.
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(readOnly ? { "aria-readonly": "true" } : {}),
        ...(disabled ? { "aria-disabled": "true" } : {}),
        // Editable and read-only are focusable; disabled is removed from the tab
        // order. `tabindex` here wins over Tiptap's Tabindex extension.
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

  useEffect(() => {
    if (editor && autoFocus && !autofocusHandled.current) {
      autofocusHandled.current = true;
      if (readOnly && !disabled) focusAtEnd(editor);
    }
  }, [editor, autoFocus, readOnly, disabled]);

  // Replace the document without emitting an update, then clear undo history.
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
    // Until the next real edit, reading the value returns the replaced string
    // byte for byte, the same contract as `defaultValue`.
    currentValue.current = markdown;
    frontMatterRef.current = nextFrontMatter;
    if (editor) {
      replaceContent(nextBody, editor);
    } else {
      // Before the editor exists, remember the body and apply it on mount.
      pendingBodyRef.current = nextBody;
    }
  }, [editor, replaceContent, cancelPendingImages]);

  // A replacement requested before the editor mounted wins over the starting value.
  useEffect(() => {
    if (!editor || pendingBodyRef.current === null) return;

    const nextBody = pendingBodyRef.current;
    pendingBodyRef.current = null;
    replaceContent(nextBody, editor);
  }, [editor, replaceContent]);

  // Keep editable state in step with props after mount. `setEditable(…, false)`
  // skips the update event, so toggling state never fires `onChange` or flips
  // the pre-edit byte guarantee. The accessible attributes are declared in
  // `editorProps.attributes` above, so they survive view updates.
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

  // Task item checkboxes are real inputs that ProseMirror re-creates as the
  // document re-renders, so keep disabling them for as long as the editor is.
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
  type UseMarkdownEditorResult,
};
