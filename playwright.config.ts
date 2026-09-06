import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3105",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone SE (3rd gen)"],
        viewport: { width: 320, height: 800 },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm --filter @design-language/demo exec next start --port 3105",
    url: "http://127.0.0.1:3105",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
