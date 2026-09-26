import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { extractInventory } from "./inventory";
import { requireToken } from "./tokens";

const css = readFileSync("packages/design-system/src/styles.css", "utf8");

test("formatting does not change shipped theme inventories", () => {
  const expected = extractInventory(css);
  expect(extractInventory(css.replaceAll(" {", "{"))).toEqual(expected);
  expect(expected.themes.light["--anaphor-background"]).toBe("oklch(0.985 0.008 85)");
  expect(expected.themes.dark["--anaphor-background"]).toBe("oklch(0.2 0.01 50)");
  expect(expected.tokens["--color-foreground"]).toBe("var(--anaphor-font-secondary)");
});

test("missing theme blocks and backing variables fail clearly", () => {
  expect(() => extractInventory(css.replace(/^\.dark \{/m, ".missing {"))).toThrow("theme blocks");
  expect(() => extractInventory(css.replaceAll(/--anaphor-brand:[^;]+;/g, ""))).toThrow("--anaphor-brand");
  expect(() => requireToken({}, "--color-primary")).toThrow("--color-primary");
});

test("conditional and component overrides do not leak into the base inventory", () => {
  const actual = extractInventory(`${css}\n@media (min-width: 100rem) { :root { --anaphor-background: red; } }\n.sample { --anaphor-brand: blue; }`);
  expect(actual).toEqual(extractInventory(css));
});
