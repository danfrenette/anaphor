"use client";

import {
  Button,
  ButtonLabel,
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "@anaphor/system";
import {
  CaretDown,
  FolderSimple,
  PencilSimple,
  ShareNetwork,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";

export function DropdownMenuExample() {
  const [lastAction, setLastAction] = useState("No action selected");

  return (
    <div className="grid min-h-72 place-items-center rounded-card border border-border bg-background px-6 py-12">
      <div className="grid justify-items-center gap-5">
        <Menu>
          <MenuTrigger render={<Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="neutral" variant="outline" />}>
            <ButtonLabel>File actions</ButtonLabel>
            <CaretDown aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup side="bottom" sideOffset={6} align="start">
            <MenuGroup>
              <MenuGroupLabel>Document</MenuGroupLabel>
              <MenuItem variant="default" onClick={() => setLastAction("Rename selected")}>
                <PencilSimple aria-hidden="true" />
                Rename
                <MenuShortcut>R</MenuShortcut>
              </MenuItem>
              <MenuItem variant="default" onClick={() => setLastAction("Move selected")}>
                <FolderSimple aria-hidden="true" />
                Move to…
              </MenuItem>
              <MenuItem variant="default" onClick={() => setLastAction("Share selected")}>
                <ShareNetwork aria-hidden="true" />
                Share
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem variant="destructive" onClick={() => setLastAction("Delete selected")}>
              <Trash aria-hidden="true" />
              Delete
              <MenuShortcut>⌘⌫</MenuShortcut>
            </MenuItem>
          </MenuPopup>
        </Menu>
        <p aria-live="polite" className="min-h-5 text-small text-muted-foreground">
          {lastAction}
        </p>
      </div>
    </div>
  );
}
