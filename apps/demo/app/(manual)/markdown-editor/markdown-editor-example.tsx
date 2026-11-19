"use client";

import {
  Button,
  ButtonLabel,
  Field,
  FieldFeedback,
  FieldLabel,
  Input,
  MarkdownEditor,
  Text,
  type MarkdownEditorHandle,
} from "@anaphor/system";
import { useEffect, useRef, useState } from "react";

const startingMarkdown = [
  "## Field notes",
  "",
  "A paragraph with **bold** and *italic* text.",
  "",
  "This soft line",
  "wraps like rendered Markdown.",
  "",
  "- Bullet one",
  "- Bullet two",
  "  - Nested",
  "",
  "1. First",
  "2. Second",
  "",
  "> A quote",
  "",
  "~~strike~~, `code`, and a [link](https://anaphor.dev).",
  "",
  "```ts",
  "const x = 1;",
  "```",
  "",
  "---",
].join("\n");

const existingPostMarkdown = [
  "---",
  'title: "An existing post"',
  "draft: true",
  "---",
  "",
  "# An existing post",
  "",
  "A note with a footnote.[^1] and inline <kbd>Ctrl</kbd>.",
  "",
  "[^1]: The note text.",
  "",
  "<!-- A comment. -->",
  "",
  '<div class="aside">Raw HTML</div>',
  "",
  'import Button from "./button";',
  "",
  "export const width = 640;",
  "",
  '<Avatar user="alice" />',
  "",
  "<Card\n  title=\"Hello\"\n>\n  Body\n</Card>",
  "",
].join("\n");

const anotherNoteMarkdown = "## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->";

const tableMarkdown = "| Name | Value |\n| :--- | ---: |\n| Alpha | Beta |";

const markdownOutputClassName = "mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small";

