"use client";

import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorState, PluginKey, Selection, TextSelection, type Transaction } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import { closeHistory } from "@tiptap/pm/history";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus";
import { TextB, TextItalic, TextStrikethrough, Code, Link as LinkIcon } from "@phosphor-icons/react/dist/ssr";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  CodeBlockGapCursor,
  MarkdownCodeBlock,
  MarkdownImage,
  MarkdownLink,
  MarkdownListItem,
  MarkdownOrderedList,
  MarkdownStarterKit,
  MarkdownTable,
  OpaqueBlock,
  OpaqueHtmlTokens,
  OpaqueInline,
  PlaceholderText,
} from "#lib/markdown-editor-extensions";
import { isSafePasteUri, normalizeLinkHref } from "#lib/markdown-editor-links";
import { cleanPastedHtml, handleMarkdownPaste, PasteOrdinal } from "#lib/markdown-editor-paste";
import { splitFrontMatter } from "#lib/markdown-editor-tokenizers";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Kbd, KbdGroup } from "./kbd";
import { Input } from "./input";
import { popoverSurface } from "./popover";
import { Tooltip, TooltipGroup, TooltipPopup, TooltipTrigger } from "./tooltip";

function updatePlaceholder(editor: Editor, placeholder: string) {
  editor.storage.placeholderText.placeholder = placeholder;
  editor.view.dispatch(editor.state.tr.setMeta("placeholderRefresh", true));
}

