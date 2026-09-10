export const extensions = [
  { id: 'models', title: 'models.dev', detail: 'Supplies the model catalogue', icon: 'layers' },
  { id: 'limits', title: 'Half limits', detail: 'Halves every output limit', icon: 'half' },
  { id: 'policy', title: 'Company policy', detail: 'Disables two models', icon: 'shield' },
  { id: 'skills', title: 'Skills folder', detail: 'Discovers skill folders', icon: 'folder' },
  { id: 'chrome', title: 'Chrome', detail: 'Adds a browser tool', icon: 'chrome' },
] as const;
export type SharedState = { models: number; skills: number; tools: number; limit: string; allowed: number; revision: number };
export const initial: SharedState = { models: 0, skills: 0, tools: 3, limit: '32k', allowed: 0, revision: 0 };

export type ExtensionId = (typeof extensions)[number]['id'];
