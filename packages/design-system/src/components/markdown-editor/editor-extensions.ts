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

function createEditorExtensions() {
  return [
    MarkdownStarterKit.configure({
      underline: false,
      trailingNode: false,
      dropcursor: false,
      codeBlock: false,
      link: false,
      listItem: false,
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
