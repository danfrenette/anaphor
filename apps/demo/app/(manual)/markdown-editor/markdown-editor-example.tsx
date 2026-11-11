"use client";

import { MarkdownEditor, Text } from "@anaphor/system";
import { useState } from "react";

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
  return <>
    <section aria-label="Field presentation" className="mt-8">
      <Text as="h2" variant="heading">Field presentation</Text>
      <Text as="p" variant="body" className="mt-3">Type Markdown and watch it format. Headings, lists, quotes, code, rules, emphasis, and links all convert as you type. Shift+Enter inserts a line break.</Text>
      <div className="mt-6">
        <MarkdownEditor defaultValue={startingMarkdown} onChange={setMarkdown} aria-label="Research note" />
      </div>
      <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
      <div role="group" aria-label="Current Markdown" className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{markdown}</div>
    </section>
    <section aria-label="Existing post" className="mt-12">
      <Text as="h2" variant="heading">Existing post</Text>
      <Text as="p" variant="body" className="mt-3">Front matter stays out of sight, and raw HTML, footnotes, MDX import and export, and components appear as quiet read-only blocks of their source.</Text>
      <div className="mt-6">
        <MarkdownEditor defaultValue={existingPostMarkdown} onChange={setExistingPost} aria-label="Existing post" />
      </div>
      <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
      <div role="group" aria-label="Existing post Markdown" className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{existingPost}</div>
    </section>
  </>;
}
