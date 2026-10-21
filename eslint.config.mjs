import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    },
  },
  {
    files: ["packages/design-system/src/index.ts"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "ExportAllDeclaration",
        message: "List public components and types explicitly; keep internal exports private (ARCHITECTURE.md).",
      }],
    },
  },
  {
    settings: {
      next: {
        rootDir: "apps/demo/",
      },
    },
  },
  {
    files: ["packages/design-system/src/components/media-viewer.tsx"],
    // Exact source pixels in a framework-neutral package require a native image.
    rules: { "@next/next/no-img-element": "off" },
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
