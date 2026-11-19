"use client";

import { closeHistory } from "@tiptap/pm/history";
import type { ChainedCommands, Editor } from "@tiptap/react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { isSafePasteUri, normalizeLinkHref } from "#lib/markdown-editor-links";
import { linkButtonName } from "./formatting-buttons";

/** The href a typed URL saves as, or `null` when the URL is not accepted. */
function parseLinkUrl(input: string): string | null {
  const url = input.trim();
  const isBareHost = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?(?::\d+)?(?:[/?#][^\s@\\]*)?$/i.test(url);
  const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/i.test(url) && !isBareHost;
  const isRelative = /^(?:\.\.?\/|\/|#)/.test(url) || /^[^\s@\\:]+\/[^\s@\\]*$/.test(url);
  const isUnrecognisedForm = !hasExplicitScheme && !isBareHost && !isRelative;
  const hasStrayCharacter = !hasExplicitScheme && /[\s@\\]/.test(url);
  const destination = isBareHost ? `https://${url}` : url;
  const href = normalizeLinkHref(destination);
  if (
    !url ||
    !isSafePasteUri(destination) ||
    !isSafePasteUri(href) ||
    isUnrecognisedForm ||
    hasStrayCharacter
  ) {
    return null;
  }

  return href;
}

/** Link editing in the selection bubble: the URL being typed, and applying or removing it. */
function useLinkEditing(editor: Editor, bubbleRef: RefObject<HTMLDivElement | null>) {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState("");
  const [hasError, setHasError] = useState(false);
  const pointerLinkAction = useRef(false);
  const returnLinkFocus = useRef(false);

  // After a keyboard apply or remove, focus the Link button in the same commit
  // that swaps it back in. A later focus is too late: Tiptap's passive effect
  // re-checks the bubble first, finds focus outside it, and hides it.
  useLayoutEffect(() => {
    if (!isEditing && returnLinkFocus.current) {
      returnLinkFocus.current = false;
      bubbleRef.current?.querySelector<HTMLButtonElement>(`button[aria-label="${linkButtonName}"]`)?.focus();
    }
  }, [isEditing, bubbleRef]);

  function open() {
    if (!editor.isEditable) return;

    setUrl(editor.getAttributes("link").href ?? "");
    setHasError(false);
    setIsEditing(true);
  }

  function close() {
    setIsEditing(false);
  }

  function changeUrl(nextUrl: string) {
    setUrl(nextUrl);
    setHasError(false);
  }

  // Whether the latest input in the form was a pointer or the keyboard.
  function changeModality(isPointerAction: boolean) {
    pointerLinkAction.current = isPointerAction;
  }

  // Each change is its own undo step. Focus returns to the text after a pointer
  // action, and to the Link button after a keyboard one.
  function commit(change: (chain: ChainedCommands) => ChainedCommands) {
    const chain = editor.chain().command(({ tr }) => {
      closeHistory(tr);
      return true;
    });
    change(chain).run();
    editor.view.dispatch(closeHistory(editor.state.tr));

    returnLinkFocus.current = !pointerLinkAction.current;
    setIsEditing(false);
    if (pointerLinkAction.current) editor.view.focus();
  }

  function apply() {
    if (!editor.isEditable) return;

    const href = parseLinkUrl(url);
    if (href === null) {
      setHasError(true);
      return;
    }
    commit(chain => chain.setLink({ href }));
  }

  function remove() {
    if (!editor.isEditable) return;

    commit(chain => chain.unsetLink());
  }

  return {
    isEditing,
    url,
    hasError,
    open,
    close,
    changeUrl,
    changeModality,
    apply,
    remove,
  };
}

export {
  useLinkEditing,
};
