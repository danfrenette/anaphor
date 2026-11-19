"use client";

import { PluginKey, TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus";
import {
  useEffect,
  useEffectEvent,
  useId,
  useState,
  type RefObject,
} from "react";
import { cn } from "../../lib/utils";
import { popoverSurface } from "../popover";
import { FormattingButtons } from "./formatting-buttons";
import { LinkForm } from "./link-form";
import { useCoarsePointer } from "./use-coarse-pointer";
import { useLinkEditing } from "./use-link-editing";

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

type BubbleShortcutsOptions = {
  editor: Editor;
  bubbleRef: RefObject<HTMLDivElement | null>;
  pluginKey: PluginKey;
  onLinkShortcut: () => void;
};

// Mod-K and Alt-F10 open the bubble over a selection: Mod-K for URL editing,
// Alt-F10 to move focus to the first button.
function useBubbleShortcuts({
  editor,
  bubbleRef,
  pluginKey,
  onLinkShortcut,
}: BubbleShortcutsOptions) {
  const onShortcut = useEffectEvent((isLinkShortcut: boolean) => {
    const bubble = bubbleRef.current;
    const { state, view } = editor;
    const { from, to } = state.selection;
    if (!bubble || !shouldShowFormatting({ editor, element: bubble, view, state, from, to })) return;

    // Spec requirement (AC-5), Tiptap 3.33.0 override: the menu's debounce must
    // not delay keyboard access.
    view.dispatch(state.tr.setMeta(pluginKey, "show"));
    view.dispatch(view.state.tr.setMeta(pluginKey, "updatePosition"));

    // Spec requirement (AC-5): the link shortcut opens URL editing.
    if (isLinkShortcut) onLinkShortcut();
    else bubble.querySelector<HTMLButtonElement>("button")?.focus();
  });

  // Listens on the ProseMirror-owned editor element.
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

        onShortcut(isLinkShortcut);
      });
    };

    editor.view.dom.addEventListener("keydown", handleShortcutKeyDown);
    return () => editor.view.dom.removeEventListener("keydown", handleShortcutKeyDown);
  }, [editor]);
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
  const [selectionBubblePluginKey] = useState(() => new PluginKey("formattingBubble"));
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Created here, not in the form, so the URL field keeps its id when editing reopens.
  const linkFieldId = useId();

  const isCoarsePointer = useCoarsePointer();

  const link = useLinkEditing(editor, bubbleRef);

  useBubbleShortcuts({
    editor,
    bubbleRef,
    pluginKey: selectionBubblePluginKey,
    onLinkShortcut: link.open,
  });

  // Escape returns to the text; Home, End, and the arrow keys move between the
  // bubble's buttons, as in any toolbar.
  const handleBubbleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      link.close();
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
          link.close();
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
        {link.isEditing ? (
          <LinkForm
            id={linkFieldId}
            url={link.url}
            hasError={link.hasError}
            onUrlChange={link.changeUrl}
            onModalityChange={link.changeModality}
            onApply={link.apply}
            onRemove={link.remove}
          />
        ) : (
          <FormattingButtons
            editor={editor}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            openLink={link.open}
          />
        )}
      </div>
    </BubbleMenu>
  );
}

export {
  SelectionBubble,
};
