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
import type { MenuPopupProps } from "@anaphor/system";

export function DropdownMenuExample({ label = "File actions", side = "bottom", align = "start", icons = true, shortcuts = true, disableShare = false }: { label?: string; side?: MenuPopupProps["side"]; align?: MenuPopupProps["align"]; icons?: boolean; shortcuts?: boolean; disableShare?: boolean }) {
  const [lastAction, setLastAction] = useState("No action selected");

  return (
    <div className="grid min-h-64 place-items-center">
      <div className="grid justify-items-center gap-5">
        <Menu>
          <MenuTrigger render={<Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="neutral" variant="outline" />}>
            <ButtonLabel>{label}</ButtonLabel>
            <CaretDown aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup side={side} sideOffset={6} align={align}>
            <MenuGroup>
              <MenuGroupLabel>Document</MenuGroupLabel>
              <MenuItem variant="default" onClick={() => setLastAction("Rename selected")}>
                {icons && <PencilSimple aria-hidden="true" />}
                Rename
                {shortcuts && <MenuShortcut>R</MenuShortcut>}
              </MenuItem>
              <MenuItem variant="default" onClick={() => setLastAction("Move selected")}>
                {icons && <FolderSimple aria-hidden="true" />}
                Move to…
              </MenuItem>
              <MenuItem variant="default" disabled={disableShare} onClick={() => setLastAction("Share selected")}>
                {icons && <ShareNetwork aria-hidden="true" />}
                Share
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem variant="destructive" onClick={() => setLastAction("Delete selected")}>
              {icons && <Trash aria-hidden="true" />}
              Delete
              {shortcuts && <MenuShortcut>⌘⌫</MenuShortcut>}
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
