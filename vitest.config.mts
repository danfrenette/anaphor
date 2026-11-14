import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["packages/**/*.test.{ts,tsx}", "apps/demo/features/**/*.test.{ts,tsx}", "apps/demo/components/**/*.test.{ts,tsx}", "apps/demo/app/notebook-diagram.test.ts", "apps/demo/app/**/foundations/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
