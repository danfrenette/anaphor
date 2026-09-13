import { Button, SidebarProvider, type ButtonProps, type SidebarProviderProps } from "@anaphor/system";

const button = {
  iconOnly: false,
  loading: false,
  nativeButton: true,
  type: "button",
  shape: "square",
  size: "md",
  variant: "solid",
  tone: "accent",
} satisfies ButtonProps;

<Button {...button} />;
const { tone, ...withoutTone } = button;
void tone;
<Button {...withoutTone} variant="destructive" />;
// @ts-expect-error Destructive buttons do not have a configurable tone.
<Button {...button} variant="destructive" />;
// @ts-expect-error A normal variant requires an explicit tone.
<Button {...withoutTone} />;
const { size, ...withoutSize } = button;
void size;
// @ts-expect-error Size must be supplied rather than silently defaulted.
<Button {...withoutSize} />;
const { type, ...withoutType } = button;
void type;
<Button {...withoutType} nativeButton={false} render={<a href="#target" />} />;
// @ts-expect-error A non-native button needs a render target.
<Button {...withoutType} nativeButton={false} />;
// @ts-expect-error Native button type does not apply to a non-native target.
<Button {...button} nativeButton={false} render={<a href="#target" />} />;

const sidebar = {
  mode: "uncontrolled",
  defaultOpen: true,
  shortcut: "b",
  resizable: false,
} satisfies SidebarProviderProps;
<SidebarProvider {...sidebar} />;
<SidebarProvider mode="controlled" open={true} onOpenChange={() => {}} shortcut={null} resizable={false} />;
// @ts-expect-error Controlled state requires a change handler.
<SidebarProvider mode="controlled" open={true} shortcut={null} resizable={false} />;
// @ts-expect-error Controlled and initial state cannot be combined.
<SidebarProvider {...sidebar} open={false} />;
// @ts-expect-error Configuration cannot be omitted in favor of hidden defaults.
<SidebarProvider />;
