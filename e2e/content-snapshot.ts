import type { Page } from "@playwright/test";

/** Let tall manual examples render completely for element-level image baselines. */
export function prepareContentSnapshot(page: Page) {
  return page.addStyleTag({ content: `
    [data-app-shell] { position: relative !important; inset: auto !important; height: auto !important; overflow: visible !important; }
    [data-app-shell] [data-slot="workspace-card"] { margin: 0 !important; overflow: visible !important; }
    [data-app-shell] [data-slot="workspace-card-body"] { overflow: visible !important; }
    [data-app-shell] [data-slot="workspace-top-bar"],
    [data-app-shell] [data-slot="bottom-bar"],
    [data-app-shell] [data-slot="sidebar"],
    [data-slot="morph-surface"] { visibility: hidden !important; }
  ` });
}
