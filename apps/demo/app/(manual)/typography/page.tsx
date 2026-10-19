import { Text } from "@anaphor/system";
import { TypographyOverview } from "./typography-overview";
import { TypographySpecimen } from "./typography-specimen";

export const metadata = { title: "Typography · Anaphor" };

export default function TypographyPage() {
  return (
    <main id="content" tabIndex={-1} className="min-w-0 px-[var(--anaphor-page-gutter)] py-12">
      <div className="mx-auto max-w-[840px]">
        <Text as="h1" variant="title">Typography</Text>
        <Text as="p" variant="description" className="mt-4">
          Reading, navigation, and literal values share a small kit. Document
          structure chooses the heading level; purpose chooses its appearance.
        </Text>
        <TypographyOverview />
        <TypographySpecimen />
      </div>
    </main>
  );
}
