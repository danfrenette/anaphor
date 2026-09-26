import { parse, type Container } from "postcss";
import { requireToken, type Tokens } from "./tokens";

export function extractInventory(css: string) {
  const root = parse(css);
  const light: Tokens = {};
  const overrides: Tokens = {};
  const tokens: Tokens = {};
  let hasLight = false;
  let hasDark = false;
  const collect = (node: Container, target: Tokens) => {
    node.each(child => {
      if (child.type === "decl" && child.prop.startsWith("--")) target[child.prop] = child.value;
    });
  };
  root.each(node => {
    if (node.type === "rule") {
      if (node.selectors.includes(":root")) {
        hasLight = true;
        collect(node, light);
        collect(node, tokens);
      } else if (node.selector.trim() === ".dark") {
        hasDark = true;
        collect(node, overrides);
      }
    } else if (node.type === "atrule" && node.name === "theme") {
      collect(node, tokens);
    }
  });
  if (!hasLight || !hasDark) throw new Error("Foundation inventory requires :root and .dark theme blocks");
  const dark = { ...light, ...overrides };
  for (const values of [light, dark]) {
    for (const value of Object.values({ ...tokens, ...values })) {
      for (const [, name] of value?.matchAll(/var\(\s*(--[\w-]+)/g) ?? []) {
        if (name) requireToken({ ...tokens, ...values }, name);
      }
    }
  }
  return { tokens, themes: { light, dark } };
}
