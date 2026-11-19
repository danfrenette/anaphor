"use client";

import { TextB, TextItalic, TextStrikethrough, Code, Link as LinkIcon } from "@phosphor-icons/react/dist/ssr";
import { useEditorState, type Editor } from "@tiptap/react";
import { useState } from "react";
import { Button } from "../button";
import { Kbd, KbdGroup } from "../kbd";
import { Tooltip, TooltipGroup, TooltipPopup, TooltipTrigger } from "../tooltip";

const linkButtonName = "Link";

type FormattingButtonsProps = {
  editor: Editor;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  openLink: () => void;
};

function FormattingButtons({
  editor,
  focusedIndex,
  setFocusedIndex,
  openLink,
}: FormattingButtonsProps) {
  const [isMac] = useState(() => (
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  ));
  const activeMarks = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  });

  const formats = [
    { name: "Bold", key: "bold" as const, shortcut: "B", Icon: TextB, run: () => editor.chain().toggleBold().run() },
    { name: "Italic", key: "italic" as const, shortcut: "I", Icon: TextItalic, run: () => editor.chain().toggleItalic().run() },
    { name: "Strikethrough", key: "strike" as const, shortcut: "Shift+S", Icon: TextStrikethrough, run: () => editor.chain().toggleStrike().run() },
    { name: "Inline code", key: "code" as const, shortcut: "E", Icon: Code, run: () => editor.chain().toggleCode().run() },
    { name: linkButtonName, key: "link" as const, shortcut: "K", Icon: LinkIcon, run: openLink },
  ];

  return (
    <TooltipGroup>
      {formats.map(({ name, key, shortcut, Icon, run }, index) => (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <Button
                nativeButton
                type="button"
                variant="ghost"
                tone="neutral"
                size="sm"
                shape="square"
                iconOnly
                loading={false}
                className="aria-pressed:bg-[var(--anaphor-input-disabled)]"
                aria-label={name}
                aria-pressed={activeMarks[key]}
                tabIndex={focusedIndex === index ? 0 : -1}
                onFocus={() => setFocusedIndex(index)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => { if (editor.isEditable) run(); }}
              >
                <Icon aria-hidden="true" />
              </Button>
            }
          />
          <TooltipPopup side="top" align="center" sideOffset={8}>
            {name}{" "}
            <KbdGroup aria-label={`${isMac ? "Command" : "Control"} ${shortcut}`}>
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              {shortcut.split("+").map(keyName => <Kbd key={keyName}>{keyName}</Kbd>)}
            </KbdGroup>
          </TooltipPopup>
        </Tooltip>
      ))}
    </TooltipGroup>
  );
}

export {
  FormattingButtons,
  linkButtonName,
};
