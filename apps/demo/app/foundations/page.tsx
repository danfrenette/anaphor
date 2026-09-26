import { readFile } from "node:fs/promises";
import path from "node:path";
import { Text } from "@anaphor/system";
import { spring } from "../../../../packages/design-system/src/lib/motion";
import { FoundationReference } from "./reference";
import { extractInventory } from "./inventory";

export const metadata = { title: "Foundations · Anaphor" };

export default async function FoundationsPage() {
  const css = await readFile(path.resolve(process.cwd(), "../../packages/design-system/src/styles.css"), "utf8");
  const { tokens, themes } = extractInventory(css);
  return <main id="content" tabIndex={-1} className="min-w-0 px-[var(--anaphor-page-gutter)] py-12">
    <div className="mx-auto max-w-[1040px]">
      <Text as="p" variant="label">Foundation / Reference</Text>
      <Text as="h1" variant="title" className="mt-4">The shared vocabulary</Text>
      <Text as="p" variant="description" className="mt-4">Shipped values, their purpose, and the few deliberate exceptions. Experiments stay here; the rest of the manual keeps its approved defaults.</Text>
      <FoundationReference tokens={tokens} themes={themes} springs={spring} />
    </div>
  </main>;
}
