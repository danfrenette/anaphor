import { Text } from "@anaphor/system";
import { TypographySpecimen } from "./typography-specimen";

export const metadata = { title: "Typography · Anaphor" };

export default function TypographyPage() {
  return (
    <main id="content" tabIndex={-1} className="min-w-0 px-[var(--anaphor-page-gutter)] py-12">
      <div className="mx-auto max-w-[840px]">
        <Text as="p" variant="label">Foundation / Typography</Text>
        <Text as="h1" variant="title" className="mt-4">Type in use</Text>
        <Text as="p" variant="description" className="mt-4">
          Reading, navigation, and literal values share a small kit. Document
          structure chooses the heading level; purpose chooses its appearance.
        </Text>
        <TypographySpecimen />
      </div>
    </main>
  );
}
