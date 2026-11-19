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

/** Empty the editor's undo/redo history while leaving its document and selection intact. */
function resetHistory(editor: Editor): void {
  // Recreate the state from the current document so every plugin's state field,
  // including the history plugin's, is re-initialised. Undo and redo start empty.
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
  /** Resolve a pasted or dropped image file to an address and alt text. */
  onImageFile?: MarkdownEditorImageHandler;
  /** Shown in an empty editor; disappears on the first input. */
  placeholder?: string;
  /** Still focusable and selectable, but typing does nothing. */
  readOnly?: boolean;
  /** Not focusable and ignored by the pointer; styled with the input disabled tokens. */
  disabled?: boolean;
  /** Focus the editor on mount, with the caret at the end of the document. */
  autoFocus?: boolean;
  /** Marks the textbox invalid and applies the input's invalid border. */
  invalid?: boolean;
  /** The textbox element id, for external association. */
  id?: string;
  /** Ids of the description and error elements inside `Field`. */
  "aria-describedby"?: string;
} & MarkdownEditorLabel;

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
  // `defaultValue` is read once, like an uncontrolled input's.
  const [{ frontMatter, body }] = useState(() => splitFrontMatter(defaultValue));
  const frontMatterRef = useRef(frontMatter);
  const currentValue = useRef(defaultValue);
  const getMarkdown = useCallback(() => currentValue.current, []);

  const isReplacingRef = useRef(false);
  const pendingBodyRef = useRef<string | null>(null);

  const { handleImageFiles, cancelPendingImages } = useImageFiles(onImageFile);

  // Keeps the committed `onChange` for `onUpdate`. Tiptap swaps in each render's
  // options as it renders, so reading the prop there could call a handler from a
  // render React never commits. `useEffectEvent` can't be used: Tiptap calls
  // `onUpdate` outside effects.
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
    // Tiptap's `autofocus` only focuses an editable editor. Focus a read-only one
    // at the same moment: once, when the editor is created, like native `autofocus`.
    // Turning `autoFocus` on later does nothing.
    onCreate: ({ editor }) => {
      if (autoFocus && readOnly && !disabled) focusAtEnd(editor);
    },
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
      onChangeRef.current?.(currentValue.current);
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

  // Keep the placeholder extension's storage in step with the prop.
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      updatePlaceholder(editor, placeholder ?? "");
    }
  }, [editor, placeholder]);

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

  // A replacement requested before the editor mounted wins over the starting value,
  // so apply it as soon as the Tiptap editor exists.
  useEffect(() => {
    if (!editor || pendingBodyRef.current === null) return;

    const nextBody = pendingBodyRef.current;
    pendingBodyRef.current = null;
    replaceContent(nextBody, editor);
  }, [editor, replaceContent]);

  // Keep the Tiptap editor's editable state in step with props after mount.
  // `setEditable(…, false)` skips the update event, so toggling state never fires
  // `onChange` or flips the pre-edit byte guarantee. The accessible attributes are
  // declared in `editorProps.attributes` above, so they survive view updates.
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
  type UseMarkdownEditorOptions,
  type UseMarkdownEditorResult,
};
