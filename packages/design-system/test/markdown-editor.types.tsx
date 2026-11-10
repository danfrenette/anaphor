import { createRef } from "react";
import { expectTypeOf } from "vitest";
import { MarkdownEditor, useMarkdownEditor, type MarkdownEditorHandle, type UseMarkdownEditorOptions } from "@anaphor/system";

const ref = createRef<MarkdownEditorHandle>();
<MarkdownEditor ref={ref} defaultValue="# Note" aria-label="Research note" onChange={markdown => expectTypeOf(markdown).toEqualTypeOf<string>()} />;
expectTypeOf(ref.current?.getMarkdown()).toEqualTypeOf<string | undefined>();
<MarkdownEditor defaultValue="Note" aria-labelledby="note-label" />;

// @ts-expect-error Starting Markdown is required for the uncontrolled editor.
<MarkdownEditor aria-label="Research note" />;
// @ts-expect-error An accessible name from either labelling prop is required.
<MarkdownEditor defaultValue="Note" />;
// @ts-expect-error The editor is uncontrolled and does not accept a controlled value.
<MarkdownEditor defaultValue="Note" value="Replacement" aria-label="Research note" />;

const options = { defaultValue: "# Note", "aria-label": "Research note", onChange: (markdown: string) => void markdown } satisfies UseMarkdownEditorOptions;
function Consumer() {
  const { getMarkdown } = useMarkdownEditor(options);
  expectTypeOf(getMarkdown()).toEqualTypeOf<string>();
  return null;
}
void Consumer;

function MissingHookLabel() {
  // @ts-expect-error The hook preserves the editor's accessible-name requirement.
  useMarkdownEditor({ defaultValue: "Note" });
  return null;
}
void MissingHookLabel;
