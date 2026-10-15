import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
import { join } from "node:path";
import { tmpdir } from "node:os";

process.env.ANAPHOR_TOUR_WORKSPACE ??= join(tmpdir(), `anaphor-local-tours-${process.pid}`);
export default defineConfig({
  ...base,
  testMatch: "local-tours.spec.ts",
  testIgnore: [],
  fullyParallel: false,
  workers: 1,
  use: { ...base.use, baseURL: "http://127.0.0.1:3018" },
  webServer: {
    command: "pnpm --filter @anaphor/demo exec next dev --hostname 127.0.0.1 --port 3018",
    url: "http://127.0.0.1:3018",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ANAPHOR_LOCAL_PREVIEW: "1", ANAPHOR_TOUR_WORKSPACE: process.env.ANAPHOR_TOUR_WORKSPACE },
  },
});
