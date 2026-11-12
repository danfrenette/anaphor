"use client";

import { Field, FieldFeedback, FieldLabel, Input, MarkdownEditor, Text, type MarkdownEditorHandle } from "@anaphor/system";
import { useRef, useState } from "react";

// Source of truth for e2e/markdown-editor.spec.ts, which locates its constructs
// ("Field notes", "Bullet one", "A quote", "const x = 1;"). Rename a label only
// together with that spec; the unit fixture in markdown-editor.test.tsx is a
// separate near-duplicate.
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

// Source of truth for the opaque-block checks in e2e/markdown-editor.spec.ts,
// which locate "An existing post", "The note text.", and the opaque blocks.
// Rename only together with that spec.
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

export function MarkdownEditorExample() {
  const [markdown, setMarkdown] = useState(startingMarkdown);
  const [existingPost, setExistingPost] = useState(existingPostMarkdown);
  const [inPlaceNote, setInPlaceNote] = useState(otherNote);
  return <>
    <section aria-label="Field presentation" className="mt-8">
      <Text as="h2" variant="heading">Field presentation</Text>
      <Text as="p" variant="body" className="mt-3">Type Markdown and watch it format. Headings, lists, quotes, code, rules, emphasis, and links all convert as you type. Shift+Enter inserts a line break.</Text>
      <div className="mt-6">
        <MarkdownEditor presentation="field" defaultValue={startingMarkdown} onChange={setMarkdown} aria-label="Research note" />
      </div>
      <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
      <div role="group" aria-label="Current Markdown" className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{markdown}</div>
    </section>
    <section aria-label="Existing post" className="mt-12">
      <Text as="h2" variant="heading">Existing post</Text>
      <Text as="p" variant="body" className="mt-3">Front matter stays out of sight, and raw HTML, footnotes, MDX import and export, and components appear as quiet read-only blocks of their source.</Text>
      <div className="mt-6">
        <MarkdownEditor presentation="field" defaultValue={existingPostMarkdown} onChange={setExistingPost} aria-label="Existing post" />
      </div>
      <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
      <div role="group" aria-label="Existing post Markdown" className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{existingPost}</div>
    </section>
    <section aria-label="Field states" className="mt-12">
      <FieldStatesExample />
    </section>
    <section aria-label="In-place states" className="mt-12">
      <Text as="h2" variant="heading">In-place states</Text>
      <div className="mt-6"><MarkdownEditor presentation="in-place" defaultValue={otherNote} onChange={setInPlaceNote} aria-label="In-place opaque note" /></div>
      <Text as="p" variant="body" className="mt-8">Space below the editor</Text>
      <div role="group" aria-label="In-place opaque Markdown" className="mt-3 whitespace-pre-wrap">{inPlaceNote}</div>
      <div className="mt-6"><MarkdownEditor presentation="in-place" defaultValue="Read-only in-place example" readOnly aria-label="Read-only in-place note" /></div>
    </section>
  </>;
}

const otherNote = "## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->";

// Demonstrates the field inside Anaphor's Field: label, description, error,
// placeholder, read-only and disabled toggles, and imperative replace.
function FieldStatesExample() {
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [showReadOnlyAutofocus, setShowReadOnlyAutofocus] = useState(false);
  return <>
    <Text as="h2" variant="heading">Inside a field</Text>
    <Text as="p" variant="body" className="mt-3">The same editor inside <code className="font-mono text-small">Field</code>, named by its label and associated with a description and error. The empty box shows the placeholder, which disappears on input. The field starts at <code className="font-mono text-small">6rem</code> and grows to <code className="font-mono text-small">18rem</code>, then scrolls.</Text>
    <div className="mt-6 flex flex-wrap gap-2">
      <ToggleButton pressed={readOnly} onToggle={setReadOnly}>Read-only</ToggleButton>
      <ToggleButton pressed={disabled} onToggle={setDisabled}>Disabled</ToggleButton>
      <ToggleButton pressed={invalid} onToggle={setInvalid}>Error</ToggleButton>
      <button type="button" className="rounded-md border border-border px-3 py-1.5 text-ui hover:bg-muted" onClick={() => { editorRef.current?.setMarkdown(otherNote); setMarkdown(otherNote); }}>Load another note</button>
      <button type="button" className="rounded-md border border-border px-3 py-1.5 text-ui hover:bg-muted" onClick={() => { editorRef.current?.setMarkdown(""); setMarkdown(""); }}>Discard edits</button>
      <button type="button" className="rounded-md border border-border px-3 py-1.5 text-ui hover:bg-muted" onClick={() => setShowReadOnlyAutofocus(!showReadOnlyAutofocus)}>Toggle autofocus example</button>
    </div>
    <div className="mt-6 max-w-2xl">
      <Input size="md" aria-label="Input comparison" aria-invalid={invalid || undefined} disabled={disabled} placeholder="Input comparison" />
    </div>
    {showReadOnlyAutofocus && <div className="mt-6 max-w-2xl"><MarkdownEditor presentation="field" defaultValue="Read-only example" readOnly autoFocus aria-label="Read-only autofocus example" /></div>}
    <div className="mt-6 max-w-2xl">
      <Field orientation="vertical" invalid={invalid}>
        <FieldLabel id="notes-label">Notes</FieldLabel>
        <MarkdownEditor presentation="field"
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
        <FieldFeedback id="notes-feedback" hint="Markdown is fine here; use setMarkdown to load or discard a note." error="This note needs your attention before you save." invalid={invalid} />
      </Field>
    </div>
    <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
    <div role="group" aria-label="Field states Markdown" className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{markdown}</div>
  </>;
}

function ToggleButton({ pressed, onToggle, children }: { pressed: boolean; onToggle: (next: boolean) => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`rounded-md border px-3 py-1.5 text-ui ${pressed ? "border-ring bg-muted" : "border-border hover:bg-muted"}`}
      onClick={() => onToggle(!pressed)}
    >{children}</button>
  );
}
