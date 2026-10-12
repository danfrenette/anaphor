import { defineConfig, devices } from "@playwright/test";
import { tourTestEnv } from "./e2e/tour-env";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3105",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
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
    command: "node apps/demo/scripts/playwright-server.mjs",
    url: "http://127.0.0.1:3105",
    reuseExistingServer: false,
    timeout: 180_000,
    env: { ...process.env, ...tourTestEnv },
  },
});
