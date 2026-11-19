import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  CodeBlockGapCursor,
  MarkdownCodeBlock,
  MarkdownImage,
  MarkdownLink,
  MarkdownListItem,
  MarkdownOrderedList,
  MarkdownStarterKit,
  MarkdownTable,
  OpaqueBlock,
  OpaqueHtmlTokens,
  OpaqueInline,
  PlaceholderText,
} from "#lib/markdown-editor-extensions";
import { PasteOrdinal } from "#lib/markdown-editor-paste";

/** The editor's schema and behaviour: the supported Markdown set and its adapters. */
function createEditorExtensions() {
  return [
    MarkdownStarterKit.configure({
      // Underline has no CommonMark source and is not in the supported set.
      underline: false,
      // Appends an extra empty paragraph after a document ending in a
      // non-paragraph block.
      trailingNode: false,
      // A drag affordance the field does not need.
      dropcursor: false,
      // Replaced below by an .extend()ed copy whose renderer writes a fence long
      // enough for the content (F1).
      codeBlock: false,
      // Replaced below by an .extend()ed copy that escapes link destinations.
      // Links do not open on click or auto-link while typing; the paste adapter
      // handles safe URLs and selected-text linking.
      link: false,
      // Replaced below by an .extend()ed copy whose renderer keeps a leading code
      // block on the marker line (F4).
      listItem: false,
      // Replaced below by an .extend()ed copy whose tokenizer reads a code fence
      // that opens an ordered item as a code block (workaround 13).
      orderedList: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    CodeBlockGapCursor,
    MarkdownCodeBlock,
    MarkdownLink,
    MarkdownListItem,
    MarkdownOrderedList,
    PasteOrdinal,
    TaskList,
    TaskItem.configure({ nested: true }),
    MarkdownTable,
    TableRow,
    TableHeader,
    TableCell,
    // Spec requirement (AC-1, AC-2): Markdown images are inline content.
    MarkdownImage,
    OpaqueBlock,
    OpaqueHtmlTokens,
    OpaqueInline,
    Markdown,
    PlaceholderText,
    Placeholder.configure({
      placeholder: ({ editor }) => editor.storage.placeholderText.placeholder,
    }),
  ];
}

export {
  createEditorExtensions,
};
