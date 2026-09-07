"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, type BadgeProps } from "@design-language/system";
import { Tag } from "@phosphor-icons/react";
import { useState } from "react";
import { PlaygroundControls } from "./playground-host";
import { Check, Select } from "./playground-fields";

const defaults = { size: "md", variant: "soft", shape: "square", icon: false } as const;
export function BadgePlayground() {
  const [settings, setSettings] = useState<Required<Pick<BadgeProps, "size" | "variant" | "shape">> & { icon: boolean }>(defaults);
  return <>
    <PlaygroundControls sectionId="badge" title="Badge" onReset={() => setSettings(defaults)}>
      <div className="grid gap-3">
        <Select label="Variant" value={settings.variant} options={["solid", "soft", "outline"] as const} onChange={(variant) => setSettings(s => ({ ...s, variant }))} />
        <Select label="Size" value={settings.size} options={["sm", "md", "lg"] as const} onChange={(size) => setSettings(s => ({ ...s, size }))} />
        <Select label="Shape" value={settings.shape} options={["square", "round"] as const} onChange={(shape) => setSettings(s => ({ ...s, shape }))} />
        <Check label="Icon" checked={settings.icon} onChange={(icon) => setSettings(s => ({ ...s, icon }))} />
      </div>
    </PlaygroundControls>
    <Card className="bg-background" aria-label="Badge preview" role="group">
      <CardHeader className="p-4 pb-1"><CardTitle className="text-label text-muted-foreground uppercase font-normal">Primary demo</CardTitle></CardHeader>
      <CardContent className="flex min-h-32 items-center justify-center p-6">
      <Badge size={settings.size} variant={settings.variant} shape={settings.shape}>{settings.icon && <Tag aria-hidden="true" />}Study 01</Badge>
      </CardContent>
    </Card>
  </>;
}
