import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["packages/**/*.test.{ts,tsx}", "apps/demo/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
