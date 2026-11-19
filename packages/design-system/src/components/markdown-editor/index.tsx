"use client";

import { PluginKey, TextSelection } from "@tiptap/pm/state";
import { closeHistory } from "@tiptap/pm/history";
import { EditorContent, useEditorState, type Editor } from "@tiptap/react";
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
import { isSafePasteUri, normalizeLinkHref } from "#lib/markdown-editor-links";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Kbd, KbdGroup } from "../kbd";
import { Input } from "../input";
import { popoverSurface } from "../popover";
import { Tooltip, TooltipGroup, TooltipPopup, TooltipTrigger } from "../tooltip";
import { focusAtEnd } from "./editor-utils";
import type { MarkdownEditorImageHandler, UseMarkdownEditorOptions } from "./types";
import { useMarkdownEditor, type UseMarkdownEditorResult } from "./use-markdown-editor";

type FormattingButtonsProps = {
  editor: Editor;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  openLink: () => void;
};

function FormattingButtons({
  editor,
  focusedIndex,
  setFocusedIndex,
  openLink,
}: FormattingButtonsProps) {
  const [isMac] = useState(() => (
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  ));
  const activeMarks = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  });

  const formats = [
    { name: "Bold", key: "bold" as const, shortcut: "B", Icon: TextB, run: () => editor.chain().toggleBold().run() },
    { name: "Italic", key: "italic" as const, shortcut: "I", Icon: TextItalic, run: () => editor.chain().toggleItalic().run() },
    { name: "Strikethrough", key: "strike" as const, shortcut: "Shift+S", Icon: TextStrikethrough, run: () => editor.chain().toggleStrike().run() },
    { name: "Inline code", key: "code" as const, shortcut: "E", Icon: Code, run: () => editor.chain().toggleCode().run() },
    { name: "Link", key: "link" as const, shortcut: "K", Icon: LinkIcon, run: openLink },
  ];

  return (
    <TooltipGroup>
      {formats.map(({ name, key, shortcut, Icon, run }, index) => (
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
                aria-pressed={activeMarks[key]}
                tabIndex={focusedIndex === index ? 0 : -1}
                onFocus={() => setFocusedIndex(index)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => { if (editor.isEditable) run(); }}
              >
                <Icon aria-hidden="true" />
              </Button>
            }
          />
          <TooltipPopup side="top" align="center" sideOffset={8}>
            {name}{" "}
            <KbdGroup aria-label={`${isMac ? "Command" : "Control"} ${shortcut}`}>
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              {shortcut.split("+").map(keyName => <Kbd key={keyName}>{keyName}</Kbd>)}
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

  let hasExcludedContent = false;
  state.doc.nodesBetween(from, to, node => {
    if (["codeBlock", "opaqueBlock", "opaqueInline"].includes(node.type.name)) hasExcludedContent = true;
  });
  return !hasExcludedContent && !!state.doc.textBetween(from, to);
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

  const selectionBubbleRef = useRef<HTMLDivElement>(null);
  const selectionBubblePluginKey = useMemo(() => new PluginKey("formattingBubble"), []);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;

    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const syncCoarsePointer = () => setIsCoarsePointer(coarsePointerQuery.matches);
    syncCoarsePointer();
    coarsePointerQuery.addEventListener("change", syncCoarsePointer);
    return () => coarsePointerQuery.removeEventListener("change", syncCoarsePointer);
  }, []);

  const [editingLink, setEditingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState(false);
  const linkErrorId = useId();
  const linkInputRef = useRef<HTMLInputElement>(null);
  const pointerLinkAction = useRef(false);
  const returnLinkFocus = useRef(false);

  useLayoutEffect(() => {
    if (editingLink) linkInputRef.current?.focus();
  }, [editingLink]);

  useLayoutEffect(() => {
    if (!editingLink && returnLinkFocus.current) {
      returnLinkFocus.current = false;
      selectionBubbleRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Link"]')?.focus();
    }
  }, [editingLink]);

  const openLink = useCallback(() => {
    if (!editor?.isEditable) return;

    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkError(false);
    setEditingLink(true);
  }, [editor]);

  const finishLink = (remove: boolean) => {
    if (!editor?.isEditable) return;

    const url = linkUrl.trim();
    const isBareHost = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?(?::\d+)?(?:[/?#][^\s@\\]*)?$/i.test(url);
    const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/i.test(url) && !isBareHost;
    const isRelative = /^(?:\.\.?\/|\/|#)/.test(url) || /^[^\s@\\:]+\/[^\s@\\]*$/.test(url);
    const isUnrecognisedForm = !hasExplicitScheme && !isBareHost && !isRelative;
    const hasStrayCharacter = !hasExplicitScheme && /[\s@\\]/.test(url);
    const destination = isBareHost ? `https://${url}` : url;
    const href = normalizeLinkHref(destination);
    if (
      !remove &&
      (
        !url ||
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

    const handleShortcutKeyDown = (event: KeyboardEvent) => {
      const isLinkShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isToolbarShortcut = event.altKey && event.key === "F10";
      if (!isLinkShortcut && !isToolbarShortcut) return;

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

        const bubble = selectionBubbleRef.current;
        const { state, view } = editor;
        const { from, to } = state.selection;
        if (!bubble || !shouldShowFormatting({ editor, element: bubble, view, state, from, to })) return;

        // Spec requirement (AC-5), Tiptap 3.33.0 override: the menu's debounce must
        // not delay keyboard access.
        view.dispatch(state.tr.setMeta(selectionBubblePluginKey, "show"));
        view.dispatch(view.state.tr.setMeta(selectionBubblePluginKey, "updatePosition"));

        // Spec requirement (AC-5): the link shortcut opens URL editing.
        if (isLinkShortcut) openLink();
        else bubble.querySelector<HTMLButtonElement>("button")?.focus();
      });
    };

    editor.view.dom.addEventListener("keydown", handleShortcutKeyDown);
    return () => editor.view.dom.removeEventListener("keydown", handleShortcutKeyDown);
  }, [editor, openLink, selectionBubblePluginKey]);

  // A click on the frame's own surface (padding or the empty space below short
  // content) lands outside the editor content; place the caret at the end there.
  // Clicks inside the content are handled by ProseMirror itself, so opaque blocks
  // keep their own click and selection behaviour.
  const handleFrameClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !editor) return;

    const target = event.target;
    if (target instanceof globalThis.Node && selectionBubbleRef.current?.contains(target)) return;
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
    const currentIndex = buttons.findIndex(button => button === document.activeElement);
    if (currentIndex < 0) return;

    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? buttons.length - 1
      : event.key === "ArrowRight" ? (currentIndex + 1) % buttons.length
      : event.key === "ArrowLeft" ? (currentIndex + buttons.length - 1) % buttons.length
      : -1;
    if (nextIndex >= 0) {
      event.preventDefault();
      buttons[nextIndex]?.focus();
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
          ref={selectionBubbleRef}
          pluginKey={selectionBubblePluginKey}
          editor={editor}
          options={{
            // Decision 7, Tiptap 3.33.0/floating-ui override: fixed positioning escapes clipping.
            strategy: "fixed",
            // AC-8: coarse pointers prefer below.
            placement: isCoarsePointer ? "bottom" : "top",
            onHide: () => {
              setEditingLink(false);
              setFocusedIndex(0);
            },
            // The menu tabindex override preserves normal Tab order.
            onShow: () => {
              if (selectionBubbleRef.current) selectionBubbleRef.current.tabIndex = -1;
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
                editor.view.dispatch(editor.state.tr.setMeta(selectionBubblePluginKey, "hide"));
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
                <label id={`${linkErrorId}-label`} htmlFor={`${linkErrorId}-input`}>URL</label>
                <Input
                  ref={linkInputRef}
                  id={`${linkErrorId}-input`}
                  size="sm"
                  aria-labelledby={`${linkErrorId}-label`}
                  aria-invalid={linkError || undefined}
                  aria-describedby={linkError ? linkErrorId : undefined}
                  value={linkUrl}
                  onChange={event => {
                    setLinkUrl(event.target.value);
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
                {linkError && <span id={linkErrorId}>Enter a safe URL.</span>}
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
                focusedIndex={focusedIndex}
                setFocusedIndex={setFocusedIndex}
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
