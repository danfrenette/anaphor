"use client";

import { closeHistory } from "@tiptap/pm/history";
import type { Transaction } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import type { MarkdownEditorImageHandler } from "./types";

/**
 * Pasted and dropped image files: resolve each through the host's handler and
 * insert the results, unless the editor is locked, replaced or gone by then.
 */
function useImageFiles(onImageFile: MarkdownEditorImageHandler | undefined) {
  // ProseMirror's paste and drop handlers read the latest handler outside React
  // effects, where an Effect Event may not be called; hence a ref.
  const imageHandlerRef = useRef(onImageFile);
  useLayoutEffect(() => { imageHandlerRef.current = onImageFile; }, [onImageFile]);
  const imageGeneration = useRef(0);
  const pendingImageCleanup = useRef(new Set<() => void>());
  const cancelPendingImages = useCallback(() => {
    imageGeneration.current++;
    for (const cleanup of pendingImageCleanup.current) cleanup();
  }, []);

  // Abandon image inserts still resolving when the editor unmounts, releasing
  // their Tiptap transaction listeners.
  useEffect(() => () => { cancelPendingImages(); }, [cancelPendingImages]);

  function handleImageFiles(
    editor: Editor | null,
    view: Editor["view"],
    event: Event,
    files: FileList | undefined,
    isDrop: boolean,
  ): boolean {
    const images = Array.from(files ?? []).filter(file => file.type.startsWith("image/"));
    if (!images.length) {
      if (isDrop && files?.length) {
        event.preventDefault();
        return true;
      }
      return false;
    }

    event.preventDefault();
    const resolveImage = imageHandlerRef.current;
    if (!resolveImage || !editor || !editor.isEditable) return true;

    const dropPosition = isDrop && event instanceof MouseEvent
      ? view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
      : undefined;
    let from = dropPosition ?? view.state.selection.from;
    let to = dropPosition ?? view.state.selection.to;
    const generation = imageGeneration.current;

    const mapInsertionRange = ({ transaction }: { transaction: Transaction }) => {
      from = transaction.mapping.map(from, 1);
      to = transaction.mapping.map(to, 1);
    };
    editor.on("transaction", mapInsertionRange);
    const cleanup = () => {
      editor.off("transaction", mapInsertionRange);
      pendingImageCleanup.current.delete(cleanup);
    };
    pendingImageCleanup.current.add(cleanup);

    const resolutions = images.map(file => Promise.resolve().then(() => resolveImage(file)));
    void Promise.allSettled(resolutions).then(results => {
      cleanup();
      const isSuperseded = generation !== imageGeneration.current;
      if (editor.isDestroyed || !editor.isEditable || isSuperseded) return;

      const imageNodes = results.flatMap(result =>
        result.status === "fulfilled" ? [{ type: "image", attrs: result.value }] : [],
      );
      if (imageNodes.length) {
        // Spec requirement (handoff 346 decision 4): an asynchronously resolved
        // image is its own undo step.
        editor
          .chain()
          .command(({ tr }) => {
            closeHistory(tr);
            return true;
          })
          .insertContentAt({ from, to }, imageNodes)
          .run();
        editor.view.dispatch(closeHistory(editor.state.tr));
      }
    });

    return true;
  }

  return { handleImageFiles, cancelPendingImages };
}

export {
  useImageFiles,
};
