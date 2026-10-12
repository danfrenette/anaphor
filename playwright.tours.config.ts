import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

if (!process.env.TOUR_TEST_DATABASE_URL) throw new Error("Supply an isolated TOUR_TEST_DATABASE_URL; this suite seeds fictional identity sessions.");

export default defineConfig({
  ...base,
  testMatch: "tours.spec.ts",
  testIgnore: [],
  workers: 1,
  webServer: {
    command: "pnpm build && pnpm --filter @anaphor/demo exec next start --port 3105",
    url: "http://127.0.0.1:3105",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.TOUR_TEST_DATABASE_URL,
      BETTER_AUTH_URL: "http://127.0.0.1:3105",
      BETTER_AUTH_SECRET: "fictional-local-test-secret-at-least-32-chars",
      ANAPHOR_GOOGLE_OWNER_ID: "fixture-google",
      ANAPHOR_GITHUB_OWNER_ID: "fixture-github",
    },
  },
});
