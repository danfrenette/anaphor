import { Text } from "@anaphor/system";
import { SourceOutline } from "../../source-outline";

export const metadata = { title: "Collapsible playground · Anaphor" };

export default function CollapsiblePlayground() {
  return <main id="content" tabIndex={-1} className="mx-auto max-w-reading px-4 pt-10 pb-28 sm:px-8">
    <Text as="h1" variant="title">Collapsible playground</Text>
    <Text as="p" variant="description" className="mt-3">Expand chapters independently. Select a section, then close and reopen its chapter to keep your place.</Text>
    <div className="mt-8 max-w-sm"><SourceOutline /></div>
  </main>;
}
