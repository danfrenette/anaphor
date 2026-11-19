"use client";

import { closeHistory } from "@tiptap/pm/history";
import { PluginKey, TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { isSafePasteUri, normalizeLinkHref } from "#lib/markdown-editor-links";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Input } from "../input";
import { popoverSurface } from "../popover";
import { FormattingButtons } from "./formatting-buttons";
import { useCoarsePointer } from "./use-coarse-pointer";

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

type SelectionBubbleProps = {
  editor: Editor;
  /** False while read-only or disabled: the bubble is not rendered, but its state is kept. */
  isEditable: boolean;
  /** The bubble's element; the frame also reads it to ignore clicks inside the bubble. */
  bubbleRef: RefObject<HTMLDivElement | null>;
};

/** The selection bubble: mark buttons for selected text, and the link URL form. */
function SelectionBubble({
  editor,
  isEditable,
  bubbleRef,
}: SelectionBubbleProps) {
  const selectionBubblePluginKey = useMemo(() => new PluginKey("formattingBubble"), []);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const isCoarsePointer = useCoarsePointer();

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
      bubbleRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Link"]')?.focus();
    }
  }, [editingLink, bubbleRef]);

  const openLink = useCallback(() => {
    if (!editor.isEditable) return;

    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkError(false);
    setEditingLink(true);
  }, [editor]);

  const finishLink = (remove: boolean) => {
    if (!editor.isEditable) return;

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

  useEffect(() => {
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

        const bubble = bubbleRef.current;
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
  }, [editor, openLink, selectionBubblePluginKey, bubbleRef]);

  // Escape returns to the text; Home, End, and the arrow keys move between the
  // bubble's buttons, as in any toolbar.
  const handleBubbleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  if (!isEditable) return null;

  return (
    <BubbleMenu
      ref={bubbleRef}
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
            editor.view.dispatch(editor.state.tr.setMeta(selectionBubblePluginKey, "hide"));
          }
        }}
        onKeyDownCapture={handleBubbleKeyDownCapture}
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
  );
}

export {
  SelectionBubble,
};
