"use client";

import { FieldGroup, Badge, type BadgeProps } from "@anaphor/system";
import { Tag } from "@phosphor-icons/react";
import { useState } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

const defaults = { size: "md", variant: "soft", shape: "square", icon: false } as const;
export function BadgePlayground() {
  const [settings, setSettings] = useState<Required<Pick<BadgeProps, "size" | "variant" | "shape">> & { icon: boolean }>(defaults);
  return <>
    <PlaygroundControls sectionId="badge" title="Badge" onReset={() => setSettings(defaults)}>
      <FieldGroup>
        <Select label="Variant" value={settings.variant} options={["solid", "soft", "outline"] as const} onChange={(variant) => setSettings(s => ({ ...s, variant }))} />
        <Select label="Size" value={settings.size} options={["sm", "md", "lg"] as const} onChange={(size) => setSettings(s => ({ ...s, size }))} />
        <Select label="Shape" value={settings.shape} options={["square", "round"] as const} onChange={(shape) => setSettings(s => ({ ...s, shape }))} />
        <Check label="Icon" checked={settings.icon} onChange={(icon) => setSettings(s => ({ ...s, icon }))} />
      </FieldGroup>
    </PlaygroundControls>
    <div className="mt-4 flex min-h-32 items-center rounded-md border border-border bg-background p-6" aria-label="Badge preview" role="group">
      <Badge size={settings.size} variant={settings.variant} shape={settings.shape}>{settings.icon && <Tag aria-hidden="true" />}Reference</Badge>
    </div>
  </>;
}
