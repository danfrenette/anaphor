"use client";

import { Button, ButtonLabel, MarkdownEditor } from "@anaphor/system";
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
      <Button
        nativeButton
        type="button"
        variant="outline"
        tone="neutral"
        size="sm"
        shape="square"
        iconOnly={false}
        loading={false}
        disabled={!pending}
        onClick={() => {
          resolveImage.current?.();
          setPending(false);
        }}
      >
        <ButtonLabel>Complete upload</ButtonLabel>
      </Button>
      <div role="group" aria-label="Drop Markdown">{markdown}</div>
      <MarkdownEditor
        presentation="field"
        defaultValue=""
        aria-label="Placeholder fixture"
        placeholder={placeholder}
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
        onClick={() => setPlaceholder("Second placeholder")}
      >
        <ButtonLabel>Change placeholder</ButtonLabel>
      </Button>
    </>
  );
}
