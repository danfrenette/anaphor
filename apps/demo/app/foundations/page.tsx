import { readFile } from "node:fs/promises";
import path from "node:path";
import { Text } from "@anaphor/system";
import { spring } from "../../../../packages/design-system/src/lib/motion";
import { FoundationReference } from "./reference";

export const metadata = { title: "Foundations · Anaphor" };

export default async function FoundationsPage() {
  const css = await readFile(path.resolve(process.cwd(), "../../packages/design-system/src/styles.css"), "utf8");
  const declarations = (source: string) => Object.fromEntries([...source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name = "", value = ""]) => [name, value.trim()]));
  const light = declarations(css.match(/^:root \{([^}]+)\}/m)?.[1] ?? "");
  const dark = { ...light, ...declarations(css.match(/^\.dark \{([^}]+)\}/m)?.[1] ?? "") };
  const tokens = declarations(css.replace(/^\.dark \{[^}]+\}/m, ""));
  return <main id="content" tabIndex={-1} className="min-w-0 px-[var(--anaphor-page-gutter)] py-12">
    <div className="mx-auto max-w-[1040px]">
      <Text as="p" variant="label">Foundation / Reference</Text>
      <Text as="h1" variant="title" className="mt-4">The shared vocabulary</Text>
      <Text as="p" variant="description" className="mt-4">Shipped values, their purpose, and the few deliberate exceptions. Experiments stay here; the rest of the manual keeps its approved defaults.</Text>
      <FoundationReference tokens={tokens} themes={{ light, dark }} springs={spring} />
    </div>
  </main>;
}
