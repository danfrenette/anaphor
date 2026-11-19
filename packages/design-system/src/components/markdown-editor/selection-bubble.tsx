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

    view.dispatch(state.tr.setMeta(pluginKey, "show"));
    view.dispatch(view.state.tr.setMeta(pluginKey, "updatePosition"));

    if (isLinkShortcut) onLinkShortcut();
    else bubble.querySelector<HTMLButtonElement>("button")?.focus();
  });

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
  isEditable: boolean;
  bubbleRef: RefObject<HTMLDivElement | null>;
};

function SelectionBubble({
  editor,
  isEditable,
  bubbleRef,
}: SelectionBubbleProps) {
  const [selectionBubblePluginKey] = useState(() => new PluginKey("formattingBubble"));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const linkFieldId = useId();

  const isCoarsePointer = useCoarsePointer();

  const link = useLinkEditing(editor, bubbleRef);

  useBubbleShortcuts({
    editor,
    bubbleRef,
    pluginKey: selectionBubblePluginKey,
    onLinkShortcut: link.open,
  });

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
        strategy: "fixed",
        placement: isCoarsePointer ? "bottom" : "top",
        onHide: () => {
          link.close();
          setFocusedIndex(0);
        },
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