function focusAtEnd(editor: Editor) {
  const end = editor.state.doc.resolve(editor.state.doc.content.size);
  const last = editor.state.doc.lastChild;
  const needsGapCursor = last && (last.isAtom || last.type.name === "codeBlock");
  const selection = needsGapCursor ? new GapCursor(end) : Selection.atEnd(editor.state.doc);

  editor.view.dom.focus();
  editor.view.dispatch(editor.state.tr.setSelection(selection));

  if (!(selection instanceof GapCursor)) {
    const position = editor.view.domAtPos(selection.from);
    window.getSelection()?.collapse(position.node, position.offset);
  }
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

type MarkdownEditorImageHandler = (file: File) => Promise<{ src: string; alt: string }>;

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
  const { frontMatter, body } = useMemo(() => splitFrontMatter(defaultValue), [defaultValue]);
  const frontMatterRef = useRef(frontMatter);
  const currentValue = useRef(defaultValue);
  const onChangeRef = useRef(onChange);
  const imageHandlerRef = useRef(onImageFile);
  useLayoutEffect(() => { imageHandlerRef.current = onImageFile; }, [onImageFile]);
  const imageGeneration = useRef(0);
  const pendingImageCleanup = useRef(new Set<() => void>());
  const cancelPendingImages = useCallback(() => {
    imageGeneration.current++;
    for (const cleanup of pendingImageCleanup.current) cleanup();
  }, []);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const isReplacingRef = useRef(false);
  const pendingBodyRef = useRef<string | null>(null);
  const autofocusHandled = useRef(false);
  const getMarkdown = useCallback(() => currentValue.current, []);
  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    editable: !readOnly && !disabled,
    autofocus: autoFocus ? "end" : false,
    extensions: [
      MarkdownStarterKit.configure({
        // Underline has no CommonMark source and is not in the supported set.
        underline: false,
        // Appends an extra empty paragraph after a document ending in a
        // non-paragraph block.
        trailingNode: false,
        // A drag affordance the field does not need.
        dropcursor: false,
        // Replaced below by an .extend()ed copy whose renderer writes a fence long
        // enough for the content (F1).
        codeBlock: false,
        // Replaced below by an .extend()ed copy that escapes link destinations.
        // Links do not open on click or auto-link while typing; the paste adapter
        // handles safe URLs and selected-text linking.
        link: false,
        // Replaced below by an .extend()ed copy whose renderer keeps a leading code
        // block on the marker line (F4).
        listItem: false,
        // Replaced below by an .extend()ed copy whose tokenizer reads a code fence
        // that opens an ordered item as a code block (workaround 13).
        orderedList: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      CodeBlockGapCursor,
      MarkdownCodeBlock,
      MarkdownLink,
      MarkdownListItem,
      MarkdownOrderedList,
      PasteOrdinal,
      TaskList,
      TaskItem.configure({ nested: true }),
      MarkdownTable,
      TableRow,
      TableHeader,
      TableCell,
      // Spec requirement (AC-1, AC-2): Markdown images are inline content.
      MarkdownImage,
      OpaqueBlock,
      OpaqueHtmlTokens,
      OpaqueInline,
      Markdown,
      PlaceholderText,
      Placeholder.configure({
        placeholder: ({ editor }) => editor.storage.placeholderText.placeholder,
      }),
    ],
    content: body,
    contentType: "markdown",
    editorProps: {
      // Spec requirement (AC-1–5, AC-7): clean and classify pasted content.
      transformPastedHTML: cleanPastedHtml,
      handleDOMEvents: {
        paste: (view, event) => handleImageFiles(view, event, event.clipboardData?.files, false),
        drop: (view, event) => handleImageFiles(view, event, event.dataTransfer?.files, true),
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

  function handleImageFiles(
    view: Editor["view"],
    event: Event,
    files: FileList | undefined,
    drop: boolean,
  ): boolean {
    const images = Array.from(files ?? []).filter(file => file.type.startsWith("image/"));
    if (!images.length) {
      if (drop && files?.length) {
        event.preventDefault();
        return true;
      }
      return false;
    }

    event.preventDefault();
    const handler = imageHandlerRef.current;
    if (!handler || !editor || !editor.isEditable) return true;

    const position = drop && event instanceof MouseEvent
      ? view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
      : undefined;
    let from = position ?? view.state.selection.from;
    let to = position ?? view.state.selection.to;
    const generation = imageGeneration.current;

    const map = ({ transaction }: { transaction: Transaction }) => {
      from = transaction.mapping.map(from, 1);
      to = transaction.mapping.map(to, 1);
    };
    editor.on("transaction", map);
    const cleanup = () => {
      editor.off("transaction", map);
      pendingImageCleanup.current.delete(cleanup);
    };
    pendingImageCleanup.current.add(cleanup);

    const resolutions = images.map(file => Promise.resolve().then(() => handler(file)));
    void Promise.allSettled(resolutions).then(results => {
      cleanup();
      const isSuperseded = generation !== imageGeneration.current;
      if (editor.isDestroyed || !editor.isEditable || isSuperseded) return;

      const content = results.flatMap(result =>
        result.status === "fulfilled" ? [{ type: "image", attrs: result.value }] : [],
      );
      if (content.length) {
        // Spec requirement (handoff 346 decision 4): an asynchronously resolved
        // image is its own undo step.
        editor
          .chain()
          .command(({ tr }) => {
            closeHistory(tr);
            return true;
          })
          .insertContentAt({ from, to }, content)
          .run();
        editor.view.dispatch(closeHistory(editor.state.tr));
      }
    });

    return true;
  }

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

  // Abandon image inserts still resolving when the editor unmounts.
  useEffect(() => () => { cancelPendingImages(); }, [cancelPendingImages]);

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

  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      if (isReplacingRef.current) return;

      const serializedBody = editor.getMarkdown();
      const currentFrontMatter = frontMatterRef.current;
      // A front-matter-only document ends without a newline on its closing `---`,
      // so the body must be separated with one to keep the block intact on reload.
      const needsSeparator = currentFrontMatter !== "" && !currentFrontMatter.endsWith("\n") && serializedBody !== "";
      currentValue.current = currentFrontMatter + (needsSeparator ? "\n" : "") + serializedBody;
      onChangeRef.current?.(currentValue.current);
    };

    editor.on("update", onUpdate);
    return () => { editor.off("update", onUpdate); };
  }, [editor]);

  return { editor, getMarkdown, setMarkdown };
}

type FormattingButtonsProps = {
  editor: Editor;
  focused: number;
  setFocused: (index: number) => void;
  openLink: () => void;
};

function FormattingButtons({
  editor,
  focused,
  setFocused,
  openLink,
}: FormattingButtonsProps) {
  const [mac] = useState(() => (
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  ));
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  });

  const items = [
    { name: "Bold", key: "bold" as const, shortcut: "B", Icon: TextB, run: () => editor.chain().toggleBold().run() },
    { name: "Italic", key: "italic" as const, shortcut: "I", Icon: TextItalic, run: () => editor.chain().toggleItalic().run() },
    {
      name: "Strikethrough",
      key: "strike" as const,
      shortcut: "Shift+S",
      Icon: TextStrikethrough,
      run: () => editor.chain().toggleStrike().run(),
    },
    { name: "Inline code", key: "code" as const, shortcut: "E", Icon: Code, run: () => editor.chain().toggleCode().run() },
    { name: "Link", key: "link" as const, shortcut: "K", Icon: LinkIcon, run: openLink },
  ];

  return (
    <TooltipGroup>
      {items.map(({ name, key, shortcut, Icon, run }, index) => (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <Button
                nativeButton
                type="button"
                variant="ghost"
                tone="neutral"
                size="sm"
                shape="square"
                iconOnly
                loading={false}
                className="aria-pressed:bg-[var(--anaphor-input-disabled)]"
                aria-label={name}
                aria-pressed={active[key]}
                tabIndex={focused === index ? 0 : -1}
                onFocus={() => setFocused(index)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => { if (editor.isEditable) run(); }}
              >
                <Icon aria-hidden="true" />
              </Button>
            }
          />
          <TooltipPopup side="top" align="center" sideOffset={8}>
            {name}{" "}
            <KbdGroup aria-label={`${mac ? "Command" : "Control"} ${shortcut}`}>
              <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
              {shortcut.split("+").map(key => <Kbd key={key}>{key}</Kbd>)}
            </KbdGroup>
          </TooltipPopup>
        </Tooltip>
      ))}
    </TooltipGroup>
  );
}