export function MarkdownEditorExample() {
  const imageUrls = useRef<string[]>([]);

  useEffect(() => () => {
    imageUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const onImageFile = async (file: File) => {
    const src = URL.createObjectURL(file);
    imageUrls.current.push(src);
    return { src, alt: file.name };
  };

  const [markdown, setMarkdown] = useState(startingMarkdown);
  const [existingPost, setExistingPost] = useState(existingPostMarkdown);
  const [inPlaceNote, setInPlaceNote] = useState(anotherNoteMarkdown);
  const [tableNote, setTableNote] = useState(tableMarkdown);

  return (
    <>
      <section aria-label="Field presentation" className="mt-8">
        <Text as="h2" variant="heading">Field presentation</Text>
        <Text as="p" variant="body" className="mt-3">
          Type Markdown and watch it format. Headings, lists, quotes, code, rules, emphasis, and
          links all convert as you type. Shift+Enter inserts a line break.
        </Text>
        <Text as="p" variant="body" className="mt-3">
          Paste or drop an image to try an in-memory address. It lasts only while this page is open.
        </Text>
        <div className="mt-6">
          <MarkdownEditor
            presentation="field"
            defaultValue={startingMarkdown}
            onChange={setMarkdown}
            onImageFile={onImageFile}
            aria-label="Research note"
          />
        </div>
        <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
        <div role="group" aria-label="Current Markdown" className={markdownOutputClassName}>
          {markdown}
        </div>
      </section>
      <section aria-label="Existing post" className="mt-12">
        <Text as="h2" variant="heading">Existing post</Text>
        <Text as="p" variant="body" className="mt-3">
          Front matter stays out of sight, and raw HTML, footnotes, MDX import and export, and
          components appear as quiet read-only blocks of their source.
        </Text>
        <div className="mt-6">
          <MarkdownEditor
            presentation="field"
            defaultValue={existingPostMarkdown}
            onChange={setExistingPost}
            aria-label="Existing post"
          />
        </div>
        <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
        <div role="group" aria-label="Existing post Markdown" className={markdownOutputClassName}>
          {existingPost}
        </div>
      </section>
      <section aria-label="Field states" className="mt-12">
        <FieldStatesExample />
      </section>
      <section aria-label="In-place states" className="mt-12">
        <Text as="h2" variant="heading">In-place states</Text>
        <div className="mt-6">
          <MarkdownEditor
            presentation="in-place"
            defaultValue={anotherNoteMarkdown}
            onChange={setInPlaceNote}
            aria-label="In-place opaque note"
          />
        </div>
        <div role="group" aria-label="Space below the editor" className="h-8" />
        <div role="group" aria-label="In-place opaque Markdown" className="mt-3 whitespace-pre-wrap">
          {inPlaceNote}
        </div>
        <div className="mt-6">
          <MarkdownEditor
            presentation="in-place"
            defaultValue="Read-only in-place example"
            readOnly
            aria-label="Read-only in-place note"
          />
        </div>
      </section>
      <section aria-label="Table editing" className="mt-12">
        <Text as="h2" variant="heading">Table editing</Text>
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
        >
          <ButtonLabel>Before table</ButtonLabel>
        </Button>
        <MarkdownEditor
          presentation="field"
          defaultValue={tableMarkdown}
          onChange={setTableNote}
          aria-label="Table note"
        />
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
        >
          <ButtonLabel>After table</ButtonLabel>
        </Button>
        <div role="group" aria-label="Table Markdown" className="whitespace-pre-wrap">
          {tableNote}
        </div>
      </section>
    </>
  );
}

function FieldStatesExample() {
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [showReadOnlyAutofocus, setShowReadOnlyAutofocus] = useState(false);

  return (
    <>
      <Text as="h2" variant="heading">Inside a field</Text>
      <Text as="p" variant="body" className="mt-3">
        The same editor inside <code className="font-mono text-small">Field</code>, named by its
        label and associated with a description and error. The empty box shows the placeholder,
        which disappears on input. The field starts
        at <code className="font-mono text-small">6rem</code> and grows
        to <code className="font-mono text-small">18rem</code>, then scrolls.
      </Text>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
          aria-pressed={readOnly}
          className={readOnly ? "bg-muted" : ""}
          onClick={() => setReadOnly(value => !value)}
        >
          <ButtonLabel>Read-only</ButtonLabel>
        </Button>
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
          aria-pressed={disabled}
          className={disabled ? "bg-muted" : ""}
          onClick={() => setDisabled(value => !value)}
        >
          <ButtonLabel>Disabled</ButtonLabel>
        </Button>
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
          aria-pressed={invalid}
          className={invalid ? "bg-muted" : ""}
          onClick={() => setInvalid(value => !value)}
        >
          <ButtonLabel>Error</ButtonLabel>
        </Button>
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
          onClick={() => {
            editorRef.current?.setMarkdown(anotherNoteMarkdown);
            setMarkdown(anotherNoteMarkdown);
          }}
        >
          <ButtonLabel>Load another note</ButtonLabel>
        </Button>
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
          onClick={() => {
            editorRef.current?.setMarkdown("");
            setMarkdown("");
          }}
        >
          <ButtonLabel>Discard edits</ButtonLabel>
        </Button>
        <Button
          nativeButton
          type="button"
          variant="outline"
          tone="neutral"
          size="sm"
          shape="square"
          iconOnly={false}
          loading={false}
          onClick={() => setShowReadOnlyAutofocus(!showReadOnlyAutofocus)}
        >
          <ButtonLabel>Toggle autofocus example</ButtonLabel>
        </Button>
      </div>
      <div className="mt-6 max-w-2xl">
        <Input
          size="md"
          aria-label="Input comparison"
          aria-invalid={invalid || undefined}
          disabled={disabled}
          placeholder="Input comparison"
        />
      </div>
      {showReadOnlyAutofocus && (
        <div className="mt-6 max-w-2xl">
          <MarkdownEditor
            presentation="field"
            defaultValue="Read-only example"
            readOnly
            autoFocus
            aria-label="Read-only autofocus example"
          />
        </div>
      )}
      <div className="mt-6 max-w-2xl">
        <Field orientation="vertical" invalid={invalid}>
          <FieldLabel id="notes-label">Notes</FieldLabel>
          <MarkdownEditor
            presentation="field"
            ref={editorRef}
            defaultValue=""
            onChange={setMarkdown}
            aria-labelledby="notes-label"
            aria-describedby="notes-feedback"
            placeholder="Write a note…"
            readOnly={readOnly}
            disabled={disabled}
            invalid={invalid}
          />
          <FieldFeedback
            id="notes-feedback"
            hint="Markdown is fine here; use setMarkdown to load or discard a note."
            error="This note needs your attention before you save."
            invalid={invalid}
          />
        </Field>
      </div>
      <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
      <div role="group" aria-label="Field states Markdown" className={markdownOutputClassName}>
        {markdown}
      </div>
    </>
  );
}
