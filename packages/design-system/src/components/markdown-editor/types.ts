type MarkdownEditorLabel =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };

type MarkdownEditorImageHandler = (file: File) => Promise<{ src: string; alt: string }>;

type UseMarkdownEditorOptions = {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  /** Resolve a pasted or dropped image file to an address and alt text. */
  onImageFile?: MarkdownEditorImageHandler;
  /** Shown in an empty editor; disappears on the first input. */
  placeholder?: string;
  /** Still focusable and selectable, but typing does nothing. */
  readOnly?: boolean;
  /** Not focusable and ignored by the pointer; styled with the input disabled tokens. */
  disabled?: boolean;
  /** Focus the editor on mount, with the caret at the end of the document. */
  autoFocus?: boolean;
  /** Marks the textbox invalid and applies the input's invalid border. */
  invalid?: boolean;
  /** The textbox element id, for external association. */
  id?: string;
  /** Ids of the description and error elements inside `Field`. */
  "aria-describedby"?: string;
} & MarkdownEditorLabel;

export type {
  MarkdownEditorImageHandler,
  UseMarkdownEditorOptions,
};
