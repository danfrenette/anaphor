import { GapCursor } from "@tiptap/pm/gapcursor";
import { Selection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

/** Focus the editor with the caret at the end, or a gap cursor after a final atom or code block. */
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

export {
  focusAtEnd,
};
