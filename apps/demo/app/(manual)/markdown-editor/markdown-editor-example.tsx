"use client";

import { MarkdownEditor, Text } from "@anaphor/system";
import { useState } from "react";

const startingMarkdown = "## Field notes\n\nA paragraph with **bold** and *italic* text.\n\nThis soft line\nwraps like rendered Markdown.";

export function MarkdownEditorExample() {
  const [markdown, setMarkdown] = useState(startingMarkdown);
  return <section aria-label="Field presentation" className="mt-8">
    <Text as="h2" variant="heading">Field presentation</Text>
    <Text as="p" variant="body" className="mt-3">Type paragraphs, headings, bold, and italic. Shift+Enter inserts a line break.</Text>
    <div className="mt-6">
      <MarkdownEditor defaultValue={startingMarkdown} onChange={setMarkdown} aria-label="Research note" />
    </div>
    <Text as="h3" variant="ui" className="mt-8 font-medium">Current Markdown</Text>
    <output aria-label="Current Markdown" className="mt-3 block min-h-24 whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 font-mono text-small">{markdown}</output>
  </section>;
}
