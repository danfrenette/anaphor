import { createRef } from "react";
import { expectTypeOf } from "vitest";
import { MarkdownEditor, useMarkdownEditor, type MarkdownEditorHandle, type UseMarkdownEditorOptions } from "@anaphor/system";

const ref = createRef<MarkdownEditorHandle>();
<MarkdownEditor presentation="in-place" defaultValue="Note" aria-label="Research note" />;
// @ts-expect-error The presentation must be explicit.
<MarkdownEditor defaultValue="Note" aria-label="Research note" />;
// @ts-expect-error Only field and in-place presentations are supported.
<MarkdownEditor presentation="other" defaultValue="Note" aria-label="Research note" />;
<MarkdownEditor presentation="field" ref={ref} defaultValue="# Note" aria-label="Research note" onChange={markdown => expectTypeOf(markdown).toEqualTypeOf<string>()} />;
expectTypeOf(ref.current?.getMarkdown()).toEqualTypeOf<string | undefined>();
expectTypeOf(ref.current?.setMarkdown).toEqualTypeOf<((markdown: string) => void) | undefined>();
<MarkdownEditor presentation="field" defaultValue="Note" aria-labelledby="note-label" />;

// Field integration and state props are optional and compose with either label.
<MarkdownEditor presentation="field" defaultValue="Note" aria-labelledby="note-label" id="note-editor" aria-describedby="note-desc note-error" invalid readOnly placeholder="Write a note…" />;
<MarkdownEditor presentation="field" defaultValue="Note" aria-label="Research note" disabled autoFocus />;

// @ts-expect-error Starting Markdown is required for the uncontrolled editor.
<MarkdownEditor presentation="field" aria-label="Research note" />;
// @ts-expect-error An accessible name from either labelling prop is required.
<MarkdownEditor presentation="field" defaultValue="Note" />;
// @ts-expect-error The editor is uncontrolled and does not accept a controlled value.
<MarkdownEditor presentation="field" defaultValue="Note" value="Replacement" aria-label="Research note" />;
// @ts-expect-error Use either labelling prop, not both.
<MarkdownEditor presentation="field" defaultValue="Note" aria-label="Research note" aria-labelledby="note-label" />;

const options = { defaultValue: "# Note", "aria-label": "Research note", onChange: (markdown: string) => void markdown, placeholder: "Write…", readOnly: false, disabled: false, autoFocus: false, invalid: false, id: "note", "aria-describedby": "note-desc" } satisfies UseMarkdownEditorOptions;
function Consumer() {
  const { getMarkdown, setMarkdown } = useMarkdownEditor(options);
  expectTypeOf(getMarkdown()).toEqualTypeOf<string>();
  expectTypeOf(setMarkdown).toEqualTypeOf<(markdown: string) => void>();
  return null;
}
void Consumer;

function MissingHookLabel() {
  // @ts-expect-error The hook preserves the editor's accessible-name requirement.
  useMarkdownEditor({ defaultValue: "Note" });
  return null;
}
void MissingHookLabel;