type ShouldShowFormattingProps = Parameters<NonNullable<BubbleMenuProps["shouldShow"]>>[0];

function shouldShowFormatting({
  editor,
  element,
  view,
  state,
  from,
  to,
}: ShouldShowFormattingProps) {
  // Spec requirement (AC-1, AC-2), Tiptap 3.33.0 override: exclude node and cell
  // selections, and opaque or code content.
  if (
    !editor.isEditable ||
    !(state.selection instanceof TextSelection) ||
    state.selection.empty ||
    !(view.hasFocus() || element.contains(document.activeElement))
  ) {
    return false;
  }

  let excluded = false;
  state.doc.nodesBetween(from, to, node => {
    if (["codeBlock", "opaqueBlock", "opaqueInline"].includes(node.type.name)) excluded = true;
  });
  return !excluded && !!state.doc.textBetween(from, to);
}

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

  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleKey = useMemo(() => new PluginKey("formattingBubble"), []);
  const [focused, setFocused] = useState(0);

  const [coarsePointer, setCoarsePointer] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;

    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const [editingLink, setEditingLink] = useState(false);
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState(false);
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pointerLinkAction = useRef(false);
  const returnLinkFocus = useRef(false);

  useLayoutEffect(() => {
    if (editingLink) inputRef.current?.focus();
  }, [editingLink]);

  useLayoutEffect(() => {
    if (!editingLink && returnLinkFocus.current) {
      returnLinkFocus.current = false;
      bubbleRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Link"]')?.focus();
    }
  }, [editingLink]);

  const openLink = useCallback(() => {
    if (!editor?.isEditable) return;

    setUrl(editor.getAttributes("link").href ?? "");
    setLinkError(false);
    setEditingLink(true);
  }, [editor]);

  const finishLink = (remove: boolean) => {
    if (!editor?.isEditable) return;

    const value = url.trim();
    const host = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?(?::\d+)?(?:[/?#][^\s@\\]*)?$/i.test(value);
    const explicit = /^[a-z][a-z\d+.-]*:/i.test(value) && !host;
    const relative = /^(?:\.\.?\/|\/|#)/.test(value) || /^[^\s@\\:]+\/[^\s@\\]*$/.test(value);
    const isUnrecognisedForm = !explicit && !host && !relative;
    const hasStrayCharacter = !explicit && /[\s@\\]/.test(value);
    const destination = host ? `https://${value}` : value;
    const href = normalizeLinkHref(destination);
    if (
      !remove &&
      (
        !value ||
        !isSafePasteUri(destination) ||
        !isSafePasteUri(href) ||
        isUnrecognisedForm ||
        hasStrayCharacter
      )
    ) {
      setLinkError(true);
      return;
    }

    const chain = editor.chain().command(({ tr }) => {
      closeHistory(tr);
      return true;
    });
    if (remove) chain.unsetLink().run();
    else chain.setLink({ href }).run();
    editor.view.dispatch(closeHistory(editor.state.tr));

    returnLinkFocus.current = !pointerLinkAction.current;
    setEditingLink(false);
    if (pointerLinkAction.current) editor.view.focus();
  };

  useImperativeHandle(ref, () => ({ getMarkdown, setMarkdown }), [getMarkdown, setMarkdown]);

  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const linkShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const toolbarShortcut = event.altKey && event.key === "F10";
      if (!linkShortcut && !toolbarShortcut) return;

      const selection = window.getSelection();
      const hasSelectionInEditor =
        selection !== null &&
        !selection.isCollapsed &&
        editor.view.dom.contains(selection.anchorNode);
      if (!editor.isEditable || !hasSelectionInEditor) return;

      event.preventDefault();
      // The browser can dispatch the shortcut before ProseMirror reads selectionchange.
      document.dispatchEvent(new Event("selectionchange"));
      requestAnimationFrame(() => {
        if (editor.isDestroyed) return;

        const element = bubbleRef.current;
        const { state, view } = editor;
        const { from, to } = state.selection;
        if (!element || !shouldShowFormatting({ editor, element, view, state, from, to })) return;

        // Spec requirement (AC-5), Tiptap 3.33.0 override: the menu's debounce must
        // not delay keyboard access.
        view.dispatch(state.tr.setMeta(bubbleKey, "show"));
        view.dispatch(view.state.tr.setMeta(bubbleKey, "updatePosition"));

        // Spec requirement (AC-5): the link shortcut opens URL editing.
        if (linkShortcut) openLink();
        else element.querySelector<HTMLButtonElement>("button")?.focus();
      });
    };

    editor.view.dom.addEventListener("keydown", onKeyDown);
    return () => editor.view.dom.removeEventListener("keydown", onKeyDown);
  }, [editor, openLink, bubbleKey]);

  // A click on the frame's own surface (padding or the empty space below short
  // content) lands outside the editor content; place the caret at the end there.
  // Clicks inside the content are handled by ProseMirror itself, so opaque blocks
  // keep their own click and selection behaviour.
  const handleFrameClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !editor) return;

    const target = event.target;
    if (target instanceof globalThis.Node && bubbleRef.current?.contains(target)) return;
    if (target instanceof globalThis.Node && editor.view.dom.contains(target)) return;
    focusAtEnd(editor);
  };

  // Escape returns to the text; Home, End, and the arrow keys move between the
  // bubble's buttons, as in any toolbar.
  const handleBubbleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>, editor: Editor) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingLink(false);
      editor.view.focus();
      return;
    }

    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const index = buttons.findIndex(button => button === document.activeElement);
    if (index < 0) return;

    const next = event.key === "Home" ? 0
      : event.key === "End" ? buttons.length - 1
      : event.key === "ArrowRight" ? (index + 1) % buttons.length
      : event.key === "ArrowLeft" ? (index + buttons.length - 1) % buttons.length
      : -1;
    if (next >= 0) {
      event.preventDefault();
      buttons[next]?.focus();
    }
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
          // Layout and surface
          "w-full min-w-0 rounded-control border border-border bg-background px-3.5 py-3",
          // Field box: start small, grow to the maximum, then scroll.
          "min-h-[var(--anaphor-markdown-editor-min-height)] max-h-[var(--anaphor-markdown-editor-max-height)] overflow-y-auto",
          // Focus state
          "focus-within:border-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
          // Invalid state
          "data-invalid:border-danger data-invalid:focus-within:outline-danger",
          // Disabled state
          "data-disabled:pointer-events-none data-disabled:bg-[var(--anaphor-input-disabled)]",
          // Motion
          "motion-safe:transition-[border-color,background-color,outline-color] motion-safe:duration-150",
          // Forced colors
          "forced-colors:border-[ButtonText]",
        ),
      )}
      onClick={presentation === "field" ? handleFrameClick : undefined}
    >
      <EditorContent editor={editor} />
      {editor && !readOnly && !disabled && (
        <BubbleMenu
          ref={bubbleRef}
          pluginKey={bubbleKey}
          editor={editor}
          options={{
            // Decision 7, Tiptap 3.33.0/floating-ui override: fixed positioning escapes clipping.
            strategy: "fixed",
            // AC-8: coarse pointers prefer below.
            placement: coarsePointer ? "bottom" : "top",
            onHide: () => {
              setEditingLink(false);
              setFocused(0);
            },
            // The menu tabindex override preserves normal Tab order.
            onShow: () => {
              if (bubbleRef.current) bubbleRef.current.tabIndex = -1;
            },
          }}
          shouldShow={shouldShowFormatting}
        >
          <div
            data-slot="markdown-formatting-bubble"
            role="toolbar"
            aria-label="Formatting"
            className={cn("flex items-center", popoverSurface)}
            onBlur={event => {
              // Tiptap 3.33.0 workaround: dismiss when focus leaves the menu as well as the editor.
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                !editor.view.dom.contains(event.relatedTarget)
              ) {
                editor.view.dispatch(editor.state.tr.setMeta(bubbleKey, "hide"));
              }
            }}
            onKeyDownCapture={event => handleBubbleKeyDownCapture(event, editor)}
          >
            {editingLink ? (
              <form
                onPointerDownCapture={() => { pointerLinkAction.current = true; }}
                onKeyDownCapture={() => { pointerLinkAction.current = false; }}
                onSubmit={event => {
                  event.preventDefault();
                  finishLink(false);
                }}
              >
                <label id={`${errorId}-label`} htmlFor={`${errorId}-input`}>URL</label>
                <Input
                  ref={inputRef}
                  id={`${errorId}-input`}
                  size="sm"
                  aria-labelledby={`${errorId}-label`}
                  aria-invalid={linkError || undefined}
                  aria-describedby={linkError ? errorId : undefined}
                  value={url}
                  onChange={event => {
                    setUrl(event.target.value);
                    setLinkError(false);
                  }}
                />
                <Button
                  nativeButton
                  type="submit"
                  variant="ghost"
                  tone="neutral"
                  size="sm"
                  shape="square"
                  iconOnly={false}
                  loading={false}
                >
                  Apply
                </Button>
                {linkError && <span id={errorId}>Enter a safe URL.</span>}
                <Button
                  nativeButton
                  type="button"
                  variant="ghost"
                  tone="neutral"
                  size="sm"
                  shape="square"
                  iconOnly={false}
                  loading={false}
                  onClick={() => finishLink(true)}
                >
                  Remove link
                </Button>
              </form>
            ) : (
              <FormattingButtons
                editor={editor}
                focused={focused}
                setFocused={setFocused}
                openLink={openLink}
              />
            )}
          </div>
        </BubbleMenu>
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
