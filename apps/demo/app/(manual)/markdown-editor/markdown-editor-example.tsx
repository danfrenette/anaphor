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

export function MarkdownEditorExample() {
  const [markdown, setMarkdown] = useState(startingMarkdown);
  return <section aria-label="Field presentation" className="mt-8">
    <Text as="h2" variant="heading">Field presentation</Text>
    <Text as="p" variant="body" className="mt-3">Type Markdown and watch it format. Headings, lists, quotes, code, rules, emphasis, and links all convert as you type. Shift+Enter inserts a line break.</Text>
    <div className="mt-6">
      <MarkdownEditor defaultValue={startingMarkdown} onChange={setMarkdown} aria-label="Research note" />
    </div>
    <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
    <div role="group" aria-label="Current Markdown" className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{markdown}</div>
  </section>;
}
