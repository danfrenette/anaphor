import { GapCursor } from "@tiptap/pm/gapcursor";
import { EditorState, Selection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

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

export {
  focusAtEnd,
  resetHistory,
  updatePlaceholder,
};
