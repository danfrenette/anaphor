"use client";

import { Button, ButtonLabel, Popover, PopoverBody, PopoverClose, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger, Section, Text } from "@anaphor/system";
import { PopoverPlayground, PopoverPreferences, popoverSettingsCode } from "./popover-playground";
import { CatalogExample } from "./catalog-example";

const anatomyCode = `<Popover>
  <PopoverTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}>About this workspace</PopoverTrigger>
  <PopoverPopup side="bottom" align="center" sideOffset={8}>
    <PopoverBody>
      <PopoverTitle>Workspace details</PopoverTitle>
      <PopoverDescription>A shared place for references and notes.</PopoverDescription>
      <p className="mt-4 text-ui">Keep supporting information close to the task.</p>
      <PopoverClose render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}>Done</PopoverClose>
    </PopoverBody>
  </PopoverPopup>
</Popover>`;

export function PopoverDemo() {
  return <Section id="popover" className="border-t border-border py-12">
    <Text as="h2" variant="title">Popover</Text>
    <Text as="p" variant="description" className="mt-3">A small workspace for settings, filters, and details, anchored to its trigger.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Anatomy" description="A trigger, title, description, supporting content, and a clear close action." code={anatomyCode}>
        <div className="grid min-h-48 place-items-center"><Popover>
          <PopoverTrigger render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}><ButtonLabel>About this workspace</ButtonLabel></PopoverTrigger>
          <PopoverPopup side="bottom" align="center" sideOffset={8}><PopoverBody>
            <PopoverTitle>Workspace details</PopoverTitle><PopoverDescription>A shared place for references and notes.</PopoverDescription>
            <p className="mt-4 text-ui">Keep supporting information close to the task.</p>
            <PopoverClose className="mt-4 w-full" render={<Button nativeButton type="button" variant="outline" tone="neutral" size="md" shape="square" iconOnly={false} loading={false} />}><ButtonLabel>Done</ButtonLabel></PopoverClose>
          </PopoverBody></PopoverPopup>
        </Popover></div>
      </CatalogExample>
      <CatalogExample title="Interactive content" description="Edit a name, choose density from a nested menu, and toggle details. Changes apply immediately." code={popoverSettingsCode()}>
        <PopoverPreferences label="Edit preferences" />
      </CatalogExample>
      <PopoverPlayground />
    </div>
    <p className="mt-4 text-small text-muted-foreground">Escape or Done closes the panel and returns focus. Outside presses dismiss it; content scrolls when space is limited.</p>
  </Section>;
}
