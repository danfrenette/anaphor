"use client";

import { useState } from "react";
import { Button, ButtonLabel, Section, Text, Toaster, createToastManager, type ToasterProps } from "@anaphor/system";
import { PlaygroundControls } from "./playground-host";
import { Select } from "./playground-fields";
import { CatalogExample } from "./catalog-example";

export function ToastDemo() {
  const [manager] = useState(() => createToastManager());
  const [position, setPosition] = useState<ToasterProps["position"]>("top-right");
  const [archived, setArchived] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(fail: boolean) {
    setSaving(true);
    try {
      await manager.promise(new Promise<void>((resolve, reject) => {
        window.setTimeout(() => fail ? reject(new Error("Offline")) : resolve(), 1800);
      }), {
        loading: { title: "Saving changes", description: "Updating the research note." },
        success: { title: "Changes saved", description: "The research note is up to date." },
        error: { title: "Changes weren’t saved", description: "Reconnect and try again. Your draft is still available.", timeout: 0 },
      });
    } catch {
      // The toast presents the simulated failure; the draft remains available.
    } finally {
      setSaving(false);
    }
  }

  function archive() {
    setArchived(true);
    const id = manager.add({
      title: "Note archived", description: "Research methods moved to the archive.", type: "success", timeout: 0,
      actionProps: { children: "Undo", onClick: () => { setArchived(false); manager.close(id); } },
    });
  }

  return <Section id="toast" className="border-t border-border py-12">
    <Text as="h2" variant="title">Toast</Text>
    <Text as="p" variant="description" className="mt-3">Brief feedback that keeps the task in view. Notifications stack at the edge; hover or focus expands the stack and pauses dismissal.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="Save a note" description="A simulated save updates one notification from loading to success or error. Errors remain until dismissed." code={`await toast.promise(saveNote(), {
  loading: "Saving changes",
  success: "Changes saved",
  error: { title: "Changes weren’t saved", timeout: 0 },
});`}>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" shape="square" tone="accent" variant="solid" iconOnly={false} loading={saving} nativeButton={true} type="button" onClick={() => void save(false)}><ButtonLabel>Save note</ButtonLabel></Button>
          <Button size="sm" shape="square" tone="neutral" variant="outline" iconOnly={false} loading={false} disabled={saving} nativeButton={true} type="button" onClick={() => void save(true)}><ButtonLabel>Simulate failed save</ButtonLabel></Button>
        </div>
      </CatalogExample>
      <CatalogExample title="Undo an archive" description="Actions stay available until explicitly dismissed. The application owns the operation and its reversal." code={`const id = toast.add({
  title: "Note archived", type: "success", timeout: 0,
  actionProps: { children: "Undo", onClick: () => {
    restoreNote();
    toast.close(id);
  } },
});`}>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm" shape="square" tone="neutral" variant="outline" iconOnly={false} loading={false} disabled={archived} nativeButton={true} type="button" onClick={archive}><ButtonLabel>Archive note</ButtonLabel></Button>
          <Text as="p" variant="caption">{archived ? "Research methods is archived." : "Research methods is in the library."}</Text>
        </div>
      </CatalogExample>
      <CatalogExample title="A burst of updates" description="Three notifications remain visible. Press F6 to enter the stack and Shift+Tab from the viewport to return to the task. Swipe or use Dismiss to clear a notification." code={`<Toaster toastManager={toast} position="${position}" timeout={5000} limit={3} />

toast.add({ title: "Library updated", description: "Three notes are ready.", type: "info" });`}>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" shape="square" tone="neutral" variant="outline" iconOnly={false} loading={false} nativeButton={true} type="button" onClick={() => {
            manager.add({ title: "Note imported", description: "Research methods is ready to read.", type: "success" });
            manager.add({ title: "Sync paused", description: "Reconnect to sync your latest changes.", type: "warning" });
            manager.add({ title: "Library updated", description: "Three notes are ready.", type: "info" });
          }}><ButtonLabel>Show stacked updates</ButtonLabel></Button>
          <Button size="sm" shape="square" tone="neutral" variant="ghost" iconOnly={false} loading={false} nativeButton={true} type="button" onClick={() => manager.close()}><ButtonLabel>Dismiss all</ButtonLabel></Button>
        </div>
      </CatalogExample>
    </div>
    <Text as="p" variant="caption" className="mt-6">Interaction reference: <a href="https://github.com/emilkowalski/sonner" className="underline underline-offset-4">Sonner</a>. Behavior: <a href="https://base-ui.com/react/components/toast" className="underline underline-offset-4">Base UI Toast</a>.</Text>
    <PlaygroundControls sectionId="toast" title="Toast" onReset={() => setPosition("top-right")}>
      <Select label="Position" value={position} options={["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]} onChange={setPosition} />
    </PlaygroundControls>
    <Toaster toastManager={manager} position={position} timeout={5000} limit={3} />
  </Section>;
}
