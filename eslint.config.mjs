import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    settings: {
      next: {
        rootDir: "apps/demo/",
      },
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/out/**",
    "examples/**",
    "playwright-report/**",
    "test-results/**",
    "**/next-env.d.ts",
  ]),
]);
