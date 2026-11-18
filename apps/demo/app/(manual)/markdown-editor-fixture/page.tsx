"use client";

import { MarkdownEditor } from "@anaphor/system";
import { useRef, useState } from "react";

// Fixtures for e2e/markdown-editor.spec.ts: an upload the test completes on demand,
// for the positioned-drop regression, and a placeholder that changes after mount.
export default function MarkdownEditorFixture() {
  const resolveImage = useRef<(() => void) | null>(null);
  const [pending, setPending] = useState(false);
  const [markdown, setMarkdown] = useState("abcd");

  const [placeholder, setPlaceholder] = useState("First placeholder");

  return (
    <>
      <MarkdownEditor
        presentation="field"
        defaultValue="abcd"
        aria-label="Drop fixture"
        onChange={setMarkdown}
        onImageFile={file => new Promise(resolve => {
          resolveImage.current = () => resolve({ src: "/icon.svg", alt: file.name });
          setPending(true);
        })}
      />
      <button
        type="button"
        disabled={!pending}
        onClick={() => {
          resolveImage.current?.();
          setPending(false);
        }}
      >
        Complete upload
      </button>
      <div role="group" aria-label="Drop Markdown">{markdown}</div>
      <MarkdownEditor
        presentation="field"
        defaultValue=""
        aria-label="Placeholder fixture"
        placeholder={placeholder}
      />
      <button type="button" onClick={() => setPlaceholder("Second placeholder")}>Change placeholder</button>
    </>
  );
}
